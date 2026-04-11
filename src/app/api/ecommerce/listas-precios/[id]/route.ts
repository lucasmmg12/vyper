import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — Get single price list with escalones
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('listas_precios')
    .select('*, escalones:lista_precio_escalones(*)')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ lista: data });
}

// PUT — Update price list + escalones
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { escalones, ...listaData } = body;

  // Update list header
  const { data, error } = await supabase
    .from('listas_precios')
    .update({
      ...listaData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If escalones provided, replace them
  if (escalones !== undefined) {
    // Delete existing escalones
    await supabase
      .from('lista_precio_escalones')
      .delete()
      .eq('lista_id', id);

    // Insert new ones
    if (escalones.length > 0) {
      const escalonesData = escalones.map((e: {
        cantidad_minima: number;
        multiplicador: number;
      }, index: number) => ({
        lista_id: id,
        cantidad_minima: e.cantidad_minima,
        multiplicador: e.multiplicador,
        orden: index,
      }));

      await supabase
        .from('lista_precio_escalones')
        .insert(escalonesData);
    }
  }

  // Return full list with escalones
  const { data: full } = await supabase
    .from('listas_precios')
    .select('*, escalones:lista_precio_escalones(*)')
    .eq('id', id)
    .single();

  return NextResponse.json({ lista: full });
}

// DELETE — Delete price list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from('listas_precios')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
