import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const historial = searchParams.get('historial');
  const clave = searchParams.get('clave');

  if (historial) {
    const histKey = `historial_${historial}`;
    const { data, error } = await supabase
      .from('configuraciones')
      .select('*')
      .eq('clave', histKey)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ historial: data?.valor?.snapshots || [] });
  }

  let data, error;

  if (clave) {
    const res = await supabase.from('configuraciones').select('*').eq('clave', clave).single();
    data = res.data;
    error = res.error;
  } else {
    const res = await supabase.from('configuraciones').select('*');
    data = res.data;
    error = res.error;
  }

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  try {
    const { clave, valor } = await request.json();

    if (!clave || !valor) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // Save snapshot of previous version in historial_${clave} (max 10 snapshots)
    if (!String(clave).startsWith('historial_')) {
      try {
        const { data: currentRow } = await supabase
          .from('configuraciones')
          .select('valor')
          .eq('clave', clave)
          .single();

        if (currentRow && currentRow.valor) {
          const histKey = `historial_${clave}`;
          const { data: histRow } = await supabase
            .from('configuraciones')
            .select('valor')
            .eq('clave', histKey)
            .single();

          const existingSnapshots = Array.isArray(histRow?.valor?.snapshots)
            ? histRow.valor.snapshots
            : [];

          const updatedSnapshots = [
            { fecha: new Date().toISOString(), valor: currentRow.valor },
            ...existingSnapshots,
          ].slice(0, 10);

          await supabase
            .from('configuraciones')
            .upsert(
              {
                clave: histKey,
                valor: { snapshots: updatedSnapshots },
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'clave' }
            );
        }
      } catch (histError) {
        console.warn('[configuraciones PUT] No se pudo guardar snapshot en historial:', histError);
      }
    }

    const { data, error } = await supabase
      .from('configuraciones')
      .upsert({ clave, valor, updated_at: new Date().toISOString() }, { onConflict: 'clave' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
