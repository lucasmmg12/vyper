import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — List all marcas
export async function GET() {
  const { data, error } = await supabase
    .from('marcas')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ marcas: data });
}

// POST — Create marca
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('marcas')
    .insert([{
      nombre: body.nombre,
      logo_url: body.logo_url,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ marca: data }, { status: 201 });
}
