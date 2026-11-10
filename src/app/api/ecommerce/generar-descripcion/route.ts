import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Optional fast batch price update helper
  if (body.action === 'mass-price-update' && Array.isArray(body.updates)) {
    let updatedCount = 0;
    const now = new Date().toISOString();
    for (const u of body.updates) {
      if (!u.id) continue;
      const fields: Record<string, unknown> = { updated_at: now };
      if (typeof u.precio_costo === 'number') fields.precio_costo = u.precio_costo;
      if (typeof u.precio_mayorista === 'number') fields.precio_mayorista = u.precio_mayorista;
      if (typeof u.precio_unitario === 'number') fields.precio_unitario = u.precio_unitario;

      const { error } = await supabase
        .from('productos')
        .update(fields)
        .eq('id', u.id);

      if (!error) updatedCount++;
    }
    return NextResponse.json({ success: true, updatedCount });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key de OpenAI no configurada' }, { status: 500 });
  }

  // BULK MODE: generate descriptions for up to 15 products at once and update Supabase
  if (body.bulk === true && Array.isArray(body.productos)) {
    const batch = body.productos.slice(0, 15) as {
      id: string;
      nombre: string;
      categoria?: string;
      marca?: string;
    }[];

    if (batch.length === 0) {
      return NextResponse.json({ updatedCount: 0, descripciones: {} });
    }

    const listText = batch
      .map(
        (p, idx) =>
          `${idx + 1}. ID: "${p.id}" | Producto: "${p.nombre}"${p.marca ? ` | Marca: "${p.marca}"` : ''}${p.categoria ? ` | Categoría: "${p.categoria}"` : ''}`
      )
      .join('\n');

    const bulkPrompt = `Sos un copywriter experto en suplementos deportivos y productos fitness para "Vyper Suplementos" (ecommerce B2B y minorista en Argentina).

Generá una descripción comercial atractiva, profesional y concisa (2 oraciones máximo por producto) en español rioplatense (vos, tenés, etc., sin emojis) para cada uno de los siguientes productos:

${listText}

Respondé ÚNICAMENTE con un objeto JSON válido con el formato:
{
  "descripciones": {
    "<ID_DEL_PRODUCTO>": "Descripción generada..."
  }
}`;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: bulkPrompt }],
          max_tokens: 1800,
          temperature: 0.7,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Error de OpenAI en modo masivo');
      }

      const rawContent = data.choices?.[0]?.message?.content?.trim() || '{}';
      const parsed = JSON.parse(rawContent);
      const descripciones: Record<string, string> = parsed.descripciones || {};

      let updatedCount = 0;
      const now = new Date().toISOString();

      for (const item of batch) {
        const desc = descripciones[item.id];
        if (desc && desc.trim()) {
          const { error } = await supabase
            .from('productos')
            .update({ descripcion: desc.trim(), updated_at: now })
            .eq('id', item.id);
          if (!error) updatedCount++;
        }
      }

      return NextResponse.json({ updatedCount, descripciones });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Error al generar descripciones masivas';
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  }

  // SINGLE PRODUCT MODE
  const { nombre, categoria, marca } = body;

  if (!nombre) {
    return NextResponse.json({ error: 'Nombre del producto requerido' }, { status: 400 });
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
