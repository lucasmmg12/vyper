import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

  let query = supabase
    .from('productos')
    .select('*, categoria:categorias(*,rubro:rubros(*)), marca:marcas(*), lista_precio:listas_precios(*, escalones:listas_precios_escalones(*))', { count: 'exact' });

  if (!all) {
    query = query.eq('activo', true).gt('stock', 0);
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
  const filtered = rubro_id
    ? (data || []).filter((p: Record<string, unknown>) => p.categoria !== null)
    : data;

  // Fetch default markup if needed
  const { data: defaultList } = await supabase
    .from('listas_precios')
    .select('*, escalones:listas_precios_escalones(*)')
    .eq('activo', true)
    .eq('es_default', true)
    .single();
  const defaultMarkup = defaultList?.markup || 1;

  // Apply dynamic pricing
  const mappedData = filtered.map((p: any) => {
    // If the product has a specific lista_precio, use it, otherwise use the global default
    const listToUse = p.lista_precio_id && p.lista_precio ? p.lista_precio : defaultList;
    const appliedMarkup = listToUse?.markup || 1;
    const computedMayorista = p.precio_costo ? Math.round(p.precio_costo * appliedMarkup) : p.precio_mayorista;
    
    // Remove the nested object to keep the payload clean (optional, keeping it for info in admin)
    return {
      ...p,
      precio_mayorista: computedMayorista,
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
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ producto: data }, { status: 201 });
}
