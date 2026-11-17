import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

const db = supabaseAdmin || supabase;

const VYPER_KNOWLEDGE_BASE = `
SISTEMA INTEGRAL VYPER LABS — DOCUMENTACIÓN OFICIAL COMPLETA (GROW LABS)

1. ARQUITECTURA GENERAL Y NAVEGACIÓN:
- Menú Lateral Colapsable: Se puede contraer a una barra de íconos (68px) o expandir (240px) desde el botón superior del sidebar.
- Buscador Global (Ctrl + K): Permite buscar clientes por nombre/teléfono, abrir su chat en Whatsapp CRM, buscar productos por nombre/SKU o saltar a cualquier pantalla sin usar el mouse.
- Asistente Virtual "Growy": Asistente inteligente flotante con acceso en tiempo real a las métricas operativas y al manual completo del sistema.

2. MÓDULO INICIO (/admin):
- Pestaña Ventas: Registro rápido de ventas por sucursal (Rivadavia / Rawson / Online), asignación de cliente y acreditación automática de Vyper Coins (1 Coin cada $1.000).
- Pestaña Egresos: Registro de gastos operativos por categoría y sucursal.
- Pestaña Whatsapp: Acceso embebido al CRM de WhatsApp.
- Botón Resumen Diario: Envía el cierre de caja diario por WhatsApp al teléfono del dueño.
- Importador Excel: Carga masiva de ventas o egresos desde planillas .xlsx.

3. MÓDULO WHATSAPP CRM (/admin/crm):
- Pantalla Completa (100vh x 100%): Consola de 3 columnas (Conversaciones a la izquierda, Chat central y Ficha 360° a la derecha).
- Webhook en Tiempo Real (Supabase Edge Function): Conectado a https://ophbmcprxcnpkpndusbe.supabase.co/functions/v1/whatsapp-webhook. Recibe todos los mensajes entrantes, salientes y llamadas de BuilderBot Cloud v2 / Meta API.
- Grabación y Envío de Audios (🎤): Botón de micrófono en la barra inferior. Permite grabar notas de voz con cronómetro en vivo, previsualizar/escuchar antes de enviar, transcribir o enviar directo.
- Transcripción de Audios en el Momento (✨): Los audios entrantes se transcriben automáticamente con OpenAI Whisper (whisper-1) y cualquier audio (entrante o saliente) tiene el botón "Transcribir en el momento" + selector de velocidad 1x / 1.5x / 2x.
- Envío y Previsualización Universal de Archivos (📎 / 👁️): Soporta cualquier formato (Imágenes, Audios, Videos, PDF, Excel .xlsx/.csv, Word .docx, TXT) mediante botón clip, arrastrar y soltar (Drag & Drop) o pegar con Ctrl+V. Incluye barra de vista previa antes de enviar y visor modal embebido en el chat.
- Respuesta Sugerida con IA (✨ Growy): Lee los últimos mensajes del chat (incluyendo transcripciones de audio) y los datos del cliente para redactar una respuesta sugerida en 1 clic.
- Cotizador de Productos en el Chat (🛒): En la Ficha 360° derecha podés buscar suplementos del catálogo e insertar la cotización con precios directo en el mensaje.
- Notas Internas (📌) y Etiquetas: Podés registrar notas internas amarillas visibles solo para el equipo dentro de la conversación y etiquetar el estado del chat.
- Ventana de 24h y Plantillas Meta: Si pasaron más de 24h desde el último mensaje del cliente, se usa el botón "Enviar Plantilla Meta" (plantilla vyper_notificacion_general en es_AR con 4 variables automáticas: Nombre, Motivo, Detalle y Cierre).
- Atajos Rápidos (/): Escribiendo "/" en el chat se despliegan respuestas rápidas configurables (/mayorista, /transferencia, /listo, /ubicacion, etc.).
- Acciones Operativas en Ficha 360°: Botones "+ Venta", "+ Fiado", "Cobrar Cta." y "+ Coins" que impactan en vivo en el ERP y permiten enviar el comprobante al chat.

4. VYPER COINS (/admin/vyper-coins):
- Programa de fidelización: Bronce (0-99 Coins), Plata (100-299 Coins), Oro (300-599 Coins), Platino (600+ Coins).
- Permite acreditar o canjear puntos y notificar al cliente por WhatsApp.

5. CUENTA CORRIENTE (/admin/debt):
- Gestión de fiados y pagos parciales/totales.
- Envío individual o masivo de recordatorios de deuda por WhatsApp y botón directo "💬 Abrir en Whatsapp" para ir al chat del deudor.

6. CLIENTES (/admin/clients):
- ABM completo de clientes, importación Excel, ranking de Top Vyper Coins y Top Deudores, y acceso directo al chat de WhatsApp de cada cliente.

7. ANALYTICS BI (/admin/bi), RETENCIÓN (/admin/retention) Y COMPETENCIA (/admin/competitors):
- Analytics BI: KPIs financieros, comparativa por sucursal, exportación de reporte PDF y Copiloto Financiero IA.
- Retención: Detección de clientes inactivos (+30/+60 días) con generador de mensajes de reactivación por WhatsApp.
- Competencia: Mapa interactivo y comparador de precios frente a competidores locales.

8. ECOMMERCE MAYORISTA (/tienda), MINORISTA (/minorista) Y PORTAL CLIENTES (/client):
- Regla de Stock Flexible: Nunca se bloquea una venta si el stock figura en 0; todos los productos activos se muestran y pueden pedirse.
- Tienda Mayorista (/tienda): Modo catálogo y Modo Planilla Rápida B2B, variantes por sabor/tamaño, barra de incentivos en carrito y descarga de Lista de Precios en PDF dinámico.
- Tienda Minorista (/minorista): Experiencia B2C con cupones, combos, canje de Vyper Coins y Personal Shopper IA.
- Portal de Clientes (/client) y Tracking (/pedido/[id]): Consulta de Coins, Cuenta Corriente, estado de pedidos en vivo y botón "🔁 Repetir último pedido en 1 clic".
- Administración Ecommerce (/admin/ecommerce): Gestión de Productos (con generador IA de descripciones y actualizador masivo de precios), Compras a proveedores (con escáner SKU), Listas de Precios, Categorías, Marcas, Pedidos (con impresión de remito y sincronización ERP) y Personalización CMS en vivo con rollback de 10 versiones.
`;

async function getLiveSystemSnapshot() {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayIso = todayStart.toISOString();

        const [usersRes, pedidosRes, productosRes, unreadRes, salesTodayRes] = await Promise.all([
            db.from('users').select('id, name, coin_balance, debt_balance').eq('user_status', true),
            db.from('pedidos').select('id, numero_pedido, cliente_nombre, estado, total, created_at').order('created_at', { ascending: false }).limit(50),
            db.from('productos').select('id', { count: 'exact', head: true }).eq('activo', true),
            db.from('whatsapp_messages').select('id', { count: 'exact', head: true }).eq('direction', 'incoming').eq('is_read', false),
            db.from('sales').select('amount, branch').gte('created_at', todayIso),
        ]);

        const users = usersRes.data || [];
        const totalClients = users.length;
        const debtors = users.filter(u => Number(u.debt_balance || 0) > 0);
        const totalDebt = debtors.reduce((acc, u) => acc + Number(u.debt_balance || 0), 0);
        const topDebtors = debtors
            .sort((a, b) => Number(b.debt_balance) - Number(a.debt_balance))
            .slice(0, 3)
            .map(d => `${d.name} ($${Number(d.debt_balance).toLocaleString('es-AR')})`);

        const pedidos = pedidosRes.data || [];
        const pendingOrders = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'procesando');
        const salesToday = (salesTodayRes.data || []).reduce((acc, s) => acc + Number(s.amount || 0), 0);

        return {
            totalClients,
            debtorsCount: debtors.length,
            totalDebt,
            topDebtors,
            pendingOrdersCount: pendingOrders.length,
            totalActiveProducts: productosRes.count || 0,
            unreadWhatsappMessages: unreadRes.count || 0,
            salesToday,
        };
    } catch {
        return null;
    }
}

function buildFallbackResponse(question: string, snapshot: any) {
    const q = question.toLowerCase();

    if (q.includes('resumen') || q.includes('hoy') || q.includes('estado') || q.includes('metricas') || q.includes('métricas')) {
        if (snapshot) {
            return {
                reply: `📊 **Estado Operativo en Vivo de Vyper Labs:**\n\n• **Ventas POS de hoy:** $${Number(snapshot.salesToday).toLocaleString('es-AR')}\n• **Mensajes de WhatsApp sin leer:** ${snapshot.unreadWhatsappMessages}\n• **Pedidos Web pendientes/en proceso:** ${snapshot.pendingOrdersCount}\n• **Clientes activos:** ${snapshot.totalClients} (${snapshot.debtorsCount} con saldo en Cta. Cte. por un total de **$${Number(snapshot.totalDebt).toLocaleString('es-AR')}**)\n• **Principales saldos pendientes:** ${snapshot.topDebtors.join(', ') || 'Ninguno'}\n• **Productos activos en catálogo:** ${snapshot.totalActiveProducts}`,
                actions: [
                    { label: 'Ir a Whatsapp CRM', href: '/admin/crm' },
                    { label: 'Ver Pedidos Web', href: '/admin/ecommerce/pedidos' },
                    { label: 'Ver Cuenta Corriente', href: '/admin/debt' },
                ],
            };
        }
    }

    if (q.includes('audio') || q.includes('transcri') || q.includes('voz') || q.includes('archivo') || q.includes('previsualizar')) {
        return {
            reply: `🎤 **Audios, Transcripción y Archivos en Whatsapp CRM:**\n\n1. **Enviar Audios:** Tocá el ícono del micrófono (\`🎤\`) abajo en el chat. Podés elegir **"Escuchar / Transcribir"** para revisarlo antes de mandar, o **"Enviar Audio"** directo.\n2. **Transcribir en el momento:** Los audios que te mandan los clientes se transcriben automáticamente con IA (Whisper) y cualquier audio tiene el botón **"✨ Transcribir en el momento"** + control de velocidad **1x / 1.5x / 2x**.\n3. **Todo tipo de archivos con Vista Previa:** Tocá el clip (\`📎\`), arrastrá archivos al chat o pegá con \`Ctrl + V\`. Antes de enviarlos vas a ver la barra de previsualización, y en el chat podés tocar **"👁️ Previsualizar"** para abrir PDFs, Excel, Word, videos e imágenes sin salir de la pantalla.`,
            actions: [{ label: 'Abrir Whatsapp CRM', href: '/admin/crm' }],
        };
    }

    if (q.includes('plantilla') || q.includes('meta') || q.includes('24h') || q.includes('webhook')) {
        return {
            reply: `💬 **Funcionamiento de WhatsApp Meta API y Ventana de 24h:**\n\n• **Ventana de 24h Abierta (punto verde):** Cuando el cliente te escribió hace menos de 24 horas, podés enviarle mensajes libres, audios y archivos sin límite.\n• **Fuera de Ventana de 24h:** Para iniciar conversación o contactar clientes inactivos/deudores, usá el botón **"✨ Enviar Plantilla Meta"** (\`vyper_notificacion_general\` en \`es_AR\`), que autocompleta las 4 variables del cliente.\n• **Webhook:** Todos los mensajes impactan en tiempo real en la Edge Function de Supabase (\`whatsapp-webhook\`).`,
            actions: [
                { label: 'Ir a Whatsapp CRM', href: '/admin/crm' },
                { label: 'Configuración Meta / Bot', href: '/admin/configuracion' },
            ],
        };
    }

    return {
        reply: `Soy **Growy**, el asistente virtual integral de **Vyper Labs**. Puedo ayudarte con cualquier módulo del sistema:\n\n• **Whatsapp CRM**: Audios, transcripción instantánea, vista previa de PDFs/Excel/imágenes, cotizador en chat, notas internas y plantillas Meta.\n• **Operativa Diaria**: Ventas POS, Egresos, Cuenta Corriente, Vyper Coins y Buscador Global (\`Ctrl + K\`).\n• **Ecommerce B2B y Minorista**: Gestión de pedidos, catálogo sin bloqueo de stock, listas de precios PDF y personalización CMS.\n\n¿Sobre qué módulo querés consultar o qué dato en vivo necesitás revisar?`,
        actions: [
            { label: 'Abrir Whatsapp CRM', href: '/admin/crm' },
            { label: 'Ver Manual Completo', href: '/tutorial' },
            { label: 'Ir a Ecommerce', href: '/admin/ecommerce' },
        ],
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mode = 'assistant', message = '', history = [], chatContext = null } = body;
        const apiKey = process.env.OPENAI_API_KEY;

        // Mode 1: Suggest smart reply inside WhatsApp CRM
        if (mode === 'suggest_reply' && chatContext) {
            const clientName = chatContext.clientName || 'Cliente';
            const coins = chatContext.coins || 0;
            const debt = chatContext.debt || 0;
            const recentMsgs = Array.isArray(chatContext.messages)
                ? chatContext.messages
                      .slice(-8)
                      .map((m: any) => {
                          const tr = m.raw_payload?.transcription
                              ? ` (Transcripción audio: "${m.raw_payload.transcription}")`
                              : '';
                          return `${m.direction === 'incoming' ? clientName : 'Vyper'}: ${m.content || '[Archivo/Audio]'}${tr}`;
                      })
                      .join('\n')
                : '';

            if (apiKey) {
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        temperature: 0.4,
                        messages: [
                            {
                                role: 'system',
                                content:
                                    'Sos el operador comercial experto de Vyper Suplementos (San Juan, Argentina). Redactá UNA respuesta corta, cálida, directa y lista para enviar por WhatsApp al cliente en base a los últimos mensajes (y transcripciones de audio si las hay). Tené en cuenta sus Vyper Coins y saldo de cuenta corriente solo si es relevante. No uses comillas alrededor del mensaje.',
                            },
                            {
                                role: 'user',
                                content: `Cliente: ${clientName} | Vyper Coins: ${coins} | Deuda Cta Cte: $${debt}\n\nÚltimos mensajes:\n${recentMsgs}\n\nRedactá la respuesta ideal para enviarle ahora:`,
                            },
                        ],
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    const suggested = data?.choices?.[0]?.message?.content?.trim();
                    if (suggested) {
                        return NextResponse.json({ ok: true, reply: suggested });
                    }
                }
            }

            // Fallback smart reply
            const firstName = clientName.split(' ')[0];
            return NextResponse.json({
                ok: true,
                reply: `¡Hola ${firstName}! ¿Cómo estás? Te confirmo que tenemos disponibilidad inmediata. Avisame si querés que te separemos el pedido o te pasemos el link de seguimiento 💪`,
            });
        }

        // Mode 2: Full Growy Assistant with live DB snapshot + Knowledge Base
        const snapshot = await getLiveSystemSnapshot();

        if (apiKey) {
            const snapshotText = snapshot
                ? `DATOS EN TIEMPO REAL DE LA BASE DE DATOS HOY:
- Ventas POS registradas hoy: $${Number(snapshot.salesToday).toLocaleString('es-AR')}
- Mensajes de WhatsApp sin leer: ${snapshot.unreadWhatsappMessages}
- Pedidos Web pendientes/en preparación: ${snapshot.pendingOrdersCount}
- Total clientes activos: ${snapshot.totalClients}
- Clientes con deuda en Cuenta Corriente: ${snapshot.debtorsCount} (Total deuda acumulada: $${Number(snapshot.totalDebt).toLocaleString('es-AR')})
- Mayores deudores actuales: ${snapshot.topDebtors.join(', ') || 'Ninguno'}
- Productos activos en catálogo: ${snapshot.totalActiveProducts}`
                : '';

            const chatMessages = [
                {
                    role: 'system',
                    content: `Sos "Growy", el Asistente Virtual Inteligente de Vyper Labs (desarrollado por Grow Labs).
Conocés a la perfección cada pantalla, botón, flujo técnico y regla de negocio del software Vyper Labs, y además tenés acceso a las métricas en vivo de la base de datos.
Respondé siempre en español rioplatense claro, directo, profesional y estructurado.

${VYPER_KNOWLEDGE_BASE}

${snapshotText}`,
                },
                ...history.slice(-6).map((h: any) => ({
                    role: h.role === 'assistant' ? 'assistant' : 'user',
                    content: String(h.content || ''),
                })),
                { role: 'user', content: message },
            ];

            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    temperature: 0.3,
                    messages: chatMessages,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const aiReply = data?.choices?.[0]?.message?.content?.trim();
                if (aiReply) {
                    const fallback = buildFallbackResponse(message, snapshot);
                    return NextResponse.json({
                        ok: true,
                        reply: aiReply,
                        actions: fallback.actions,
                        snapshot,
                    });
                }
            }
        }

        const fallback = buildFallbackResponse(message, snapshot);
        return NextResponse.json({
            ok: true,
            reply: fallback.reply,
            actions: fallback.actions,
            snapshot,
        });
    } catch (error: any) {
        console.error('[API /api/ai/growy] Error:', error);
        return NextResponse.json(
            { ok: false, error: error?.message || 'Error consultando a Growy' },
            { status: 500 }
        );
    }
}
