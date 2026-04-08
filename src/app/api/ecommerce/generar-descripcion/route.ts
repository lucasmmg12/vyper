import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nombre, categoria, marca } = body;

  if (!nombre) {
    return NextResponse.json({ error: 'Nombre del producto requerido' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key de OpenAI no configurada' }, { status: 500 });
  }

  const prompt = `Sos un copywriter experto en suplementos deportivos y productos fitness para un ecommerce B2B mayorista argentino llamado "Vyper Suplementos". 

Generá una descripción de producto atractiva, profesional y concisa (máximo 3 oraciones) para el siguiente producto:

Producto: ${nombre}
${categoria ? `Categoría: ${categoria}` : ''}
${marca ? `Marca: ${marca}` : ''}

Reglas:
- Usá español rioplatense (vos, sos, etc.)
- Mencioná beneficios clave del producto
- Orientá al comprador mayorista (revendedores, gimnasios, dietéticas)
- No uses emojis
- Sé directo y profesional`;

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
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Error de OpenAI');
    }

    const description = data.choices?.[0]?.message?.content?.trim() || '';

    return NextResponse.json({ descripcion: description });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error al generar descripción';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
