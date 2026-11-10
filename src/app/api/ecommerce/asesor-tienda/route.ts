import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `Sos el Asesor Virtual Inteligente del Editor de Tienda de Vyper Labs. Tu rol es guiar al usuario para personalizar su ecommerce mayorista y minorista, y también GENERAR propuestas de textos, títulos, marquesinas, colores, incentivos o preguntas frecuentes listas para aplicar con 1 clic.

CONOCIMIENTO COMPLETO DEL SISTEMA:

## Estructura del Editor (/admin/ecommerce/personalizacion)
1. **identidad** (tienda_identidad):
   - Campos: nombre_marca, nombre_completo, subtitulo_mayorista, subtitulo_minorista, logo_url, color_primario (hex), color_acento (hex), horario_atencion, email, tiktok, facebook.
2. **hero_mayorista** (tienda_hero_mayorista):
   - Campos: titulo, descripcion, subtexto, imagen_fondo_url, video_url, video_activo (boolean).
3. **hero_minorista** (tienda_hero_minorista):
   - Campos: titulo, descripcion, subtexto, imagen_fondo_url, video_url, video_activo (boolean).
4. **banners_mayorista** (tienda_banners_mayorista) y **banners_minorista** (tienda_banners_minorista):
   - Campos: activo (boolean), banners (array de { id, imagen_url, link, texto_alt, activo, orden }).
5. **marquesina_mayorista** (marquesina_mayorista) y **marquesina_minorista** (marquesina_minorista):
   - Campos: activo (boolean), mensajes (array de strings con emojis), bg_color (hex), text_color (hex).
6. **incentivos** (tienda_incentivos):
   - Campos: activo (boolean), envio_gratis_mayorista (number), envio_gratis_minorista (number), descuento_volumen_minimo (number), descuento_volumen_porcentaje (number).
7. **footer** (tienda_footer):
   - Campos: direccion, telefono, instagram, horario_atencion, email, tiktok, facebook, texto_creditos, url_creditos.
8. **whatsapp** (tienda_whatsapp):
   - Campos: numero_mayorista, numero_minorista, mensaje_mayorista, mensaje_minorista, mensaje_consulta, boton_flotante_activo (boolean), url_sucursal.
9. **faqs_mayorista** (tienda_faqs_mayorista) y **faqs_minorista** (tienda_faqs_minorista):
   - Campos: preguntas (array de { pregunta: string, respuesta: string }).

## FUNCIONALIDADES CLAVE DEL EDITOR
- **Vista Previa en Vivo**: Permite ver en pantalla dividida (Desktop o Celular, Mayorista o Minorista) cómo quedan los cambios antes de guardar.
- **Historial de Versiones**: Guarda automáticamente las últimas 10 versiones de cada sección para restaurar con 1 clic.
- **Subida Directa de Imágenes**: Permite arrastrar imágenes o pegar una URL en Logo, Hero y Banners.

## FORMATO DE RESPUESTA OBLIGATORIO (JSON)
Debes responder SIEMPRE con un objeto JSON válido con la siguiente estructura:
{
  "reply": "Tu respuesta amable, concisa y en español argentino (usando vos, podés, etc.).",
  "suggestedChanges": null | {
    "tab": "clave_de_tab_opcional (ej: hero_mayorista, marquesina_minorista, faqs_mayorista, identidad, etc.)",
    "fields": {
      // Campos exactos de la sección que sugerís modificar o completar
    }
  }
}

Cuándo incluir "suggestedChanges":
- Siempre que el usuario te pida redactar, mejorar, cambiar, sugerir o generar textos, títulos, descripciones, mensajes de marquesina, colores, montos de incentivos o preguntas frecuentes (FAQs), incluí en "suggestedChanges.fields" los valores listos para aplicar en la sección correspondiente (y especificá "tab" si corresponde a una pestaña específica).
- Si el usuario solo hace una pregunta conceptual de cómo usar el panel y no pide generar ni cambiar contenido, dejá "suggestedChanges": null.`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { messages, activeTab, currentConfig } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Mensajes requeridos' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
  }

  const contextMessage = {
    role: 'system',
    content: `Contexto actual del usuario en el editor:
- Pestaña activa (activeTab): "${activeTab || 'identidad'}"
- Valores actuales de la pestaña activa (currentConfig): ${JSON.stringify(currentConfig || {})}`,
  };

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
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          contextMessage,
          ...messages.slice(-10),
        ],
        max_tokens: 700,
        temperature: 0.6,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Error de OpenAI');
    }

    const rawContent = data.choices?.[0]?.message?.content?.trim() || '';
    let reply = 'No pude generar una respuesta.';
    let suggestedChanges: { tab?: string; fields: Record<string, unknown> } | undefined = undefined;

    try {
      const parsed = JSON.parse(rawContent);
      if (parsed && typeof parsed.reply === 'string') {
        reply = parsed.reply;
      }
      if (
        parsed &&
        parsed.suggestedChanges &&
        typeof parsed.suggestedChanges === 'object' &&
        parsed.suggestedChanges.fields &&
        typeof parsed.suggestedChanges.fields === 'object' &&
        Object.keys(parsed.suggestedChanges.fields).length > 0
      ) {
        suggestedChanges = {
          tab: parsed.suggestedChanges.tab || activeTab,
          fields: parsed.suggestedChanges.fields,
        };
      }
    } catch {
      reply = rawContent || 'No pude generar una respuesta.';
    }

    return NextResponse.json({ reply, suggestedChanges });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error al consultar el asesor';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
