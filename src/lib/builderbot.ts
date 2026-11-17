// Helper functions to send and list WhatsApp Meta Templates & Direct Messages via BuilderBot API v2
import { getTierText, getTier } from '@/utils/tiers';
import { supabase, supabaseAdmin } from '@/lib/supabase';

const db = supabaseAdmin || supabase;

export interface WhatsAppTemplatePayload {
    to: string;
    templateName: string;
    languageCode: string;
    components?: {
        type: 'body' | 'header' | 'button';
        parameters: {
            type: 'text';
            text: string;
        }[];
    }[];
}

export interface WhatsAppTemplateMapping {
    modo: 'universal' | 'especifico';
    languageCode: string;
    universalTemplateName: string;
    templates: {
        compra_coins: string;
        ctacte_cargo: string;
        ctacte_pago: string;
        estado_pedido: string;
        recordatorio_saldo: string;
        reactivacion_cliente: string;
        resumen_diario: string;
    };
}

export const DEFAULT_TEMPLATE_MAPPING: WhatsAppTemplateMapping = {
    modo: 'universal',
    languageCode: 'es_AR',
    universalTemplateName: 'vyper_notificacion_general',
    templates: {
        compra_coins: 'vyper_compra_coins',
        ctacte_cargo: 'vyper_ctacte_cargo',
        ctacte_pago: 'vyper_ctacte_pago',
        estado_pedido: 'vyper_estado_pedido',
        recordatorio_saldo: 'vyper_recordatorio_saldo',
        reactivacion_cliente: 'vyper_reactivacion_cliente',
        resumen_diario: 'vyper_resumen_diario',
    },
};

function getBuilderBotBaseUrl(): string | null {
    const rawUrl = process.env.BUILDERBOT_WEBHOOK_URL;
    if (!rawUrl) return null;
    return rawUrl.replace(/\/(messages|whatsapp-template)(\?.*)?$/, '');
}

/**
 * Meta Cloud API strictly forbids newlines (\n), tabs (\t), or >4 consecutive spaces
 * inside template parameter values (Error #132018), as well as empty strings.
 */
export function sanitizeMetaParam(val: string | number | undefined | null): string {
    const str = String(val ?? '')
        .replace(/[\r\n\t]+/g, ' · ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    return str.length > 0 ? str.slice(0, 1000) : '-';
}

/**
 * Normaliza un número argentino para WhatsApp (estándar 549 + 10 dígitos, default San Juan 264)
 * Idéntico al normalizador probado en ADM-QUI.
 */
const DEFAULT_AREA_CODE = '264';

export function normalizeArgentinePhone(phone: string | null | undefined): string {
    if (!phone) return '';
    let clean = String(phone).replace(/\D/g, '');
    if (!clean) return '';

    if (clean.startsWith('549') && clean.length === 13) return clean;

    if (clean.startsWith('549') && clean.length > 13) {
        const inner = clean.slice(3);
        const idx15 = inner.indexOf('15');
        if (idx15 >= 2 && idx15 <= 4) {
            const cleaned = inner.slice(0, idx15) + inner.slice(idx15 + 2);
            if (cleaned.length === 10) return '549' + cleaned;
        }
        return '549' + inner.slice(0, 10);
    }

    if (clean.startsWith('54') && !clean.startsWith('549')) {
        clean = clean.slice(2);
    }

    if (clean.startsWith('0')) {
        clean = clean.slice(1);
    }

    if (clean.startsWith('15') && clean.length <= 10) {
        clean = DEFAULT_AREA_CODE + clean.slice(2);
        return '549' + clean;
    }

    if (clean.length > 10 && clean.includes('15')) {
        const idx = clean.indexOf('15');
        if (idx >= 2 && idx <= 4) {
            clean = clean.slice(0, idx) + clean.slice(idx + 2);
        }
    }

    if (clean.length === 7) {
        clean = DEFAULT_AREA_CODE + clean;
    }

    if (clean.length > 10) {
        clean = clean.slice(0, 10);
    }

    return '549' + clean;
}

export const normalizePhoneForMeta = normalizeArgentinePhone;

/**
 * Registra un mensaje saliente en la tabla whatsapp_messages del CRM
 */
export async function logOutgoingCrmMessage({
    phone,
    content,
    mediaUrl = null,
    mediaType = 'text',
    senderName = 'Vyper Labs',
    rawPayload = null,
}: {
    phone: string;
    content: string;
    mediaUrl?: string | null;
    mediaType?: string;
    senderName?: string;
    rawPayload?: any;
}) {
    try {
        const normPhone = normalizeArgentinePhone(phone);
        if (!normPhone) return;
        await db.from('whatsapp_messages').insert({
            phone: normPhone,
            direction: 'outgoing',
            content: content || '',
            media_url: mediaUrl,
            media_type: mediaType || 'text',
            sender_name: senderName,
            is_read: true,
            raw_payload: rawPayload,
        });
    } catch (e) {
        console.warn('[CRM] No se pudo registrar mensaje saliente en whatsapp_messages:', e);
    }
}

export async function getTemplateMapping(): Promise<WhatsAppTemplateMapping> {
    try {
        const { data } = await db
            .from('configuraciones')
            .select('valor')
            .eq('clave', 'whatsapp_meta_templates')
            .single();

        if (data && data.valor) {
            return {
                ...DEFAULT_TEMPLATE_MAPPING,
                ...data.valor,
                templates: {
                    ...DEFAULT_TEMPLATE_MAPPING.templates,
                    ...(data.valor.templates || {}),
                },
            };
        }
    } catch {
        // Fallback to defaults
    }
    return DEFAULT_TEMPLATE_MAPPING;
}

/**
 * GET /api/v2/{id}/whatsapp-template?limit=50
 * Obtiene todas las plantillas aprobadas de la cuenta de WhatsApp Business en Meta
 */
export async function listWhatsAppTemplates(limit = 50): Promise<{
    success: boolean;
    data: any[];
    error?: string;
}> {
    try {
        const baseUrl = getBuilderBotBaseUrl();
        const apiKey = process.env.BUILDERBOT_API_KEY;

        if (!baseUrl || !apiKey) {
            return { success: false, data: [], error: 'Credenciales de BuilderBot no configuradas en .env' };
        }

        const res = await fetch(`${baseUrl}/whatsapp-template?limit=${limit}`, {
            method: 'GET',
            headers: {
                'x-api-builderbot': apiKey,
            },
            cache: 'no-store',
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                success: false,
                data: [],
                error: json?.error || json?.message || `HTTP ${res.status}`,
            };
        }

        const templates = Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.templates)
            ? json.templates
            : Array.isArray(json)
            ? json
            : [];

        return { success: true, data: templates };
    } catch (error: any) {
        return { success: false, data: [], error: error?.message || 'Error consultando plantillas' };
    }
}

/**
 * POST /api/v2/{id}/messages
 * Envía un mensaje directo (texto o archivo multimedia) dentro de la ventana de 24h de WhatsApp
 */
export async function sendDirectWhatsAppMessage({
    to,
    content,
    mediaUrl,
    mediaType,
    transcription,
    senderName = 'Operador Vyper',
    skipCrmLog = false,
}: {
    to: string;
    content: string;
    mediaUrl?: string;
    mediaType?: string;
    transcription?: string;
    senderName?: string;
    skipCrmLog?: boolean;
}): Promise<{ ok: boolean; error?: string; response?: any }> {
    try {
        const baseUrl = getBuilderBotBaseUrl();
        const apiKey = process.env.BUILDERBOT_API_KEY;

        if (!baseUrl || !apiKey) {
            return { ok: false, error: 'Credenciales de BuilderBot no configuradas' };
        }

        const cleanPhone = normalizeArgentinePhone(to);
        if (!cleanPhone) {
            return { ok: false, error: 'Número de teléfono inválido' };
        }

        const inferredType =
            mediaType ||
            (mediaUrl
                ? /\.(mp3|ogg|oga|opus|wav|m4a|aac|weba)($|\?)/i.test(mediaUrl)
                    ? 'audio'
                    : /\.(jpe?g|png|gif|webp|bmp|svg)($|\?)/i.test(mediaUrl)
                    ? 'image'
                    : /\.(mp4|mov|avi|mkv|3gp|webm)($|\?)/i.test(mediaUrl)
                    ? 'video'
                    : 'document'
                : 'text');

        const payload = {
            messages: {
                content:
                    content ||
                    (inferredType === 'audio'
                        ? '🎤 Audio'
                        : mediaUrl
                        ? '📎 Archivo adjunto'
                        : ''),
                ...(mediaUrl ? { mediaUrl } : {}),
            },
            number: cleanPhone,
            checkIfExists: false,
        };

        const response = await fetch(`${baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-builderbot': apiKey,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(async () => ({ raw: await response.text() }));

        if (!response.ok) {
            return {
                ok: false,
                error: data?.error || data?.message || `Error HTTP ${response.status}`,
                response: data,
            };
        }

        if (!skipCrmLog) {
            await logOutgoingCrmMessage({
                phone: cleanPhone,
                content: content || (inferredType === 'audio' ? '🎤 Mensaje de voz' : ''),
                mediaUrl: mediaUrl || null,
                mediaType: inferredType,
                senderName,
                rawPayload: {
                    source: 'crm_direct',
                    ...(transcription ? { transcription } : {}),
                    response: data,
                },
            });
        }

        return { ok: true, response: data };
    } catch (error: any) {
        return { ok: false, error: error?.message || 'Error de red enviando mensaje' };
    }
}

/**
 * POST /api/v2/{id}/whatsapp-template
 * Envía una plantilla aprobada por Meta a través de BuilderBot y la registra en el CRM
 */
export async function sendWhatsAppTemplate({
    to,
    templateName,
    languageCode = 'es_AR',
    parameters = [],
    renderedText,
    senderName = 'Sistema Vyper (Plantilla Meta)',
}: {
    to: string;
    templateName: string;
    languageCode?: string;
    parameters?: (string | number)[];
    renderedText?: string;
    senderName?: string;
}): Promise<{ ok: boolean; error?: string; response?: any }> {
    try {
        const baseUrl = getBuilderBotBaseUrl();
        const apiKey = process.env.BUILDERBOT_API_KEY;

        if (!baseUrl || !apiKey) {
            return { ok: false, error: 'BuilderBot credentials not configured' };
        }

        const cleanPhone = normalizeArgentinePhone(to);
        if (!cleanPhone) {
            return { ok: false, error: 'Número de teléfono inválido' };
        }

        const sanitizedParams = parameters.map(p => sanitizeMetaParam(p));

        const payload: WhatsAppTemplatePayload = {
            to: cleanPhone,
            templateName,
            languageCode,
        };

        if (sanitizedParams.length > 0) {
            payload.components = [
                {
                    type: 'body',
                    parameters: sanitizedParams.map(text => ({
                        type: 'text',
                        text,
                    })),
                },
            ];
        }

        const response = await fetch(`${baseUrl}/whatsapp-template`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-builderbot': apiKey,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(async () => ({ raw: await response.text() }));

        const previewContent =
            renderedText ||
            (templateName === 'vyper_notificacion_general' && sanitizedParams.length >= 4
                ? `👋 Hola *${sanitizedParams[0]}*, te enviamos una actualización de *Vyper Suplementos*:\n\n📌 *Motivo:* ${sanitizedParams[1]}\n📊 *Detalle:* ${sanitizedParams[2]}\n\n💡 ${sanitizedParams[3]}`
                : `📋 [Plantilla Meta: ${templateName}] ${sanitizedParams.join(' | ')}`);

        // Log in CRM even if template is still PENDING approval in Meta so operator sees the attempt
        await logOutgoingCrmMessage({
            phone: cleanPhone,
            content: previewContent,
            mediaType: 'text',
            senderName,
            rawPayload: {
                source: 'meta_template',
                templateName,
                languageCode,
                parameters: sanitizedParams,
                ok: response.ok,
                response: data,
            },
        });

        if (!response.ok) {
            console.error('BuilderBot whatsapp-template error:', response.status, data);
            return {
                ok: false,
                error: data?.error || data?.message || `Error HTTP ${response.status}`,
                response: data,
            };
        }

        return { ok: true, response: data };
    } catch (error: any) {
        console.error('Error sending WhatsApp template:', error);
        return { ok: false, error: error?.message || 'Error de red' };
    }
}

/**
 * 1. Notificación de Compra y Suma de Vyper Coins
 */
export async function sendWhatsAppNotification(
    clientName: string,
    amount: number,
    totalCoins: number,
    phone: string
): Promise<boolean> {
    const mapping = await getTemplateMapping();
    const formattedAmount = `$${Number(amount || 0).toLocaleString('es-AR')}`;
    const tierInfo = getTier(totalCoins);
    const tierText = getTierText(totalCoins);
    const tierProgress =
        tierInfo.coinsToNext !== null
            ? `Te faltan ${tierInfo.coinsToNext} coins para subir a ${tierInfo.nextTier}`
            : '¡Sos nivel máximo! Felicitaciones';

    if (mapping.modo === 'universal') {
        const res = await sendWhatsAppTemplate({
            to: phone,
            templateName: mapping.universalTemplateName,
            languageCode: mapping.languageCode,
            parameters: [
                clientName,
                `Compra registrada por ${formattedAmount}`,
                `Sumaste puntos y ya tenés ${totalCoins} Vyper Coins acumuladas (Nivel ${tierText}).`,
                `${tierProgress}. ¡Cuanto más comprás, más recompensas acumulás!`,
            ],
        });
        return res.ok;
    }

    const res = await sendWhatsAppTemplate({
        to: phone,
        templateName: mapping.templates.compra_coins,
        languageCode: mapping.languageCode,
        parameters: [clientName, formattedAmount, String(totalCoins), tierText, tierProgress],
    });
    return res.ok;
}

/**
 * 2 & 3. Notificación de Cuenta Corriente (Cargo o Pago)
 */
export async function sendDebtNotification(
    clientName: string,
    amount: number,
    newBalance: number,
    transactionType: 'charge' | 'payment',
    phone: string
): Promise<boolean> {
    const mapping = await getTemplateMapping();
    const formattedAmount = `$${Number(amount || 0).toLocaleString('es-AR')}`;
    const formattedBalance = `$${Number(newBalance || 0).toLocaleString('es-AR')}`;

    if (mapping.modo === 'universal') {
        const isCharge = transactionType === 'charge';
        const res = await sendWhatsAppTemplate({
            to: phone,
            templateName: mapping.universalTemplateName,
            languageCode: mapping.languageCode,
            parameters: [
                clientName,
                isCharge
                    ? `Nueva compra en Cuenta Corriente por ${formattedAmount}`
                    : `Pago recibido en Cuenta Corriente por ${formattedAmount}`,
                `Tu nuevo saldo actualizado es ${formattedBalance}.`,
                isCharge
                    ? 'Recordá que podés abonar tu cuenta en nuestras sucursales o por transferencia.'
                    : newBalance === 0
                    ? '¡Felicitaciones! Tu cuenta está al día.'
                    : '¡Muchas gracias por tu pago!',
            ],
        });
        return res.ok;
    }

    if (transactionType === 'charge') {
        const res = await sendWhatsAppTemplate({
            to: phone,
            templateName: mapping.templates.ctacte_cargo,
            languageCode: mapping.languageCode,
            parameters: [clientName, formattedAmount, formattedBalance],
        });
        return res.ok;
    } else {
        const closingMsg =
            newBalance === 0
                ? '¡Felicitaciones! Tu cuenta está al día'
                : 'Seguí abonando para mantener tu cuenta al día';
        const res = await sendWhatsAppTemplate({
            to: phone,
            templateName: mapping.templates.ctacte_pago,
            languageCode: mapping.languageCode,
            parameters: [clientName, formattedAmount, formattedBalance, closingMsg],
        });
        return res.ok;
    }
}

/**
 * 4. Notificación de Cambio de Estado de Pedido Ecommerce
 */
export async function sendOrderStatusNotification(
    clientName: string,
    pedidoNumero: number,
    nuevoEstado: string,
    total: number,
    phone: string,
    pedidoId?: string
): Promise<boolean> {
    const mapping = await getTemplateMapping();
    const formattedTotal = `$${Number(total || 0).toLocaleString('es-AR')}`;
    const numStr = String(pedidoNumero || 0).padStart(4, '0');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vyper.com';
    const trackingUrl = pedidoId ? `${siteUrl}/pedido/${pedidoId}` : siteUrl;

    const estadoLabel =
        nuevoEstado === 'procesando'
            ? 'EN PREPARACIÓN'
            : nuevoEstado === 'completado'
            ? 'LISTO PARA RETIRO / ENTREGA'
            : nuevoEstado.toUpperCase();

    const notaEstado =
        nuevoEstado === 'procesando'
            ? 'Ya estamos armando tu pedido en nuestro depósito. Te avisaremos apenas esté listo.'
            : nuevoEstado === 'completado'
            ? 'Tu pedido ya fue completado y está listo para retirar o despachar. ¡Gracias por elegirnos!'
            : `Seguí el avance de tu pedido en ${trackingUrl}`;

    if (mapping.modo === 'universal') {
        const res = await sendWhatsAppTemplate({
            to: phone,
            templateName: mapping.universalTemplateName,
            languageCode: mapping.languageCode,
            parameters: [
                clientName,
                `Pedido #${numStr} (${formattedTotal}) — ${estadoLabel}`,
                notaEstado,
                `Seguimiento en vivo: ${trackingUrl}`,
            ],
        });
        return res.ok;
    }

    const res = await sendWhatsAppTemplate({
        to: phone,
        templateName: mapping.templates.estado_pedido,
        languageCode: mapping.languageCode,
        parameters: [numStr, clientName, formattedTotal, estadoLabel, notaEstado, trackingUrl],
    });
    return res.ok;
}

/**
 * 5 & 6. Recordatorio de Saldo Pendiente o Mensaje de Retención
 */
export async function sendDebtReminderNotification(
    clientName: string,
    balance: number,
    phone: string,
    customMessage?: string
): Promise<boolean> {
    const mapping = await getTemplateMapping();
    const formattedBalance = `$${Number(balance || 0).toLocaleString('es-AR')}`;

    if (mapping.modo === 'universal' || customMessage) {
        const detalle = customMessage
            ? sanitizeMetaParam(customMessage)
            : `Te recordamos amablemente que tu cuenta corriente registra un saldo pendiente de ${formattedBalance}.`;

        const motivo =
            balance > 0
                ? `Recordatorio de Cuenta Corriente (${formattedBalance})`
                : 'Beneficios y Novedades para vos';

        const res = await sendWhatsAppTemplate({
            to: phone,
            templateName: mapping.universalTemplateName,
            languageCode: mapping.languageCode,
            parameters: [
                clientName,
                motivo,
                detalle,
                'Podés responder este mensaje si tenés cualquier consulta. ¡Gracias por tu confianza!',
            ],
        });
        return res.ok;
    }

    const res = await sendWhatsAppTemplate({
        to: phone,
        templateName: mapping.templates.recordatorio_saldo,
        languageCode: mapping.languageCode,
        parameters: [clientName, formattedBalance],
    });
    return res.ok;
}
