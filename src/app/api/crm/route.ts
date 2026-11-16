import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import {
    normalizeArgentinePhone,
    sendDirectWhatsAppMessage,
    sendWhatsAppTemplate,
} from '@/lib/builderbot';

const db = supabaseAdmin || supabase;

export async function GET(request: NextRequest) {
    try {
        const phoneParam = request.nextUrl.searchParams.get('phone');

        // 1. Si se pide una conversación específica (?phone=549...)
        if (phoneParam) {
            const normPhone = normalizeArgentinePhone(phoneParam);
            const last8 = normPhone.slice(-8);

            // Marcar entrantes como leídos
            await db
                .from('whatsapp_messages')
                .update({ is_read: true })
                .eq('phone', normPhone)
                .eq('direction', 'incoming')
                .eq('is_read', false);

            // Obtener mensajes, cliente en users y pedidos web en paralelo
            const [messagesRes, usersRes, pedidosRes] = await Promise.all([
                db
                    .from('whatsapp_messages')
                    .select('*')
                    .eq('phone', normPhone)
                    .order('created_at', { ascending: true })
                    .limit(500),
                db
                    .from('users')
                    .select('*')
                    .eq('user_status', true)
                    .ilike('phone', `%${last8}%`)
                    .limit(1),
                db
                    .from('pedidos')
                    .select('*, items:pedido_items(*)')
                    .ilike('cliente_telefono', `%${last8}%`)
                    .order('created_at', { ascending: false })
                    .limit(5),
            ]);

            const client = usersRes.data?.[0] || null;

            return NextResponse.json({
                phone: normPhone,
                messages: messagesRes.data || [],
                client: client
                    ? {
                          id: client.id,
                          name: client.name,
                          phone: client.phone,
                          coin_balance: Number(client.coin_balance || 0),
                          debt_balance: Number(client.debt_balance || 0),
                      }
                    : null,
                pedidos: pedidosRes.data || [],
            });
        }

        // 2. Listado general de conversaciones + Clientes + Pedidos + Atajos + Estado del Bot
        const [messagesRes, usersRes, pedidosRes, shortcutsRes, botStatusRes] = await Promise.all([
            db
                .from('whatsapp_messages')
                .select('id, phone, content, direction, sender_name, is_read, created_at, media_type, media_url')
                .order('created_at', { ascending: false })
                .limit(5000),
            db
                .from('users')
                .select('id, name, phone, coin_balance, debt_balance')
                .eq('user_status', true),
            db
                .from('pedidos')
                .select('id, numero_pedido, cliente_nombre, cliente_telefono, estado, total, created_at')
                .order('created_at', { ascending: false })
                .limit(300),
            db
                .from('whatsapp_shortcuts')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true }),
            db
                .from('configuraciones')
                .select('valor, updated_at')
                .eq('clave', 'whatsapp_bot_status')
                .maybeSingle(),
        ]);

        // Mapa de clientes por teléfono normalizado (y últimos 8 dígitos)
        const clientsByPhone = new Map<string, any>();
        (usersRes.data || []).forEach(u => {
            if (!u.phone) return;
            const norm = normalizeArgentinePhone(u.phone);
            if (norm) {
                clientsByPhone.set(norm, u);
                clientsByPhone.set(norm.slice(-8), u);
            }
        });

        // Mapa de pedidos por teléfono
        const pedidosByPhone = new Map<string, any[]>();
        (pedidosRes.data || []).forEach(p => {
            if (!p.cliente_telefono) return;
            const norm = normalizeArgentinePhone(p.cliente_telefono);
            if (!norm) return;
            const list = pedidosByPhone.get(norm) || [];
            list.push(p);
            pedidosByPhone.set(norm, list);
        });

        // Agrupar mensajes por teléfono
        const convMap = new Map<string, any>();
        const nowMs = Date.now();
        const WINDOW_24H_MS = 24 * 60 * 60 * 1000;

        (messagesRes.data || []).forEach(msg => {
            const normPhone = normalizeArgentinePhone(msg.phone) || msg.phone;
            if (!normPhone) return;

            if (!convMap.has(normPhone)) {
                const matchedClient =
                    clientsByPhone.get(normPhone) || clientsByPhone.get(normPhone.slice(-8)) || null;
                const matchedPedidos = pedidosByPhone.get(normPhone) || [];

                const previewText =
                    msg.media_type && msg.media_type !== 'text'
                        ? `${
                              msg.media_type === 'image'
                                  ? '📷 Imagen'
                                  : msg.media_type === 'audio'
                                  ? '🎤 Audio'
                                  : msg.media_type === 'call'
                                  ? '📞 Llamada'
                                  : msg.media_type === 'sticker'
                                  ? '🏷️ Sticker'
                                  : '📎 Documento'
                          }${msg.content && !msg.content.startsWith('[') ? `: ${msg.content}` : ''}`
                        : msg.content || '';

                convMap.set(normPhone, {
                    phone: normPhone,
                    lastMessage: previewText,
                    lastDate: msg.created_at,
                    direction: msg.direction,
                    senderName: matchedClient?.name || '',
                    unreadCount: 0,
                    lastIncomingDate: null,
                    window24hOpen: false,
                    client: matchedClient
                        ? {
                              id: matchedClient.id,
                              name: matchedClient.name,
                              coin_balance: Number(matchedClient.coin_balance || 0),
                              debt_balance: Number(matchedClient.debt_balance || 0),
                          }
                        : null,
                    activePedido: matchedPedidos.find(p => p.estado === 'pendiente' || p.estado === 'procesando') || matchedPedidos[0] || null,
                });
            }

            const conv = convMap.get(normPhone)!;
            if (msg.direction === 'incoming') {
                if (msg.sender_name && !conv.senderName) {
                    conv.senderName = msg.sender_name;
                }
                if (!msg.is_read) {
                    conv.unreadCount += 1;
                }
                if (!conv.lastIncomingDate) {
                    conv.lastIncomingDate = msg.created_at;
                    const diff = nowMs - new Date(msg.created_at).getTime();
                    conv.window24hOpen = diff <= WINDOW_24H_MS;
                }
            }
        });

        const conversations = Array.from(convMap.values()).sort(
            (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
        );

        const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

        return NextResponse.json({
            conversations,
            totalUnread,
            shortcuts: shortcutsRes.data || [],
            botStatus: botStatusRes.data?.valor || { online: true, status: 'ready' },
        });
    } catch (error: any) {
        console.error('[API /api/crm GET] Error:', error);
        return NextResponse.json({ error: error?.message || 'Error consultando CRM' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        // 1. Enviar mensaje directo (POST /api/v2/{id}/messages)
        if (action === 'send_message') {
            const { phone, content, mediaUrl, senderName } = body;
            const normPhone = normalizeArgentinePhone(phone);
            if (!normPhone) {
                return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });
            }

            const result = await sendDirectWhatsAppMessage({
                to: normPhone,
                content: content || '',
                mediaUrl: mediaUrl || undefined,
                senderName: senderName || 'Operador Vyper',
            });

            if (!result.ok) {
                return NextResponse.json(
                    { ok: false, error: result.error, details: result.response },
                    { status: 400 }
                );
            }

            return NextResponse.json({ ok: true, response: result.response });
        }

        // 2. Enviar plantilla Meta desde el CRM (POST /api/v2/{id}/whatsapp-template)
        if (action === 'send_template') {
            const { phone, templateName, languageCode = 'es_AR', parameters = [], renderedText } = body;
            const normPhone = normalizeArgentinePhone(phone);
            if (!normPhone || !templateName) {
                return NextResponse.json({ error: 'Teléfono y plantilla requeridos' }, { status: 400 });
            }

            const result = await sendWhatsAppTemplate({
                to: normPhone,
                templateName,
                languageCode,
                parameters,
                renderedText,
                senderName: 'Operador Vyper (Plantilla Meta)',
            });

            if (!result.ok) {
                return NextResponse.json(
                    { ok: false, error: result.error, details: result.response },
                    { status: 400 }
                );
            }

            return NextResponse.json({ ok: true, response: result.response });
        }

        // 3. Marcar todos como leídos
        if (action === 'mark_all_read') {
            await db
                .from('whatsapp_messages')
                .update({ is_read: true })
                .eq('direction', 'incoming')
                .eq('is_read', false);
            return NextResponse.json({ ok: true });
        }

        // 4. Crear o editar Atajo Rápido (/)
        if (action === 'save_shortcut') {
            const { id, shortcut, label, message, category = 'general' } = body;
            if (!shortcut || !label || !message) {
                return NextResponse.json({ error: 'Faltan datos del atajo' }, { status: 400 });
            }
            const formattedShortcut = shortcut.startsWith('/') ? shortcut.trim() : `/${shortcut.trim()}`;

            if (id) {
                const { data, error } = await db
                    .from('whatsapp_shortcuts')
                    .update({
                        shortcut: formattedShortcut,
                        label,
                        message,
                        category,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)
                    .select()
                    .single();
                if (error) throw error;
                return NextResponse.json({ ok: true, shortcut: data });
            } else {
                const { data, error } = await db
                    .from('whatsapp_shortcuts')
                    .upsert(
                        {
                            shortcut: formattedShortcut,
                            label,
                            message,
                            category,
                            is_active: true,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: 'shortcut' }
                    )
                    .select()
                    .single();
                if (error) throw error;
                return NextResponse.json({ ok: true, shortcut: data });
            }
        }

        // 5. Eliminar Atajo Rápido
        if (action === 'delete_shortcut') {
            const { id } = body;
            await db.from('whatsapp_shortcuts').delete().eq('id', id);
            return NextResponse.json({ ok: true });
        }

        // 6. Vincular / Crear Cliente en `users` desde el CRM
        if (action === 'upsert_client') {
            const { phone, name } = body;
            const normPhone = normalizeArgentinePhone(phone);
            if (!normPhone || !name) {
                return NextResponse.json({ error: 'Nombre y teléfono requeridos' }, { status: 400 });
            }
            const last8 = normPhone.slice(-8);
            const { data: existing } = await db
                .from('users')
                .select('*')
                .eq('user_status', true)
                .ilike('phone', `%${last8}%`)
                .limit(1);

            if (existing && existing.length > 0) {
                const { data: updated, error } = await db
                    .from('users')
                    .update({ name: name.trim(), phone: normPhone })
                    .eq('id', existing[0].id)
                    .select()
                    .single();
                if (error) throw error;
                return NextResponse.json({ ok: true, client: updated });
            } else {
                const { data: created, error } = await db
                    .from('users')
                    .insert([
                        {
                            name: name.trim(),
                            phone: normPhone,
                            coin_balance: 0,
                            debt_balance: 0,
                            user_status: true,
                        },
                    ])
                    .select()
                    .single();
                if (error) throw error;
                return NextResponse.json({ ok: true, client: created });
            }
        }

        // 7. Simular mensaje entrante (Sandbox para probar el CRM)
        if (action === 'simulate_incoming') {
            const { phone, name, body: text } = body;
            const normPhone = normalizeArgentinePhone(phone || '5492646796509');
            const { data: inserted, error } = await db
                .from('whatsapp_messages')
                .insert({
                    phone: normPhone,
                    direction: 'incoming',
                    content: text || 'Hola Vyper! Quería consultar por precios mayoristas de Creatina y Whey Protein 💪',
                    media_type: 'text',
                    sender_name: name || 'Cliente Demo',
                    is_read: false,
                    raw_payload: { eventName: 'message.incoming', simulated: true },
                })
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ ok: true, message: inserted });
        }

        return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
    } catch (error: any) {
        console.error('[API /api/crm POST] Error:', error);
        return NextResponse.json({ error: error?.message || 'Error en CRM' }, { status: 500 });
    }
}
