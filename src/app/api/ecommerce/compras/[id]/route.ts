import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — Get single compra with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('compras')
    .select('*, items:compra_items(*)')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ compra: data });
}

// PUT — Update compra (or confirm it)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // If confirming a pending purchase
  if (body.confirmar) {
    // Get the purchase with items
    const { data: compra } = await supabase
      .from('compras')
      .select('*, items:compra_items(*)')
      .eq('id', id)
      .single();

    if (!compra || compra.estado !== 'pendiente') {
      return NextResponse.json({ error: 'Compra no encontrada o ya confirmada' }, { status: 400 });
    }

    // Update stock and cost for each item
    for (const item of (compra.items || [])) {
      if (!item.producto_id) continue;

      const { data: prod } = await supabase
        .from('productos')
        .select('stock, precio_costo')
        .eq('id', item.producto_id)
        .single();

      if (prod) {
        await supabase
          .from('productos')
          .update({
            stock: (prod.stock || 0) + item.cantidad,
            precio_costo: item.precio_unitario,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.producto_id);
      }
    }

    // Mark as confirmed
    const { data, error } = await supabase
      .from('compras')
      .update({ estado: 'confirmada' })
      .eq('id', id)
      .select('*, items:compra_items(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ compra: data });
  }

  // Regular update
  const { data, error } = await supabase
    .from('compras')
    .update({
      ...body,
    })
    .eq('id', id)
    .select('*, items:compra_items(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ compra: data });
}

// DELETE — Delete compra
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from('compras')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
