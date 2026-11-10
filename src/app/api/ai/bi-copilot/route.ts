import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      totalSales = 0,
      totalExpenses = 0,
      netBalance = 0,
      avgTicket = 0,
      avgLTV = 0,
      totalDebt = 0,
      debtClientsCount = 0,
      totalClients = 0,
      topDebtors = [],
      expenseCategories = [],
    } = body;

    const marginPct = totalSales > 0 ? ((netBalance / totalSales) * 100).toFixed(1) : '0.0';
    const debtRatioPct = totalSales > 0 ? ((totalDebt / totalSales) * 100).toFixed(1) : '0.0';

    const buildFallbackDiagnosis = () => ({
      resumen_ejecutivo: `El negocio registra ventas acumuladas por $${Number(totalSales).toLocaleString('es-AR')} y egresos por $${Number(totalExpenses).toLocaleString('es-AR')}, dejando un resultado neto de $${Number(netBalance).toLocaleString('es-AR')} (margen operativo del ${marginPct}%). La cartera activa cuenta con ${totalClients} clientes y un saldo por cobrar en cuenta corriente de $${Number(totalDebt).toLocaleString('es-AR')}.`,
      puntos_fuertes: [
        `Ticket promedio sólido de $${Math.round(avgTicket).toLocaleString('es-AR')} con un LTV promedio por cliente de $${Math.round(avgLTV).toLocaleString('es-AR')}.`,
        `Base activa de ${totalClients} clientes fidelizados dentro del ecosistema Vyper Coins.`,
        Number(netBalance) > 0
          ? `Flujo de caja neto positivo ($${Number(netBalance).toLocaleString('es-AR')}) con margen del ${marginPct}%.`
          : `Volumen comercial activo con oportunidades inmediatas de optimización de margen.`,
      ],
      alertas: [
        Number(totalDebt) > 0
          ? `Capital inmovilizado en Cuenta Corriente: $${Number(totalDebt).toLocaleString('es-AR')} distribuido en ${debtClientsCount} clientes (${debtRatioPct}% de las ventas).`
          : `Monitorear la rotación de inventario y costos de reposición ante variaciones de precios de proveedores.`,
        Number(marginPct) < 20
          ? `Margen neto ajustado (${marginPct}%): los egresos operativos ($${Number(totalExpenses).toLocaleString('es-AR')}) absorben gran parte de la facturación.`
          : `Concentración de egresos en las principales categorías operativas que requiere control mensual.`,
      ],
      acciones_recomendadas: [
        `Ejecutar campaña de cobranza por WhatsApp sobre los ${ Math.min(5, debtClientsCount || 5) } principales deudores para recuperar liquidez esta semana.`,
        `Activar el motor de Retención IA para clientes que compraron hace 25-35 días y elevar la recompra mensual.`,
        `Impulsar combos mayoristas de proteínas + creatinas para subir el ticket promedio un 15%.`,
        `Revisar listas de precios y aplicar ajuste porcentual en marcas con actualización reciente de costo.`,
      ],
    });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ diagnosis: buildFallbackDiagnosis() });
    }

    const prompt = `Sos el Director Financiero (CFO) y Consultor Estratégico IA de "Vyper Suplementos" (distribuidora mayorista y minorista de suplementos deportivos en San Juan, Argentina).

Analizá las siguientes métricas reales del negocio y generá un diagnóstico ejecutivo claro, directo y accionable en español rioplatense:

- Ventas Totales del período: $${Number(totalSales).toLocaleString('es-AR')}
- Gastos Totales del período: $${Number(totalExpenses).toLocaleString('es-AR')}
- Balance Neto: $${Number(netBalance).toLocaleString('es-AR')} (Margen: ${marginPct}%)
- Ticket Promedio: $${Math.round(avgTicket).toLocaleString('es-AR')}
- LTV Promedio: $${Math.round(avgLTV).toLocaleString('es-AR')}
- Clientes Totales: ${totalClients}
- Deuda Total en Cuenta Corriente (por cobrar): $${Number(totalDebt).toLocaleString('es-AR')} (${debtClientsCount} clientes deudores)
- Top Deudores: ${JSON.stringify(topDebtors.slice(0, 5))}
- Principales Categorías de Gasto: ${JSON.stringify(expenseCategories.slice(0, 5))}

Respondé ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "resumen_ejecutivo": "2 a 3 oraciones analizando la salud financiera actual con números concretos.",
  "puntos_fuertes": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "alertas": ["Alerta o cuello de botella 1", "Alerta o riesgo 2"],
  "acciones_recomendadas": ["Acción concreta 1 para esta semana", "Acción concreta 2", "Acción concreta 3", "Acción concreta 4"]
}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 900,
        temperature: 0.6,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ diagnosis: buildFallbackDiagnosis() });
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    const parsed = content ? JSON.parse(content) : buildFallbackDiagnosis();

    return NextResponse.json({ diagnosis: parsed });
  } catch (error) {
    console.error('Error in bi-copilot:', error);
    return NextResponse.json({ error: 'Error al generar el diagnóstico financiero' }, { status: 500 });
  }
}
