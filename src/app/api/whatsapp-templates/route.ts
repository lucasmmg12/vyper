import { NextRequest, NextResponse } from 'next/server';
import {
  listWhatsAppTemplates,
  sendWhatsAppTemplate,
  getTemplateMapping,
} from '@/lib/builderbot';
import { supabase } from '@/lib/supabase';

// GET /api/whatsapp-templates — Lista las plantillas aprobadas en Meta y la configuración actual
export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : 50;

  const [metaResult, mapping] = await Promise.all([
    listWhatsAppTemplates(limit),
    getTemplateMapping(),
  ]);

  return NextResponse.json({
    success: metaResult.success,
    templates: metaResult.data || [],
    error: metaResult.error || null,
    mapping,
  });
}

// POST /api/whatsapp-templates — Guarda el mapeo de plantillas o envía una plantilla de prueba
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'save-mapping') {
      const { mapping } = body;
      const { data, error } = await supabase
        .from('configuraciones')
        .upsert(
          {
            clave: 'whatsapp_meta_templates',
            valor: mapping,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'clave' }
        )
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, data });
    }

    if (body.action === 'send-test') {
      const { to, templateName, languageCode = 'es', parameters = [] } = body;
      if (!to || !templateName) {
        return NextResponse.json(
          { error: 'Faltan datos requeridos: to, templateName' },
          { status: 400 }
        );
      }

      const result = await sendWhatsAppTemplate({
        to,
        templateName,
        languageCode,
        parameters,
      });

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error, details: result.response },
          { status: 400 }
        );
      }

      return NextResponse.json({ ok: true, response: result.response });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error procesando solicitud' },
      { status: 500 }
    );
  }
}
