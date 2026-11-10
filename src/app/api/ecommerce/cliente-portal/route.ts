import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTelefono = searchParams.get('telefono') || searchParams.get('whatsapp') || '';

    const digits = rawTelefono.replace(/\D/g, '');
    if (!digits || digits.length < 6) {
      return NextResponse.json(
        { client: null, pedidos: [], promociones: [] },
        { status: 200 }
      );
    }

    // Extract last 7-10 digits to match flexibly regardless of +549 / 0 / 15 prefixes
    const tailDigits = digits.length >= 8 ? digits.slice(-8) : digits;

    // 1. Search client in `users` table
    const { data: matchedUsers } = await supabase
      .from('users')
      .select('*')
      .ilike('phone', `%${tailDigits}%`)
      .limit(5);

    const userRow = matchedUsers && matchedUsers.length > 0 ? matchedUsers[0] : null;

    let transactions: any[] = [];
    if (userRow?.id) {
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userRow.id)
        .order('created_at', { ascending: false })
        .limit(10);
      transactions = txData || [];
    }

    // 2. Search orders in `pedidos` table matching the phone digits
    const { data: pedidosData } = await supabase
      .from('pedidos')
      .select('*, items:pedido_items(*, producto:productos(id, nombre, imagenes, precio_mayorista, precio_unitario, stock, cantidad_minima))')
      .ilike('cliente_telefono', `%${tailDigits}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    // 3. Fetch active product promotions / coupons
    const { data: promocionesData } = await supabase
      .from('producto_promociones')
      .select('*, producto:productos(id, nombre)')
      .eq('activo', true)
      .limit(20);

    const latestOrderWithEmail = (pedidosData || []).find((p: any) => p.cliente_email);

    const client = userRow
      ? {
          id: userRow.id,
          name: userRow.name || (pedidosData?.[0]?.cliente_nombre ?? ''),
          phone: userRow.phone || rawTelefono,
          email: latestOrderWithEmail?.cliente_email || '',
          coin_balance: Number(userRow.coin_balance || 0),
          debt_balance: Number(userRow.debt_balance || 0),
          transactions: transactions.map(t => ({
            ...t,
            amountFiat: t.amount_fiat,
            amountCoins: t.amount_coins,
            createdAt: t.created_at,
          })),
        }
      : pedidosData && pedidosData.length > 0
      ? {
          id: 'guest',
          name: pedidosData[0].cliente_nombre || '',
          phone: pedidosData[0].cliente_telefono || rawTelefono,
          email: latestOrderWithEmail?.cliente_email || '',
          coin_balance: 0,
          debt_balance: 0,
          transactions: [],
        }
      : null;

    return NextResponse.json({
      client,
      pedidos: pedidosData || [],
      promociones: promocionesData || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error consultando portal de cliente', client: null, pedidos: [], promociones: [] },
      { status: 500 }
    );
  }
}
