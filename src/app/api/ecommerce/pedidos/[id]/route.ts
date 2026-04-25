import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PATCH — Update pedido status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado: body.estado })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pedido: data });
}

// PUT — Edit pedido items and total
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { items } = body;

  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ error: 'Faltan los items del pedido' }, { status: 400 });
  }

  const total = items.reduce(
    (sum: number, item: { precio_unitario: number; cantidad: number }) =>
      sum + item.precio_unitario * item.cantidad,
    0
  );

  // 1. Delete all existing items for this pedido
  const { error: deleteError } = await supabase
    .from('pedido_items')
    .delete()
    .eq('pedido_id', id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // 2. Insert new items if there are any
  if (items.length > 0) {
    const pedidoItems = items.map((item: {
      producto_id?: string;
      producto_nombre: string;
      cantidad: number;
      precio_unitario: number;
    }) => ({
      pedido_id: id,
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
  }

  // 3. Update the pedido total
  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .update({ total })
    .eq('id', id)
    .select('*, items:pedido_items(*, producto:productos(imagenes, id))')
    .single();

  if (pedidoError) {
    return NextResponse.json({ error: pedidoError.message }, { status: 500 });
  }

  return NextResponse.json({ pedido });
}
