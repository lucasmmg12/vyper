import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendOrderStatusNotification, sendDebtNotification } from '@/lib/builderbot';

// GET — Get single pedido by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('pedidos')
    .select('*, items:pedido_items(*, producto:productos(imagenes, id, nombre))')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Pedido no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ pedido: data });
}

// Helper to find or create ERP client in `users`
async function findOrCreateErpClient(nombre: string, telefono: string) {
  const cleanDigits = (telefono || '').replace(/\D/g, '');
  const lastDigits = cleanDigits.slice(-8);

  let client: any = null;

  if (lastDigits.length >= 6) {
    const { data: byPhone } = await supabase
      .from('users')
      .select('*')
      .ilike('phone', `%${lastDigits}%`)
      .limit(1);

    if (byPhone && byPhone.length > 0) {
      client = byPhone[0];
    }
  }

  if (!client && nombre && nombre.trim().length > 2) {
    const { data: byName } = await supabase
      .from('users')
      .select('*')
      .ilike('name', nombre.trim())
      .limit(1);

    if (byName && byName.length > 0) {
      client = byName[0];
    }
  }

  if (!client) {
    let formattedWhatsapp = (telefono || '').trim().replace(/[\s-]/g, '');
    if (formattedWhatsapp && !formattedWhatsapp.startsWith('+549')) {
      if (formattedWhatsapp.startsWith('+54') && !formattedWhatsapp.startsWith('+549')) {
        formattedWhatsapp = '+549' + formattedWhatsapp.slice(3);
      } else if (formattedWhatsapp.startsWith('549')) {
        formattedWhatsapp = '+' + formattedWhatsapp;
      } else {
        formattedWhatsapp = '+549' + cleanDigits;
      }
    }

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        phone: formattedWhatsapp || telefono || '',
        name: nombre || 'Cliente Ecommerce',
        user_profile: 'CLIENT',
        coin_balance: 0,
        debt_balance: 0,
        client_id: Math.floor(Math.random() * 1000000).toString(),
        last_load_date: new Date().toISOString(),
        user_view: true,
        user_status: true,
      })
      .select()
      .single();

    if (!createError && newUser) {
      client = newUser;
    }
  }

  return client;
}

// PATCH — Update pedido status + ERP Unification + WhatsApp Notification
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const {
    estado,
    notificar_whatsapp = true,
    registrar_venta_erp = true,
    pasar_a_cta_cte = false,
  } = body;

  // 1. Fetch existing pedido with items
  const { data: existingPedido, error: fetchErr } = await supabase
    .from('pedidos')
    .select('*, items:pedido_items(*)')
    .eq('id', id)
    .single();

  if (fetchErr || !existingPedido) {
    return NextResponse.json({ error: fetchErr?.message || 'Pedido no encontrado' }, { status: 404 });
  }

  const nuevoEstado = estado || existingPedido.estado;
  let whatsappSent = false;

  // 2. Send WhatsApp status notification if applicable
  if (
    notificar_whatsapp &&
    existingPedido.cliente_telefono &&
    (nuevoEstado === 'procesando' || nuevoEstado === 'completado') &&
    existingPedido.estado !== nuevoEstado
  ) {
    try {
      whatsappSent = await sendOrderStatusNotification(
        existingPedido.cliente_nombre,
        existingPedido.numero_pedido,
        nuevoEstado,
        Number(existingPedido.total || 0),
        existingPedido.cliente_telefono,
        existingPedido.id
      );
    } catch (e) {
      console.error('Error sending WhatsApp order notification:', e);
    }
  }

  // 3. Update pedido status
  const updatePayload: Record<string, unknown> = { estado: nuevoEstado };
  if (whatsappSent) {
    updatePayload.notificado_whatsapp = true;
  }

  const { data: updatedPedido, error: updateErr } = await supabase
    .from('pedidos')
    .update(updatePayload)
    .eq('id', id)
    .select('*, items:pedido_items(*, producto:productos(imagenes, id))')
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  let erpResult: {
    clientFoundOrCreated?: boolean;
    saleRecorded?: boolean;
    earnedCoins?: number;
    passedToDebt?: boolean;
    newDebtBalance?: number;
  } = {};

  // 4. ERP Integration when completing order OR explicitly passing to Cta. Cte.
  const shouldProcessErp =
    pasar_a_cta_cte || (nuevoEstado === 'completado' && existingPedido.estado !== 'completado' && registrar_venta_erp);

  if (shouldProcessErp) {
    try {
      const client = await findOrCreateErpClient(
        existingPedido.cliente_nombre,
        existingPedido.cliente_telefono
      );

      const totalAmount = Number(existingPedido.total || 0);
      const now = new Date();
      const orderLabel = `#${String(existingPedido.numero_pedido).padStart(4, '0')}`;

      if (pasar_a_cta_cte && client) {
        const currentDebt = parseFloat(client.debt_balance || '0');
        const newDebt = currentDebt + totalAmount;

        await supabase.from('debt_transactions').insert([{
          client_id: client.id,
          client_name: client.name,
          amount: totalAmount,
          transaction_type: 'charge',
          balance_after: newDebt,
          date: now.toISOString(),
          notes: `Pedido Ecommerce ${orderLabel}`,
        }]);

        await supabase
          .from('users')
          .update({ debt_balance: newDebt, last_load_date: now.toISOString() })
          .eq('id', client.id);

        if (notificar_whatsapp && client.phone) {
          await sendDebtNotification(client.name, totalAmount, newDebt, 'charge', client.phone).catch(() => {});
        }

        erpResult = {
          clientFoundOrCreated: true,
          passedToDebt: true,
          newDebtBalance: newDebt,
        };
      } else if (registrar_venta_erp) {
        // Record in Sales table
        await supabase.from('sales').insert([{
          date: now.toISOString(),
          amount: totalAmount,
          branch: 'Rawson',
          observations: `ECOMMERCE PEDIDO ${orderLabel} - ${existingPedido.cliente_nombre}`,
          month_number: now.getMonth() + 1,
        }]);

        let earnedCoins = 0;
        if (client) {
          earnedCoins = Math.floor(totalAmount / 1000);
          const currentCoins = parseInt(client.coin_balance || '0');
          const newCoins = currentCoins + earnedCoins;

          await supabase
            .from('users')
            .update({
              coin_balance: newCoins,
              last_load_date: now.toISOString(),
            })
            .eq('id', client.id);

          if (earnedCoins > 0) {
            await supabase.from('coin_transactions').insert([{
              client_id: client.id,
              client_name: client.name,
              amount: totalAmount,
              coins_added: earnedCoins,
              date: now.toISOString(),
              notification_status: whatsappSent ? 'sent' : 'pending',
            }]);
          }
        }

        erpResult = {
          clientFoundOrCreated: Boolean(client),
          saleRecorded: true,
          earnedCoins,
        };
      }

      // 5. Relaxed stock adjustment: ONLY decrement if product currently has stock > 0, never block or go negative
      const items = existingPedido.items || [];
      for (const item of items) {
        if (item.producto_id) {
          const { data: prod } = await supabase
            .from('productos')
            .select('id, stock')
            .eq('id', item.producto_id)
            .single();

          if (prod && typeof prod.stock === 'number' && prod.stock > 0) {
            const newStock = Math.max(0, prod.stock - Number(item.cantidad || 0));
            await supabase
              .from('productos')
              .update({ stock: newStock })
              .eq('id', prod.id);
          }
        }
      }
    } catch (erpErr) {
      console.error('Error processing ERP integration for order:', erpErr);
    }
  }

  return NextResponse.json({
    pedido: updatedPedido,
    whatsappSent,
    erpResult,
  });
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
