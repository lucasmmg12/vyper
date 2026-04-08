import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — List categorias (optionally filtered by rubro_id)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rubro_id = searchParams.get('rubro_id');

  let query = supabase
    .from('categorias')
    .select('*, rubro:rubros(*)')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (rubro_id) {
    query = query.eq('rubro_id', rubro_id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categorias: data });
}

// POST — Create categoria
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('categorias')
    .insert([{
      nombre: body.nombre,
      descripcion: body.descripcion,
      imagen_url: body.imagen_url,
      rubro_id: body.rubro_id,
      orden: body.orden || 0,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categoria: data }, { status: 201 });
}
