import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — List pedidos with items
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get('estado');

  let query = supabase
    .from('pedidos')
    .select('*, items:pedido_items(*, producto:productos(imagenes, id))')
    .order('created_at', { ascending: false });

  if (estado) {
    query = query.eq('estado', estado);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pedidos: data });
}

// POST — Create pedido from checkout
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cliente_nombre, cliente_email, cliente_telefono, notas, items } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'El pedido debe tener al menos un producto' }, { status: 400 });
  }

  const total = items.reduce(
    (sum: number, item: { precio_unitario: number; cantidad: number }) =>
      sum + item.precio_unitario * item.cantidad,
    0
  );

  // Create pedido
  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert([{
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      notas,
      total,
      estado: 'pendiente',
    }])
    .select()
    .single();

  if (pedidoError) {
    return NextResponse.json({ error: pedidoError.message }, { status: 500 });
  }

  // Create pedido items
  const pedidoItems = items.map((item: {
    producto_id: string;
    producto_nombre: string;
    cantidad: number;
    precio_unitario: number;
  }) => ({
    pedido_id: pedido.id,
    producto_id: item.producto_id,
    producto_nombre: item.producto_nombre,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    subtotal: item.precio_unitario * item.cantidad,
  }));

  const { error: itemsError } = await supabase
    .from('pedido_items')
    .insert(pedidoItems);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({
    pedido: { ...pedido, items: pedidoItems },
  }, { status: 201 });
}
