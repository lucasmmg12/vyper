import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET — List all active productos with filters, search, pagination, joins
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const categoria_id = searchParams.get('categoria_id');
  const rubro_id = searchParams.get('rubro_id');
  const marca_id = searchParams.get('marca_id');
  const destacado = searchParams.get('destacado');
  const en_oferta = searchParams.get('en_oferta');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const all = searchParams.get('all'); // for admin: return all including inactive
  const offset = (page - 1) * limit;

  const tienda = searchParams.get('tienda') || 'mayorista'; // 'mayorista' | 'minorista'

  let query = supabase
    .from('productos')
    .select(`
      *, 
      categoria:categorias(*,rubro:rubros(*)), 
      marca:marcas(*), 
      lista_precio:listas_precios!lista_precio_id(*, escalones:lista_precio_escalones(*)),
      lista_precio_minorista:listas_precios!lista_precio_minorista_id(*, escalones:lista_precio_escalones(*))
    `, { count: 'exact' });

  if (!all) {
    query = query.eq('activo', true).gt('stock', 0);
    query = query.eq(tienda === 'minorista' ? 'activo_minorista' : 'activo_mayorista', true);
  }

  if (search) {
    query = query.ilike('nombre', `%${search}%`);
  }
  if (categoria_id) {
    query = query.eq('categoria_id', categoria_id);
  }
  if (marca_id) {
    query = query.eq('marca_id', marca_id);
  }
  if (destacado === 'true') {
    query = query.eq('destacado', true);
  }
  if (rubro_id) {
    // Filter by rubro through the categorias join
    query = query.eq('categoria.rubro_id', rubro_id);
  }
  if (en_oferta === 'true') {
    query = query.eq('en_oferta', true);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If filtering by rubro_id, remove products where categoria is null (join didn't match)
  let filtered = rubro_id
    ? (data || []).filter((p: Record<string, unknown>) => p.categoria !== null)
    : data;

  // Filter out products without valid images if querying for the store
  if (!all) {
    filtered = (filtered || []).filter((p: any) => {
      // Validate that it's an array and has at least one valid string URL
      if (!p.imagenes || !Array.isArray(p.imagenes) || p.imagenes.length === 0) return false;
      return p.imagenes.some((img: string) => typeof img === 'string' && img.trim().length > 5);
    });
  }

  // Fetch default markup if needed
  const { data: defaultList } = await supabase
    .from('listas_precios')
    .select('*, escalones:lista_precio_escalones(*)')
    .eq('activo', true)
    .eq(tienda === 'minorista' ? 'es_default_minorista' : 'es_default', true)
    .single();

  // Apply dynamic pricing
  const mappedData = filtered.map((p: any) => {
    // 1. Elegir la lista de precios a utilizar basa en el tipo de tienda
    const overrideList = tienda === 'minorista' ? p.lista_precio_minorista : p.lista_precio;
    const listToUse = overrideList || defaultList;
    const appliedMarkup = listToUse?.markup || 1;
    const computedPrice = p.precio_costo ? Math.round(p.precio_costo * appliedMarkup) : (tienda === 'minorista' ? p.precio_unitario : p.precio_mayorista);
    
    // Remove the nested object to keep the payload clean (optional, keeping it for info in admin)
    return {
      ...p,
      precio_mayorista: computedPrice,
      lista_activa: listToUse,
    };
  });

  return NextResponse.json({
    productos: mappedData,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

// POST — Create a new producto
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('productos')
    .insert([{
      nombre: body.nombre,
      descripcion: body.descripcion,
      sku: `VYP-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.random().toString(36).toUpperCase().slice(2, 4)}`,
      precio_costo: body.precio_costo || 0,
      precio_mayorista: body.precio_mayorista || 0,
      precio_unitario: body.precio_unitario || 0,
      stock: body.stock || 0,
      cantidad_minima: body.cantidad_minima || 1,
      categoria_id: body.categoria_id || null,
      marca_id: body.marca_id || null,
      imagenes: body.imagenes || [],
      activo: body.activo ?? true,
      destacado: body.destacado ?? false,
      en_oferta: body.en_oferta ?? false,
      precio_oferta: body.precio_oferta || 0,
      lista_precio_id: body.lista_precio_id || null,
      lista_precio_minorista_id: body.lista_precio_minorista_id || null,
      lista_escalonada_id: body.lista_escalonada_id || null,
      lista_escalonada_minorista_id: body.lista_escalonada_minorista_id || null,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ producto: data }, { status: 201 });
}
