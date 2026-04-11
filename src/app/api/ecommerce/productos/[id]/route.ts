import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — Get single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('productos')
    .select('*, categoria:categorias(*,rubro:rubros(*)), marca:marcas(*), lista_precio:listas_precios(*, escalones:lista_precio_escalones(*))')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const { data: defaultList } = await supabase
    .from('listas_precios')
    .select('*, escalones:lista_precio_escalones(*)')
    .eq('activo', true)
    .eq('es_default', true)
    .single();

  const listToUse = data.lista_precio_id && data.lista_precio ? data.lista_precio : defaultList;
  const appliedMarkup = listToUse?.markup || 1;
  const computedMayorista = data.precio_costo ? Math.round(data.precio_costo * appliedMarkup) : data.precio_mayorista;

  const mappedData = { ...data, precio_mayorista: computedMayorista, lista_activa: listToUse };

  return NextResponse.json({ producto: mappedData });
}

// PUT — Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('productos')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ producto: data });
}

// DELETE — Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
