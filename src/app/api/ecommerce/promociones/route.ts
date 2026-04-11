import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — List promotions (optionally filtered by product)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const producto_id = searchParams.get('producto_id');

  let query = supabase
    .from('producto_promociones')
    .select('*, producto:productos(id, nombre, precio_costo, imagenes)');

  if (producto_id) {
    query = query.eq('producto_id', producto_id);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ promociones: data });
}

// POST — Create a product promotion
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('producto_promociones')
    .insert([{
      producto_id: body.producto_id,
      nombre: body.nombre,
      tipo: body.tipo || 'markup',
      valor: body.valor,
      cantidad_minima: body.cantidad_minima || 1,
      activo: body.activo ?? true,
      fecha_inicio: body.fecha_inicio || null,
      fecha_fin: body.fecha_fin || null,
    }])
    .select('*, producto:productos(id, nombre, precio_costo, imagenes)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ promocion: data }, { status: 201 });
}
