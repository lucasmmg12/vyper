import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Producto } from '@/types/ecommerce';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages = [], storeType = 'mayorista' } = body;

    // Fetch active products from Supabase
    const { data: rawProducts } = await supabase
      .from('productos')
      .select(
        'id, nombre, descripcion, precio_mayorista, precio_unitario, precio_costo, stock, cantidad_minima, en_oferta, precio_oferta, imagenes, variantes, activo, destacado, categoria:categorias(id, nombre), marca:marcas(id, nombre)'
      )
      .eq('activo', true)
      .limit(120);

    const productos: Producto[] = (rawProducts || []).map((p: any) => ({
      ...p,
      precio_mayorista:
        storeType === 'minorista' && p.precio_unitario > 0
          ? p.precio_unitario
          : p.precio_mayorista,
    }));

    const lastUserMessage =
      [...messages].reverse().find((m: { role: string; content: string }) => m.role === 'user')?.content || '';

    // Build compact product catalog context for AI
    const catalogSummary = productos
      .slice(0, 80)
      .map(p => {
        const price = p.en_oferta && p.precio_oferta > 0 ? p.precio_oferta : p.precio_mayorista;
        const vars =
          p.variantes && p.variantes.length > 0
            ? ` [Sabores/Variantes: ${p.variantes.map(v => v.nombre).join(', ')}]`
            : '';
        return `- ID:${p.id} | ${p.nombre} (${p.marca?.nombre || 'Vyper'} - ${p.categoria?.nombre || 'Suplementos'}) | $${price}${vars}`;
      })
      .join('\n');

    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      const systemPrompt = `Sos el Personal Shopper IA y Nutricionista Deportivo experto de VYPER SUPLEMENTOS (${
        storeType === 'mayorista'
          ? 'Canal Mayorista B2B para gimnasios, dietéticas y revendedores'
          : 'Tienda Oficial Minorista B2C para atletas y entrenamiento'
      }).
Tu objetivo es asesorar con calidez, precisión técnica y enfoque comercial, recomendando entre 2 y 4 productos reales del catálogo de Vyper.
Reglas:
1. Respondé en español rioplatense claro, conciso y motivador (máximo 120 palabras).
2. Devolvé SIEMPRE un JSON válido con esta estructura exacta:
{
  "reply": "tu respuesta asesorando al cliente...",
  "recommendedProductIds": ["id1", "id2"]
}
3. Elegí únicamente IDs reales de la siguiente lista de productos disponibles en Vyper:
${catalogSummary}`;

      const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-6).map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          temperature: 0.5,
          max_tokens: 500,
        }),
      });

      if (openAiRes.ok) {
        const aiData = await openAiRes.json();
        const content = aiData.choices?.[0]?.message?.content;
        if (content) {
          try {
            const parsed = JSON.parse(content);
            const recIds: string[] = Array.isArray(parsed.recommendedProductIds)
              ? parsed.recommendedProductIds
              : [];
            const recommendedProducts = productos.filter(p => recIds.includes(p.id)).slice(0, 4);
            return NextResponse.json({
              reply: parsed.reply || '¡Aquí tenés mis recomendaciones destacadas de Vyper!',
              recommendedProducts,
            });
          } catch {
            // Fall through to smart local matcher
          }
        }
      }
    }

    // Smart Fallback Nutritionist & Sales Advisor if OPENAI_API_KEY is not configured or fails
    const q = lastUserMessage.toLowerCase();
    let matched: Producto[] = [];
    let replyText = '';

    if (q.includes('masa') || q.includes('muscul') || q.includes('volumen') || q.includes('fuerza') || q.includes('ganar')) {
      matched = productos.filter(p => {
        const text = `${p.nombre} ${p.categoria?.nombre || ''} ${p.descripcion || ''}`.toLowerCase();
        return text.includes('whey') || text.includes('prote') || text.includes('creatina') || text.includes('mass') || text.includes('ganador');
      });
      replyText =
        storeType === 'mayorista'
          ? '💪 Para clientes que buscan **aumento de masa muscular y fuerza**, el dúo de mayor rotación en gimnasios es **Whey Protein + Creatina Monohidrato**. Te seleccioné las opciones más rentables de nuestro catálogo:'
          : '💪 Para **ganar masa muscular y fuerza**, la combinación ideal respaldada por evidencia es **Proteína Whey** post-entreno junto con **Creatina Monohidrato** todos los días. ¡Mirá estas opciones listas para agregar a tu pedido!';
    } else if (q.includes('quemar') || q.includes('bajar') || q.includes('defin') || q.includes('energia') || q.includes('pre')) {
      matched = productos.filter(p => {
        const text = `${p.nombre} ${p.categoria?.nombre || ''} ${p.descripcion || ''}`.toLowerCase();
        return text.includes('quemador') || text.includes('pre') || text.includes('lipo') || text.includes('carnitina') || text.includes('caffeine') || text.includes('amino');
      });
      replyText =
        '🔥 Para **definición, foco y energía explosiva** en el entrenamiento, te recomiendo combinar un buen **Pre-Entreno** o **Quemador termogénico** con aminoácidos. Estas son nuestras mejores opciones disponibles:';
    } else if (q.includes('revender') || q.includes('gimnasio') || q.includes('mayorista') || q.includes('combo') || q.includes('oferta')) {
      matched = productos.filter(p => p.en_oferta || p.destacado);
      replyText =
        '🚀 Si estás armando stock para **revender en tu gimnasio o tienda**, te sugiero empezar por los suplementos líderes en rotación (Proteínas, Creatinas y Pre-entrenos en oferta). Acá tenés los destacados con mejor margen:';
    } else {
      // Keyword search or top featured
      const words = q.split(/\s+/).filter((w: string) => w.length > 3);
      if (words.length > 0) {
        matched = productos.filter(p => {
          const text = `${p.nombre} ${p.marca?.nombre || ''} ${p.categoria?.nombre || ''}`.toLowerCase();
          return words.some((w: string) => text.includes(w));
        });
      }
      if (matched.length === 0) {
        matched = productos.filter(p => p.destacado || p.en_oferta);
      }
      replyText =
        '✨ ¡Excelente consulta! Seleccioné los suplementos más recomendados de **Vyper** según lo que buscás. Podés agregarlos con 1 clic directamente a tu pedido:';
    }

    if (matched.length === 0) {
      matched = productos.slice(0, 4);
    }

    return NextResponse.json({
      reply: replyText,
      recommendedProducts: matched.slice(0, 4),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error en Personal Shopper IA' },
      { status: 500 }
    );
  }
}
