// Supabase Edge Function: whatsapp-webhook (Vyper Labs CRM)
// URL para BuilderBot:
//   https://ophbmcprxcnpkpndusbe.supabase.co/functions/v1/whatsapp-webhook
// Recibe todos los eventos de BuilderBot (message.incoming, message.outgoing, message.calling, status.*)
// Descarga y persiste archivos multimedia en el bucket 'whatsapp-media' de Supabase Storage
// Guarda todos los mensajes en la tabla 'whatsapp_messages' de Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const STORAGE_BUCKET = 'whatsapp-media';

async function transcribeWithWhisper(
    audioBuffer: ArrayBuffer,
    fileName = 'audio.ogg',
    mimeType = 'audio/ogg'
): Promise<string | null> {
    if (!OPENAI_API_KEY) return null;
    try {
        const form = new FormData();
        const blob = new Blob([audioBuffer], { type: mimeType });
        form.append('file', blob, fileName);
        form.append('model', 'whisper-1');
        form.append('language', 'es');

        const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: form,
        });
        if (!res.ok) return null;
        const data = await res.json();
        return String(data?.text || '').trim() || null;
    } catch {
        return null;
    }
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-builderbot',
};

function normalizePhone(phone: string | null | undefined): string {
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
        clean = '264' + clean.slice(2);
        return '549' + clean;
    }
    if (clean.length > 10 && clean.includes('15')) {
        const idx = clean.indexOf('15');
        if (idx >= 2 && idx <= 4) {
            clean = clean.slice(0, idx) + clean.slice(idx + 2);
        }
    }
    if (clean.length === 7) {
        clean = '264' + clean;
    }
    if (clean.length > 10) {
        clean = clean.slice(0, 10);
    }

    return '549' + clean;
}

function getMimeForMediaType(mediaType: string): string {
    switch (mediaType) {
        case 'image': return 'image/jpeg';
        case 'audio': return 'audio/ogg';
        case 'video': return 'video/mp4';
        case 'sticker': return 'image/webp';
        case 'document': return 'application/octet-stream';
        default: return 'application/octet-stream';
    }
}

function getExtensionFromMime(contentType: string, url: string, mediaType: string): string {
    if (mediaType === 'audio') {
        const lowerUrl = (url || '').toLowerCase();
        if (lowerUrl.includes('.mp3')) return 'mp3';
        if (lowerUrl.includes('.m4a')) return 'm4a';
        if (lowerUrl.includes('.wav')) return 'wav';
        return 'ogg';
    }

    const urlExtMatch = (url || '').match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
    if (urlExtMatch) {
        const ext = urlExtMatch[1].toLowerCase();
        const validExts = [
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
            'mp3', 'ogg', 'oga', 'opus', 'wav', 'm4a', 'aac', 'weba', 'webm',
            'mp4', 'mov', 'avi', 'mkv', '3gp',
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt',
        ];
        if (validExts.includes(ext)) {
            return ext === 'oga' ? 'ogg' : ext;
        }
    }

    const mimeMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'audio/ogg': 'ogg',
        'audio/opus': 'opus',
        'audio/mpeg': 'mp3',
        'audio/mp4': 'm4a',
        'video/mp4': 'mp4',
        'application/pdf': 'pdf',
    };

    const mime = (contentType || '').split(';')[0].trim().toLowerCase();
    if (mimeMap[mime]) return mimeMap[mime];

    switch (mediaType) {
        case 'image': return 'jpg';
        case 'audio': return 'ogg';
        case 'video': return 'mp4';
        case 'sticker': return 'webp';
        default: return 'bin';
    }
}

function inferMediaType(url: string, attachment?: any): string {
    const lower = String(url || '').toLowerCase();
    if (typeof attachment === 'string') {
        const attLower = attachment.toLowerCase();
        if (/\.(mp3|ogg|oga|opus|wav|m4a|aac|weba|webm)(\?|$)/i.test(attLower)) return 'audio';
        if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(attLower)) return 'image';
        if (/\.(mp4|mov|avi|mkv|3gp)(\?|$)/i.test(attLower)) return 'video';
        if (/\.(pdf|doc|docx|xls|xlsx|csv|txt)(\?|$)/i.test(attLower)) return 'document';
    }
    if (/\.(mp3|ogg|oga|opus|wav|m4a|aac|weba|webm)(\?|$)/i.test(lower) || lower.includes('/audio') || lower.includes('voice')) return 'audio';
    if (lower.includes('sticker') || (lower.endsWith('.webp') && lower.includes('sticker'))) return 'sticker';
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(lower) || lower.includes('/image')) return 'image';
    if (/\.(mp4|mov|avi|mkv|3gp)(\?|$)/i.test(lower) || lower.includes('/video')) return 'video';
    if (/\.(pdf|doc|docx|xls|xlsx|csv|txt)(\?|$)/i.test(lower)) return 'document';
    return 'document';
}

async function persistMediaToStorage(
    supabase: any,
    tempUrl: string,
    mediaType: string,
    phone: string,
    originalFilename?: string | null
): Promise<string | null> {
    try {
        const response = await fetch(tempUrl);
        if (!response.ok) return null;

        const responseContentType = (response.headers.get('content-type') || '').toLowerCase();
        if (responseContentType.includes('text/html') || responseContentType.includes('application/json')) {
            return null;
        }

        const fileBuffer = await response.arrayBuffer();
        if (fileBuffer.byteLength > 50 * 1024 * 1024) return null;

        let contentType = mediaType === 'audio'
            ? (responseContentType.startsWith('audio/') ? responseContentType : 'audio/ogg')
            : (responseContentType || getMimeForMediaType(mediaType));

        const extension = getExtensionFromMime(contentType, originalFilename || tempUrl, mediaType);
        const filePath = `incoming/${phone}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, fileBuffer, {
                contentType,
                cacheControl: '31536000',
                upsert: false,
            });

        if (uploadError) return null;

        const { data: publicUrlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

        return publicUrlData?.publicUrl || null;
    } catch {
        return null;
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method === 'GET') {
        return new Response(
            JSON.stringify({
                ok: true,
                service: 'Vyper Labs Supabase WhatsApp Webhook',
                endpoint: `${SUPABASE_URL}/functions/v1/whatsapp-webhook`,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        const payload = await req.json();
        const eventName = String(payload?.eventName || payload?.event || '').trim();
        const data = payload?.data || payload || {};

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 0. Acción directa de transcripción desde el CRM (crm.transcribe)
        if (eventName === 'crm.transcribe') {
            let audioBuffer: ArrayBuffer | null = null;
            const fileName = String(payload?.fileName || 'audio.ogg');
            const mimeType = String(payload?.mimeType || 'audio/ogg');

            if (payload?.base64Audio) {
                const binaryStr = atob(String(payload.base64Audio));
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                }
                audioBuffer = bytes.buffer;
            } else if (payload?.audioUrl) {
                const r = await fetch(String(payload.audioUrl));
                if (r.ok) audioBuffer = await r.arrayBuffer();
            }

            if (!audioBuffer) {
                return new Response(
                    JSON.stringify({ ok: false, error: 'No se pudo obtener el audio' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            const text = await transcribeWithWhisper(audioBuffer, fileName, mimeType);
            if (!text) {
                return new Response(
                    JSON.stringify({ ok: false, error: 'No se pudo transcribir con Whisper' }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            return new Response(
                JSON.stringify({ ok: true, text }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

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

            await supabase.from('configuraciones').upsert(
                {
                    clave: 'whatsapp_bot_status',
                    valor: statusValue,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'clave' }
            );

            return new Response(
                JSON.stringify({ ok: true, event: eventName, isOnline }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2. Ignorar grupos, newsletters y canales de difusión
        const rawFrom = String(data?.from || data?.to || data?.number || data?.key?.remoteJid || '');
        if (
            rawFrom.endsWith('@newsletter') ||
            rawFrom.includes('newsletter') ||
            rawFrom.endsWith('@g.us') ||
            rawFrom.endsWith('@broadcast') ||
            rawFrom === 'status@broadcast' ||
            rawFrom.startsWith('120363')
        ) {
            return new Response(
                JSON.stringify({ ok: true, skipped: true, reason: 'channel_or_group_ignored' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const phone = normalizePhone(rawFrom);
        if (!phone) {
            return new Response(
                JSON.stringify({ ok: true, skipped: true, reason: 'empty_phone' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. Evento: message.calling (Llamada entrante de WhatsApp)
        if (eventName === 'message.calling') {
            const rawName = String(data?.name || data?.pushName || '').trim();
            const senderName = rawName && rawName.toLowerCase() !== 'unknown' ? rawName : null;

            const { data: inserted } = await supabase
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

            return new Response(
                JSON.stringify({ ok: true, event: 'message.calling', id: inserted?.id }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 4. Extraer media si existe
        let mediaUrl: string | null = null;
        let mediaType = 'text';

        if (typeof data?.urlTempFile === 'string' && data.urlTempFile.startsWith('http')) {
            mediaUrl = data.urlTempFile;
        } else if (Array.isArray(data?.urlsTempsFiles) && data.urlsTempsFiles.length > 0 && typeof data.urlsTempsFiles[0] === 'string') {
            mediaUrl = data.urlsTempsFiles[0];
        } else if (Array.isArray(data?.attachment) && data.attachment.length > 0) {
            const first = data.attachment[0];
            if (typeof first === 'string' && first.startsWith('http')) mediaUrl = first;
            else if (first?.url) mediaUrl = first.url;
            else if (first?.payload?.url) mediaUrl = first.payload.url;
        } else if (typeof data?.media === 'string' && data.media.startsWith('http')) {
            mediaUrl = data.media;
        } else if (data?.media?.url) {
            mediaUrl = data.media.url;
        } else if (typeof data?.mediaUrl === 'string' && data.mediaUrl.startsWith('http')) {
            mediaUrl = data.mediaUrl;
        }

        const rawContent = eventName === 'message.outgoing'
            ? String(data?.answer || data?.body || data?.content || '').trim()
            : String(data?.body || data?.content || '').trim();

        const isExplicitVoiceNote = Boolean(
            data?.type === 'audio' ||
            data?.type === 'voice' ||
            data?.fileData?.voice === true ||
            rawContent.startsWith('_event_voice_note_')
        );

        if (isExplicitVoiceNote) {
            mediaType = 'audio';
        } else if (data?.message) {
            const msg = data.message;
            if (msg.audioMessage) mediaType = 'audio';
            else if (msg.imageMessage) mediaType = 'image';
            else if (msg.videoMessage) mediaType = 'video';
            else if (msg.stickerMessage) mediaType = 'sticker';
            else if (msg.documentMessage || msg.documentWithCaptionMessage) mediaType = 'document';
        }

        if (mediaUrl && mediaType === 'text') {
            mediaType = inferMediaType(mediaUrl, data?.attachment?.[0]);
        }

        const docFileName =
            data?.message?.documentMessage?.fileName ||
            data?.fileName ||
            data?.filename ||
            null;

        let content = rawContent;
        if (content.startsWith('_event_media__') || content.startsWith('_event_voice_note_')) {
            content = data?.caption || docFileName || (mediaType === 'audio' ? '🎤 Mensaje de voz' : '');
        }
        if (!content && docFileName) {
            content = docFileName;
        }

        // Ignorar placeholders sintéticos de BuilderBot
        if (
            !mediaUrl &&
            mediaType === 'text' &&
            /^\uFEFF?\s*(mmm,\s*entiendo\.\s*contin[uú]a\.|hmm,\s*i\s*see\.\s*go\s*on\.)\s*$/i.test(content)
        ) {
            return new Response(
                JSON.stringify({ ok: true, skipped: true, reason: 'builderbot_synthetic_placeholder' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Persistir media temporal en Supabase Storage ('whatsapp-media')
        const originalMediaUrl = mediaUrl;
        let autoTranscription: string | null = null;
        if (mediaUrl) {
            const persisted = await persistMediaToStorage(supabase, mediaUrl, mediaType, phone, docFileName);
            if (persisted) {
                mediaUrl = persisted;
            }
            // Si es un audio entrante, transcribir automáticamente en el momento con Whisper
            if (mediaType === 'audio' && OPENAI_API_KEY && mediaUrl) {
                try {
                    const audioRes = await fetch(mediaUrl);
                    if (audioRes.ok) {
                        const buf = await audioRes.arrayBuffer();
                        autoTranscription = await transcribeWithWhisper(buf, 'voice.ogg', 'audio/ogg');
                    }
                } catch {
                    // ignore auto-transcribe error
                }
            }
        }

        // 5. Evento: message.outgoing (evitar duplicados si fue enviado desde el CRM)
        if (eventName === 'message.outgoing') {
            if (!content && !mediaUrl) {
                return new Response(
                    JSON.stringify({ ok: true, skipped: true, reason: 'empty_outgoing' }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            const twelveSecondsAgo = new Date(Date.now() - 12000).toISOString();
            const { data: recentOut } = await supabase
                .from('whatsapp_messages')
                .select('id, content')
                .eq('phone', phone)
                .eq('direction', 'outgoing')
                .gte('created_at', twelveSecondsAgo)
                .order('created_at', { ascending: false })
                .limit(3);

            const isDuplicate = (recentOut || []).some(
                (r: any) =>
                    r.content === content ||
                    (content && r.content && r.content.includes(content.slice(0, 35)))
            );

            if (isDuplicate) {
                return new Response(
                    JSON.stringify({ ok: true, skipped: true, reason: 'already_logged_by_crm' }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            const { data: inserted } = await supabase
                .from('whatsapp_messages')
                .insert({
                    phone,
                    direction: 'outgoing',
                    content: content || (mediaUrl ? `[${mediaType}]` : ''),
                    media_url: mediaUrl,
                    media_type: mediaType,
                    sender_name: 'Bot / WhatsApp Business',
                    is_read: true,
                    original_media_url: originalMediaUrl,
                    raw_payload: autoTranscription
                        ? { ...payload, transcription: autoTranscription, transcribedAt: new Date().toISOString() }
                        : payload,
                })
                .select('id')
                .maybeSingle();

            return new Response(
                JSON.stringify({ ok: true, event: 'message.outgoing', id: inserted?.id }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 6. Evento: message.incoming
        if (eventName === 'message.incoming' || data?.body !== undefined) {
            const isFromMe = Boolean(data?.fromMe === true || data?.key?.fromMe === true);
            const direction = isFromMe ? 'outgoing' : 'incoming';
            const rawName = String(data?.name || data?.pushName || '').trim();
            const senderName = isFromMe
                ? 'Operador (WhatsApp Web)'
                : rawName && rawName.toLowerCase() !== 'unknown'
                ? rawName
                : null;

            const { data: inserted, error: insertError } = await supabase
                .from('whatsapp_messages')
                .insert({
                    phone,
                    direction,
                    content: content || (mediaUrl ? `[${mediaType}]` : ''),
                    media_url: mediaUrl,
                    media_type: mediaType,
                    sender_name: senderName,
                    is_read: direction === 'outgoing',
                    original_media_url: originalMediaUrl,
                    raw_payload: autoTranscription
                        ? { ...payload, transcription: autoTranscription, transcribedAt: new Date().toISOString() }
                        : payload,
                })
                .select('id')
                .maybeSingle();

            if (insertError) {
                return new Response(
                    JSON.stringify({ ok: false, error: insertError.message }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            return new Response(
                JSON.stringify({
                    ok: true,
                    event: 'message.incoming',
                    phone,
                    direction,
                    id: inserted?.id,
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ ok: true, skipped: true, event: eventName }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ ok: false, error: error?.message || 'Error processing webhook' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
