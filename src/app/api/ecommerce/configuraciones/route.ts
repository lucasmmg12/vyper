import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clave = searchParams.get('clave');

  let data, error;
  
  if (clave) {
    const res = await supabase.from('configuraciones').select('*').eq('clave', clave).single();
    data = res.data;
    error = res.error;
  } else {
    const res = await supabase.from('configuraciones').select('*');
    data = res.data;
    error = res.error;
  }

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  try {
    const { clave, valor } = await request.json();

    if (!clave || !valor) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('configuraciones')
      .update({ valor, updated_at: new Date().toISOString() })
      .eq('clave', clave)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
