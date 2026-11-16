import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { normalizeArgentinePhone } from '@/lib/builderbot';

const db = supabaseAdmin || supabase;

function inferMediaType(url: string, rawAttachment?: any): string {
    const clean = String(url || '').toLowerCase();
    if (/\.(mp3|ogg|oga|opus|wav|m4a|aac|webm)($|\?)/i.test(clean) || clean.includes('/audio') || clean.includes('voice')) {
        return 'audio';
    }
    if (/\.(webp)($|\?)/i.test(clean) && clean.includes('sticker')) {
        return 'sticker';
    }
    if (/\.(jpe?g|png|gif|bmp|svg|webp)($|\?)/i.test(clean) || clean.includes('/image')) {
        return 'image';
    }
    if (/\.(mp4|mov|avi|mkv)($|\?)/i.test(clean) || clean.includes('/video')) {
        return 'video';
    }
    if (/\.(pdf|doc|docx|xls|xlsx|csv|txt)($|\?)/i.test(clean)) {
        return 'document';
    }
    if (typeof rawAttachment?.mimeType === 'string') {
        const mime = rawAttachment.mimeType.toLowerCase();
        if (mime.includes('audio')) return 'audio';
        if (mime.includes('image')) return 'image';
        if (mime.includes('video')) return 'video';
    }
    return 'document';
}

function extractMediaFromData(data: any): { mediaUrl: string | null; mediaType: string } {
    let mediaUrl: string | null = null;
    let mediaType = 'text';

    // 1. urlTempFile / urlsTempsFiles
    if (typeof data?.urlTempFile === 'string' && data.urlTempFile.startsWith('http')) {
        mediaUrl = data.urlTempFile;
    } else if (Array.isArray(data?.urlsTempsFiles) && data.urlsTempsFiles.length > 0) {
        const first = data.urlsTempsFiles[0];
        if (typeof first === 'string' && first.startsWith('http')) {
            mediaUrl = first;
        }
    }

    // 2. Check explicit voice note
    const rawBody = String(data?.body || data?.answer || '');
    if (
        data?.type === 'audio' ||
        data?.type === 'voice' ||
        rawBody.startsWith('_event_voice_note_') ||
        data?.fileData?.voice === true
    ) {
        mediaType = 'audio';
    }

    // 3. Check data.attachment array (from BuilderBot screenshot: "attachment": [])
    if (!mediaUrl && Array.isArray(data?.attachment) && data.attachment.length > 0) {
        const first = data.attachment[0];
        if (typeof first === 'string' && first.startsWith('http')) {
            mediaUrl = first;
        } else if (first?.url && typeof first.url === 'string') {
            mediaUrl = first.url;
        } else if (first?.payload?.url) {
            mediaUrl = first.payload.url;
        }
    }

    // 4. Check data.media / data.mediaUrl / data.url
    if (!mediaUrl) {
        if (typeof data?.media === 'string' && data.media.startsWith('http')) {
            mediaUrl = data.media;
        } else if (data?.media?.url) {
            mediaUrl = data.media.url;
        } else if (typeof data?.mediaUrl === 'string' && data.mediaUrl.startsWith('http')) {
            mediaUrl = data.mediaUrl;
        } else if (typeof data?.url === 'string' && data.url.startsWith('http')) {
            mediaUrl = data.url;
        }
    }

    // 5. Infer mediaType if we found a URL
    if (mediaUrl && mediaType === 'text') {
        mediaType = inferMediaType(mediaUrl, data?.attachment?.[0]);
    }

    return { mediaUrl, mediaType };
}

// GET /api/webhook/whatsapp — Verificación rápida del estado del Webhook
export async function GET(request: NextRequest) {
    const origin = request.nextUrl.origin;
    const { data: statusConfig } = await db
        .from('configuraciones')
        .select('valor, updated_at')
        .eq('clave', 'whatsapp_bot_status')
        .maybeSingle();

    return NextResponse.json({
        ok: true,
        service: 'Vyper Labs WhatsApp CRM Webhook',
        webhookUrl: `${origin}/api/webhook/whatsapp`,
        supportedEvents: [
            'message.incoming',
            'message.outgoing',
            'message.calling',
            'status.ready',
            'status.online',
            'status.require_action',
            'status.disconnect',
        ],
        botStatus: statusConfig?.valor || { status: 'ready', updated_at: statusConfig?.updated_at },
    });
}

// POST /api/webhook/whatsapp — Recibe eventos en tiempo real desde BuilderBot Cloud
export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();
        const eventName = String(payload?.eventName || payload?.event || '').trim();
        const data = payload?.data || payload || {};

        // 1. Eventos de estado del Bot (status.ready, status.online, status.require_action, status.disconnect)
        if (eventName.startsWith('status.')) {
            const isOnline = eventName === 'status.ready' || eventName === 'status.online';
            const statusValue = {
                eventName,
                online: isOnline,
                status: data?.status || (isOnline ? 'ready' : 'require_action'),
                qr: data?.payload?.qr || null,
                timestamp: data?.timestamp || Date.now(),
                updatedAt: new Date().toISOString(),
            };

            await db.from('configuraciones').upsert(
                {
                    clave: 'whatsapp_bot_status',
                    valor: statusValue,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'clave' }
            );

            return NextResponse.json({ ok: true, event: eventName, status: statusValue.status });
        }

        // 2. Ignorar grupos, canales de difusión y newsletters
        const rawFrom = String(data?.from || data?.to || data?.number || data?.key?.remoteJid || '');
        if (
            rawFrom.endsWith('@newsletter') ||
            rawFrom.includes('newsletter') ||
            rawFrom.endsWith('@g.us') ||
            rawFrom.endsWith('@broadcast') ||
            rawFrom === 'status@broadcast' ||
            rawFrom.startsWith('120363')
        ) {
            return NextResponse.json({ ok: true, skipped: true, reason: 'group_or_channel_ignored' });
        }

        const phone = normalizeArgentinePhone(rawFrom);
        if (!phone) {
            return NextResponse.json({ ok: true, skipped: true, reason: 'empty_phone' });
        }

        // 3. Evento: message.calling (Llamada entrante de WhatsApp)
        if (eventName === 'message.calling') {
            const rawName = String(data?.name || data?.pushName || '').trim();
            const senderName = rawName && rawName.toLowerCase() !== 'unknown' ? rawName : null;

            const { data: inserted } = await db
                .from('whatsapp_messages')
                .insert({
                    phone,
                    direction: 'incoming',
                    content: '📞 Llamada entrante de WhatsApp (rechazada automáticamente por el bot)',
                    media_url: null,
                    media_type: 'call',
                    sender_name: senderName,
                    is_read: false,
                    raw_payload: payload,
                })
                .select('id')
                .maybeSingle();

            return NextResponse.json({ ok: true, event: 'message.calling', id: inserted?.id });
        }

        // 4. Evento: message.outgoing (Mensaje enviado por el bot o desde el dispositivo)
        if (eventName === 'message.outgoing') {
            const answerText = String(data?.answer || data?.body || data?.content || '').trim();
            const { mediaUrl, mediaType } = extractMediaFromData(data);

            if (!answerText && !mediaUrl) {
                return NextResponse.json({ ok: true, skipped: true, reason: 'empty_outgoing' });
            }

            // Deduplicación: si nuestro propio CRM ya guardó este mensaje saliente en los últimos 12 segundos, no duplicar
            const twelveSecondsAgo = new Date(Date.now() - 12000).toISOString();
            const { data: recentOut } = await db
                .from('whatsapp_messages')
                .select('id, content')
                .eq('phone', phone)
                .eq('direction', 'outgoing')
                .gte('created_at', twelveSecondsAgo)
                .order('created_at', { ascending: false })
                .limit(3);

            const isDuplicate = (recentOut || []).some(
                r =>
                    r.content === answerText ||
                    (answerText && r.content && r.content.includes(answerText.slice(0, 35)))
            );

            if (isDuplicate) {
                return NextResponse.json({ ok: true, skipped: true, reason: 'already_logged_by_crm' });
            }

            const { data: inserted } = await db
                .from('whatsapp_messages')
                .insert({
                    phone,
                    direction: 'outgoing',
                    content: answerText || (mediaUrl ? `[${mediaType}]` : ''),
                    media_url: mediaUrl,
                    media_type: mediaType,
                    sender_name: 'Bot / WhatsApp Business',
                    is_read: true,
                    raw_payload: payload,
                })
                .select('id')
                .maybeSingle();

            return NextResponse.json({ ok: true, event: 'message.outgoing', id: inserted?.id });
        }

        // 5. Evento: message.incoming (o payload directo de mensaje entrante)
        if (eventName === 'message.incoming' || data?.body !== undefined) {
            const isFromMe = Boolean(data?.fromMe === true || data?.key?.fromMe === true);
            const direction = isFromMe ? 'outgoing' : 'incoming';

            const rawName = String(data?.name || data?.pushName || '').trim();
            const senderName = isFromMe
                ? 'Operador (WhatsApp)'
                : rawName && rawName.toLowerCase() !== 'unknown'
                ? rawName
                : null;

            const { mediaUrl, mediaType } = extractMediaFromData(data);
            let content = String(data?.body || data?.content || '').trim();

            if (content.startsWith('_event_media__') || content.startsWith('_event_voice_note_')) {
                content = data?.caption || (mediaType === 'audio' ? '🎤 Mensaje de voz' : '');
            }

            // Ignorar placeholders sintéticos vacíos de BuilderBot
            if (
                !mediaUrl &&
                mediaType === 'text' &&
                /^\uFEFF?\s*(mmm,\s*entiendo\.\s*contin[uú]a\.|hmm,\s*i\s*see\.\s*go\s*on\.)\s*$/i.test(content)
            ) {
                return NextResponse.json({ ok: true, skipped: true, reason: 'synthetic_placeholder' });
            }

            const { data: inserted, error: insertError } = await db
                .from('whatsapp_messages')
                .insert({
                    phone,
                    direction,
                    content: content || (mediaUrl ? `[${mediaType}]` : ''),
                    media_url: mediaUrl,
                    media_type: mediaType,
                    sender_name: senderName,
                    is_read: direction === 'outgoing',
                    raw_payload: payload,
                })
                .select('id')
                .maybeSingle();

            if (insertError) {
                console.error('[webhook/whatsapp] Error insertando mensaje:', insertError);
                return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
            }

            return NextResponse.json({
                ok: true,
                event: eventName || 'message.incoming',
                phone,
                direction,
                id: inserted?.id,
            });
        }

        return NextResponse.json({ ok: true, skipped: true, event: eventName });
    } catch (error: any) {
        console.error('[webhook/whatsapp] Error procesando webhook:', error);
        return NextResponse.json(
            { ok: false, error: error?.message || 'Invalid JSON payload' },
            { status: 400 }
        );
    }
}
