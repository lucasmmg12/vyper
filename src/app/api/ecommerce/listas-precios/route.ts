import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — List all price lists
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activo = searchParams.get('activo');

  let query = supabase
    .from('listas_precios')
    .select('*, escalones:lista_precio_escalones(*)');

  if (activo === 'true') {
    query = query.eq('activo', true);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sort escalones by cantidad_minima
  const listas = (data || []).map((lista: Record<string, unknown>) => ({
    ...lista,
    escalones: ((lista.escalones as Array<{ cantidad_minima: number }>) || []).sort(
      (a: { cantidad_minima: number }, b: { cantidad_minima: number }) =>
        a.cantidad_minima - b.cantidad_minima
    ),
  }));

  return NextResponse.json({ listas });
}

// POST — Create a new price list
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nombre, descripcion, tipo, markup, activo, es_default, escalones } = body;

  // Create the list
  const { data: lista, error: listaError } = await supabase
    .from('listas_precios')
    .insert([{
      nombre,
      descripcion: descripcion || null,
      tipo: tipo || 'markup',
      markup: markup || 1.0,
      activo: activo ?? true,
      es_default: es_default ?? false,
    }])
    .select()
    .single();

  if (listaError || !lista) {
    return NextResponse.json({ error: listaError?.message || 'Error creando lista' }, { status: 500 });
  }

  // If escalonada, insert escalones
  if (tipo === 'escalonada' && escalones && escalones.length > 0) {
    const escalonesData = escalones.map((e: {
      cantidad_minima: number;
      multiplicador: number;
    }, index: number) => ({
      lista_id: lista.id,
      cantidad_minima: e.cantidad_minima,
      multiplicador: e.multiplicador,
      orden: index,
    }));

    const { error: escError } = await supabase
      .from('lista_precio_escalones')
      .insert(escalonesData);

    if (escError) {
      return NextResponse.json({ error: escError.message }, { status: 500 });
    }
  }

  // Return full list with escalones
  const { data: full } = await supabase
    .from('listas_precios')
    .select('*, escalones:lista_precio_escalones(*)')
    .eq('id', lista.id)
    .single();

  return NextResponse.json({ lista: full }, { status: 201 });
}
