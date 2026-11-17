import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

const db = supabaseAdmin || supabase;
const BUCKET = 'whatsapp-media';

function detectMediaCategory(mimeType: string, fileName: string): {
    mediaType: 'image' | 'audio' | 'video' | 'document';
    ext: string;
    normalizedMime: string;
} {
    const mime = (mimeType || '').toLowerCase();
    const lowerName = (fileName || '').toLowerCase();
    const extMatch = lowerName.match(/\.([a-z0-9]{2,6})$/i);
    const rawExt = extMatch ? extMatch[1].toLowerCase() : '';

    if (
        mime.startsWith('audio/') ||
        ['ogg', 'oga', 'opus', 'mp3', 'wav', 'm4a', 'aac', 'weba'].includes(rawExt) ||
        lowerName.startsWith('audio_') ||
        lowerName.startsWith('grabacion_')
    ) {
        if (mime.includes('mpeg') || rawExt === 'mp3') {
            return { mediaType: 'audio', ext: 'mp3', normalizedMime: 'audio/mpeg' };
        }
        if (mime.includes('mp4') || mime.includes('m4a') || rawExt === 'm4a') {
            return { mediaType: 'audio', ext: 'm4a', normalizedMime: 'audio/mp4' };
        }
        if (mime.includes('wav') || rawExt === 'wav') {
            return { mediaType: 'audio', ext: 'wav', normalizedMime: 'audio/wav' };
        }
        // Default voice note format compatible with WhatsApp Cloud API & BuilderBot
        return { mediaType: 'audio', ext: 'ogg', normalizedMime: 'audio/ogg' };
    }

    if (
        mime.startsWith('image/') ||
        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(rawExt)
    ) {
        const ext = rawExt || (mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg');
        return {
            mediaType: 'image',
            ext,
            normalizedMime: mime.startsWith('image/') ? mime : `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        };
    }

    if (
        mime.startsWith('video/') ||
        ['mp4', 'mov', 'avi', 'mkv', '3gp', 'webm'].includes(rawExt)
    ) {
        const ext = rawExt === 'mov' ? 'mov' : 'mp4';
        return {
            mediaType: 'video',
            ext,
            normalizedMime: mime.startsWith('video/') ? mime : 'video/mp4',
        };
    }

    const docExt = rawExt || (mime.includes('pdf') ? 'pdf' : 'bin');
    return {
        mediaType: 'document',
        ext: docExt,
        normalizedMime: mime || 'application/octet-stream',
    };
}

async function transcribeAudioBuffer(
    buffer: ArrayBuffer,
    fileName: string,
    mimeType: string
): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ophbmcprxcnpkpndusbe.supabase.co';

    if (apiKey) {
        const form = new FormData();
        const blob = new Blob([buffer], { type: mimeType || 'audio/ogg' });
        form.append('file', blob, fileName || 'audio.ogg');
        form.append('model', 'whisper-1');
        form.append('language', 'es');

        const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: form,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data?.error?.message || `Error Whisper HTTP ${res.status}`);
        }
        return String(data?.text || '').trim();
    }

    // Fallback to Supabase Edge Function if OPENAI_API_KEY is stored in Supabase Secrets
    const base64Audio = Buffer.from(buffer).toString('base64');
    const edgeRes = await fetch(`${supabaseUrl}/functions/v1/whatsapp-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            eventName: 'crm.transcribe',
            base64Audio,
            fileName: fileName || 'audio.ogg',
            mimeType: mimeType || 'audio/ogg',
        }),
    });
    const edgeData = await edgeRes.json().catch(() => ({}));
    if (!edgeRes.ok || !edgeData?.ok) {
        throw new Error(edgeData?.error || 'No se pudo transcribir el audio');
    }
    return String(edgeData.text || '').trim();
}

export async function POST(request: NextRequest) {
    try {
        const contentTypeHeader = request.headers.get('content-type') || '';

        // 1. JSON Request: Transcribe an existing audio URL (and optionally save to messageId)
        if (contentTypeHeader.includes('application/json')) {
            const body = await request.json();
            const { action, audioUrl, messageId } = body;

            if (action === 'transcribe') {
                if (!audioUrl) {
                    return NextResponse.json({ error: 'URL de audio requerida' }, { status: 400 });
                }

                const audioRes = await fetch(audioUrl);
                if (!audioRes.ok) {
                    return NextResponse.json(
                        { error: 'No se pudo descargar el archivo de audio' },
                        { status: 400 }
                    );
                }

                const audioBuffer = await audioRes.arrayBuffer();
                const mime = audioRes.headers.get('content-type') || 'audio/ogg';
                const ext = audioUrl.split('?')[0].split('.').pop() || 'ogg';
                const text = await transcribeAudioBuffer(audioBuffer, `audio.${ext}`, mime);

                // Persist transcription inside whatsapp_messages.raw_payload if messageId provided
                if (messageId && text) {
                    const { data: existingMsg } = await db
                        .from('whatsapp_messages')
                        .select('raw_payload')
                        .eq('id', messageId)
                        .maybeSingle();

                    const updatedPayload = {
                        ...(typeof existingMsg?.raw_payload === 'object' && existingMsg?.raw_payload
                            ? existingMsg.raw_payload
                            : {}),
                        transcription: text,
                        transcribedAt: new Date().toISOString(),
                    };

                    await db
                        .from('whatsapp_messages')
                        .update({ raw_payload: updatedPayload })
                        .eq('id', messageId);
                }

                return NextResponse.json({ ok: true, text });
            }

            return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
        }

        // 2. Multipart FormData Request: Upload file/audio OR transcribe uploaded blob directly
        const formData = await request.formData();
        const action = String(formData.get('action') || 'upload');
        const file = (formData.get('file') || formData.get('files')) as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();

        if (action === 'transcribe_blob') {
            const text = await transcribeAudioBuffer(
                arrayBuffer,
                file.name || 'audio.ogg',
                file.type || 'audio/ogg'
            );
            return NextResponse.json({ ok: true, text });
        }

        const { mediaType, ext, normalizedMime } = detectMediaCategory(file.type, file.name);
        const cleanBaseName = (file.name || `archivo.${ext}`)
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .slice(0, 45);

        const storagePath = `outgoing/${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 6)}_${cleanBaseName}.${ext}`;

        const { error: uploadError } = await db.storage
            .from(BUCKET)
            .upload(storagePath, Buffer.from(arrayBuffer), {
                contentType: normalizedMime,
                cacheControl: '31536000',
                upsert: false,
            });

        if (uploadError) {
            console.error('[CRM Media Upload Error]:', uploadError);
            return NextResponse.json(
                { error: `Error subiendo archivo: ${uploadError.message}` },
                { status: 500 }
            );
        }

        const { data: publicUrlData } = db.storage.from(BUCKET).getPublicUrl(storagePath);
        const publicUrl = publicUrlData?.publicUrl;

        return NextResponse.json({
            ok: true,
            url: publicUrl,
            mediaType,
            fileName: file.name || `${cleanBaseName}.${ext}`,
            mimeType: normalizedMime,
            size: file.size,
        });
    } catch (error: any) {
        console.error('[API /api/crm/media] Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Error procesando archivo multimedia' },
            { status: 500 }
        );
    }
}
