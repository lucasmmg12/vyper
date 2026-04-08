import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — List all rubros
export async function GET() {
  const { data, error } = await supabase
    .from('rubros')
    .select('*, categorias(*)')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rubros: data });
}

// POST — Create rubro
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('rubros')
    .insert([{
      nombre: body.nombre,
      descripcion: body.descripcion,
      icono: body.icono,
      orden: body.orden || 0,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rubro: data }, { status: 201 });
}
