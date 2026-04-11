import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — List all compras
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const estado = searchParams.get('estado');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('compras')
    .select('*, items:compra_items(*)', { count: 'exact' });

  if (estado) {
    query = query.eq('estado', estado);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    compras: data,
    total: count || 0,
    page,
    limit,
  });
}

// POST — Create a new compra + items + update stock & cost
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { proveedor, numero_factura, notas, items, confirmar } = body;

  // Calculate total
  const total = (items || []).reduce(
    (sum: number, item: { cantidad: number; precio_unitario: number }) =>
      sum + item.cantidad * item.precio_unitario,
    0
  );

  // Create compra header
  const { data: compra, error: compraError } = await supabase
    .from('compras')
    .insert([{
      proveedor: proveedor || null,
      numero_factura: numero_factura || null,
      notas: notas || null,
      total,
      estado: confirmar ? 'confirmada' : 'pendiente',
      fecha: new Date().toISOString(),
    }])
    .select()
    .single();

  if (compraError || !compra) {
    return NextResponse.json({ error: compraError?.message || 'Error creando compra' }, { status: 500 });
  }

  // Insert items
  if (items && items.length > 0) {
    const compraItems = items.map((item: {
      producto_id: string;
      producto_nombre: string;
      cantidad: number;
      precio_unitario: number;
    }) => ({
      compra_id: compra.id,
      producto_id: item.producto_id,
      producto_nombre: item.producto_nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.cantidad * item.precio_unitario,
    }));

    const { error: itemsError } = await supabase
      .from('compra_items')
      .insert(compraItems);

    if (itemsError) {
      // Rollback: delete the compra
      await supabase.from('compras').delete().eq('id', compra.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // If confirming, update stock and cost for each product
    if (confirmar) {
      for (const item of items) {
        if (!item.producto_id) continue;

        // Get current product
        const { data: prod } = await supabase
          .from('productos')
          .select('stock, precio_costo')
          .eq('id', item.producto_id)
          .single();

        if (prod) {
          const newStock = (prod.stock || 0) + item.cantidad;
          const newCosto = item.precio_unitario; // Update cost to latest purchase price

          await supabase
            .from('productos')
            .update({
              stock: newStock,
              precio_costo: newCosto,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.producto_id);
        }
      }
    }
  }

  // Fetch complete compra with items
  const { data: full } = await supabase
    .from('compras')
    .select('*, items:compra_items(*)')
    .eq('id', compra.id)
    .single();

  return NextResponse.json({ compra: full }, { status: 201 });
}
