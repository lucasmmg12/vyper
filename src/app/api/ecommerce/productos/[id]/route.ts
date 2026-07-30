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

  // Fetch variants (either explicitly defined in JSON or sibling products sharing same base name/brand)
  let variantes = data.variantes || [];

  if ((!variantes || variantes.length === 0) && data.nombre) {
    const baseTitle = data.nombre.split(' - ')[0].split(' (')[0].trim();
    if (baseTitle && baseTitle.length > 3) {
      const { data: siblings } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .ilike('nombre', `%${baseTitle}%`)
        .order('nombre', { ascending: true })
        .limit(25);

      if (siblings && siblings.length > 1) {
        variantes = siblings.map(s => {
          let flavorName = s.nombre.replace(baseTitle, '').replace(/^[\s\-–—:]+/, '').trim();
          if ((!flavorName || flavorName === s.nombre) && s.descripcion && s.descripcion.includes('Opción:')) {
            const optMatch = s.descripcion.match(/Opción:\s*([^;.\n]+)/i);
            if (optMatch) flavorName = optMatch[1].trim();
          }
          if (!flavorName) flavorName = s.nombre;
          const vPrice = s.precio_costo ? Math.round(s.precio_costo * appliedMarkup) : (tienda === 'minorista' ? s.precio_unitario : s.precio_mayorista);
          return {
            id: s.id,
            sku: s.sku,
            nombre: flavorName,
            precio: vPrice,
            stock: s.stock,
            imagen: s.imagenes?.[0],
            activo: s.activo,
          };
        });
      }
    }
  }

  const mappedData = {
    ...data,
    precio_mayorista: computedPrice,
    lista_activa: listToUse,
    lista_escalonada_activa: escalonadaToUse,
    variantes: variantes.length > 0 ? variantes : undefined,
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
