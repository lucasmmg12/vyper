import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — Get single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const searchParams = request.nextUrl.searchParams;
  const tienda = searchParams.get('tienda') || 'mayorista';

  const { data, error } = await supabase
    .from('productos')
    .select(`
      *, 
      categoria:categorias(*,rubro:rubros(*)), 
      marca:marcas(*), 
      lista_precio:listas_precios!lista_precio_id(*, escalones:lista_precio_escalones(*)),
      lista_precio_minorista:listas_precios!lista_precio_minorista_id(*, escalones:lista_precio_escalones(*)),
      lista_escalonada:listas_precios!lista_escalonada_id(*, escalones:lista_precio_escalones(*)),
      lista_escalonada_minorista:listas_precios!lista_escalonada_minorista_id(*, escalones:lista_precio_escalones(*))
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const { data: defaultList } = await supabase
    .from('listas_precios')
    .select('*, escalones:lista_precio_escalones(*)')
    .eq('activo', true)
    .eq(tienda === 'minorista' ? 'es_default_minorista' : 'es_default', true)
    .single();

  const overrideList = tienda === 'minorista' ? data.lista_precio_minorista : data.lista_precio;
  const listToUse = overrideList || defaultList;
  const appliedMarkup = listToUse?.markup || 1;
  const computedPrice = data.precio_costo ? Math.round(data.precio_costo * appliedMarkup) : (tienda === 'minorista' ? data.precio_unitario : data.precio_mayorista);
  
  const escalonadaToUse = tienda === 'minorista' ? data.lista_escalonada_minorista : data.lista_escalonada;

  const mappedData = {
    ...data,
    precio_mayorista: computedPrice,
    lista_activa: listToUse,
    lista_escalonada_activa: escalonadaToUse,
  };

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
