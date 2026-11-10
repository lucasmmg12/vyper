import { NextRequest, NextResponse } from 'next/server';
import { getTier } from '@/utils/tiers';
import { sendDebtReminderNotification } from '@/lib/builderbot';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support Debt Reminder via BuilderBot (single or bulk)
    if (body.action === 'debt-reminder') {
      const { clientName, balance, phone, customMessage } = body;
      if (!phone) {
        return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 });
      }
      const sent = await sendDebtReminderNotification(
        clientName || 'Cliente',
        Number(balance || 0),
        phone,
        customMessage
      );
      return NextResponse.json({ sent });
    }

    const {
      clientName = 'Cliente',
      daysSinceLastPurchase = 30,
      lastPurchaseAmount = 0,
      coinBalance = 0,
      phone,
      customMessage,
      sendViaBot = false,
    } = body;

    // If user wants to send an already-composed message via BuilderBot
    if (sendViaBot && phone && customMessage) {
      const sent = await sendDebtReminderNotification(clientName, 0, phone, customMessage);
      return NextResponse.json({ sent, message: customMessage });
    }

    const firstName = clientName.split(' ')[0] || clientName;
    const tier = getTier(Number(coinBalance || 0));

    const buildFallbackMessage = () => {
      const coinsLine =
        Number(coinBalance) > 0
          ? `Además tenés *${coinBalance} Vyper Coins* acumuladas (Nivel ${tier.emoji} *${tier.name}*) listas para seguir sumando beneficios.`
          : `Recordá que con cada compra sumás *Vyper Coins* para canjear por premios y descuentos.`;

      return `¡Hola ${firstName}! 👋 ¿Cómo venís con el entrenamiento? Vi que hace unos ${daysSinceLastPurchase} días hiciste tu última compra en *Vyper Suplementos* y seguramente ya te estés quedando sin stock de tus suplementos 🦾.\n\n${coinsLine}\n\n¿Querés que te separe lo de siempre o te armamos un combo para enviarte hoy mismo?`;
    };

    const apiKey = process.env.OPENAI_API_KEY;
    let generatedMessage = buildFallbackMessage();

    if (apiKey) {
      const prompt = `Sos el encargado de atención al cliente VIP de "Vyper Suplementos" (tienda de suplementos deportivos en Argentina).
Redactá un mensaje de WhatsApp corto, cálido, persuasivo y muy natural en español rioplatense (usá "vos", "tenés", etc.) para reactivar a este cliente:

- Nombre: ${clientName} (saludalo por su nombre de pila: ${firstName})
- Días desde su última compra: ${daysSinceLastPurchase} días (un suplemento suele durar 30 días, así que está justo por quedarse sin producto)
- Monto de su última compra: $${Number(lastPurchaseAmount).toLocaleString('es-AR')}
- Saldo de fidelidad: ${coinBalance} Vyper Coins (Nivel actual: ${tier.emoji} ${tier.name}${tier.nextTier ? `, le faltan ${tier.coinsToNext} coins para subir a ${tier.nextTier}` : ', nivel máximo'})

Reglas:
- Máximo 3 párrafos cortos.
- Usá 2 o 3 emojis deportivos/amigables y negritas de WhatsApp (*texto*).
- Terminá con una pregunta abierta de cierre de venta (ej: si le separás su suplemento habitual o si quiere ver los combos de esta semana).
- Devolvé ÚNICAMENTE el texto del mensaje de WhatsApp, sin comillas ni explicaciones.`;

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 280,
            temperature: 0.75,
          }),
        });

        const data = await res.json();
        if (res.ok && data.choices?.[0]?.message?.content) {
          generatedMessage = data.choices[0].message.content.trim();
        }
      } catch (e) {
        console.error('OpenAI retention error, using fallback:', e);
      }
    }

    if (sendViaBot && phone) {
      const sent = await sendDebtReminderNotification(clientName, 0, phone, generatedMessage);
      return NextResponse.json({ message: generatedMessage, sent });
    }

    return NextResponse.json({ message: generatedMessage, sent: false });
  } catch (error) {
    console.error('Error in retention-message API:', error);
    return NextResponse.json({ error: 'Error generando mensaje de retención' }, { status: 500 });
  }
}
