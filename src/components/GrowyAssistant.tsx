'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    Bot,
    X,
    Send,
    Sparkles,
    Mic,
    Square,
    Loader2,
    ArrowUpRight,
    BookOpen,
    MessageSquare,
    HelpCircle,
    Minimize2,
    Maximize2,
} from 'lucide-react';

interface GrowyMessage {
    role: 'user' | 'assistant';
    content: string;
    actions?: { label: string; href: string }[];
    timestamp: string;
}

const QUICK_PROMPTS = [
    '📊 Dame el resumen operativo de hoy en vivo',
    '🎤 ¿Cómo envío y transcribo audios en Whatsapp?',
    '📎 ¿Cómo previsualizo archivos PDF, Excel o imágenes?',
    '📋 ¿Cómo funcionan las Plantillas Meta y la ventana de 24h?',
    '🛒 ¿Cómo cotizo productos dentro del chat de Whatsapp?',
    '⌨️ ¿Cómo uso el buscador rápido Ctrl + K?',
];

export default function GrowyAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [messages, setMessages] = useState<GrowyMessage[]>([
        {
            role: 'assistant',
            content:
                '¡Hola! Soy **Growy**, tu asistente virtual de **Vyper Labs** (desarrollado por Grow Labs).\n\nTengo toda la información técnica y operativa del sistema + acceso en tiempo real a tus ventas, clientes, deuda, stock y mensajes de WhatsApp.\n\n¿En qué te puedo ayudar hoy?',
            actions: [
                { label: 'Abrir Whatsapp', href: '/admin/crm' },
                { label: 'Manual Completo', href: '/tutorial' },
            ],
            timestamp: 'Ahora',
        },
    ]);

    const endRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
        }
    }, [messages, isOpen]);

    // Listen for custom event to open Growy from anywhere (e.g. Command Palette or Manual)
    useEffect(() => {
        const handleOpenGrowy = (e: any) => {
            setIsOpen(true);
            if (e?.detail?.prompt) {
                sendPrompt(e.detail.prompt);
            }
        };
        window.addEventListener('open-growy', handleOpenGrowy);
        return () => window.removeEventListener('open-growy', handleOpenGrowy);
    }, []);

    const sendPrompt = async (textToSend: string) => {
        const clean = textToSend.trim();
        if (!clean || loading) return;

        const nowStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const userMsg: GrowyMessage = {
            role: 'user',
            content: clean,
            timestamp: nowStr,
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai/growy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'assistant',
                    message: clean,
                    history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
                }),
            });
            const data = await res.json();
            const replyText =
                data?.reply ||
                'Puedo ayudarte con cualquier consulta sobre Whatsapp CRM, Ventas, Egresos, Cuenta Corriente, Vyper Coins o Ecommerce.';

            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: replyText,
                    actions: data?.actions || [],
                    timestamp: new Date().toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                },
            ]);
        } catch {
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Ocurrió un error de conexión al consultar a Growy. Intentá nuevamente.',
                    timestamp: nowStr,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const toggleVoiceDictation = () => {
        if (isListening) {
            try {
                recognitionRef.current?.stop();
            } catch {
                // ignore
            }
            setIsListening(false);
            return;
        }

        const SpeechRec =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRec) {
            alert('Tu navegador no soporta dictado por voz directo.');
            return;
        }

        try {
            const rec = new SpeechRec();
            rec.lang = 'es-AR';
            rec.continuous = false;
            rec.interimResults = true;
            rec.onresult = (ev: any) => {
                let text = '';
                for (let i = 0; i < ev.results.length; i++) {
                    text += ev.results[i][0].transcript;
                }
                setInput(text);
            };
            rec.onend = () => setIsListening(false);
            rec.onerror = () => setIsListening(false);
            recognitionRef.current = rec;
            rec.start();
            setIsListening(true);
        } catch {
            setIsListening(false);
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            {!isOpen && (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    title="Abrir Growy — Asistente Virtual con toda la información de Vyper Labs"
                    style={{
                        position: 'fixed',
                        bottom: 22,
                        right: 22,
                        zIndex: 9990,
                        background: '#111111',
                        color: '#FFFFFF',
                        border: '2px solid #FFFFFF',
                        borderRadius: 999,
                        padding: '0.65rem 1.15rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
                        cursor: 'pointer',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        minHeight: 'auto',
                    }}
                >
                    <span
                        style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: '#FFFFFF',
                            color: '#111111',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                        }}
                    >
                        <Bot size={16} />
                    </span>
                    <span>Growy IA</span>
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#10B981',
                        }}
                    />
                </button>
            )}

            {/* Growy Chat Window */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: isExpanded ? 16 : 20,
                        right: isExpanded ? 16 : 20,
                        width: isExpanded ? 'min(680px, calc(100vw - 32px))' : 'min(420px, calc(100vw - 32px))',
                        height: isExpanded ? 'min(760px, calc(100vh - 32px))' : 'min(590px, calc(100vh - 40px))',
                        background: '#FFFFFF',
                        border: '2px solid #111111',
                        borderRadius: 16,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                        zIndex: 9995,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '0.8rem 1rem',
                            background: '#111111',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    background: '#FFFFFF',
                                    color: '#111111',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                }}
                            >
                                <Bot size={20} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 900, fontSize: '0.925rem', lineHeight: 1.2 }}>
                                    Growy · Asistente Virtual
                                </div>
                                <div style={{ fontSize: '0.6875rem', color: '#D1D5DB', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                                    Conectado a Base de Datos y Manual Vyper
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                style={{
                                    background: 'rgba(255,255,255,0.12)',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: 6,
                                    minHeight: 'auto',
                                    boxShadow: 'none',
                                }}
                                title={isExpanded ? 'Contraer ventana' : 'Ampliar ventana'}
                            >
                                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.12)',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: 6,
                                    minHeight: 'auto',
                                    boxShadow: 'none',
                                }}
                                title="Cerrar Growy"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Prompts Strip */}
                    <div
                        style={{
                            padding: '0.5rem 0.75rem',
                            background: '#F8F9FA',
                            borderBottom: '1px solid #E5E7EB',
                            display: 'flex',
                            gap: 6,
                            overflowX: 'auto',
                        }}
                    >
                        {QUICK_PROMPTS.map((qp, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => sendPrompt(qp)}
                                disabled={loading}
                                style={{
                                    padding: '0.28rem 0.6rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    background: '#FFFFFF',
                                    color: '#111111',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: 999,
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    minHeight: 'auto',
                                    boxShadow: 'none',
                                }}
                            >
                                {qp}
                            </button>
                        ))}
                    </div>

                    {/* Messages Body */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            background: '#FFFFFF',
                        }}
                    >
                        {messages.map((m, i) => {
                            const isUser = m.role === 'user';
                            return (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: isUser ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    <div
                                        style={{
                                            maxWidth: '86%',
                                            padding: '0.7rem 0.9rem',
                                            borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                            background: isUser ? '#111111' : '#F8F9FA',
                                            color: isUser ? '#FFFFFF' : '#111111',
                                            border: isUser ? '1px solid #111111' : '1px solid #E5E7EB',
                                            fontSize: '0.825rem',
                                            lineHeight: 1.55,
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {m.content}

                                        {m.actions && m.actions.length > 0 && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 6,
                                                    marginTop: 10,
                                                    paddingTop: 8,
                                                    borderTop: '1px solid #E5E7EB',
                                                }}
                                            >
                                                {m.actions.map((act, idx) => (
                                                    <Link
                                                        key={idx}
                                                        href={act.href}
                                                        onClick={() => setIsOpen(false)}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            padding: '0.28rem 0.65rem',
                                                            borderRadius: 6,
                                                            background: '#111111',
                                                            color: '#FFFFFF',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 800,
                                                            textDecoration: 'none',
                                                        }}
                                                    >
                                                        {act.label} <ArrowUpRight size={12} />
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.625rem', color: '#9CA3AF', marginTop: 3 }}>
                                        {m.timestamp}
                                    </span>
                                </div>
                            );
                        })}

                        {loading && (
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '0.6rem 0.85rem',
                                    borderRadius: 12,
                                    background: '#F8F9FA',
                                    border: '1px solid #E5E7EB',
                                    fontSize: '0.8rem',
                                    color: '#374151',
                                    alignSelf: 'flex-start',
                                }}
                            >
                                <Loader2 size={15} className="animate-spin" /> Growy está analizando...
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    {/* Input Footer */}
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            sendPrompt(input);
                        }}
                        style={{
                            padding: '0.65rem 0.85rem',
                            borderTop: '1px solid #E5E7EB',
                            background: '#FAFAFA',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <button
                            type="button"
                            onClick={toggleVoiceDictation}
                            style={{
                                padding: '0.5rem',
                                borderRadius: 8,
                                background: isListening ? '#EF4444' : '#FFFFFF',
                                color: isListening ? '#FFFFFF' : '#111111',
                                border: '1px solid #D1D5DB',
                                minHeight: 'auto',
                                boxShadow: 'none',
                            }}
                            title="Preguntarle por voz a Growy"
                        >
                            {isListening ? <Square size={16} /> : <Mic size={16} />}
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Preguntale cualquier cosa a Growy..."
                            style={{
                                flex: 1,
                                margin: 0,
                                padding: '0.55rem 0.75rem',
                                fontSize: '0.825rem',
                                borderRadius: 8,
                                background: '#FFFFFF',
                            }}
                        />

                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            style={{
                                padding: '0.55rem 0.85rem',
                                borderRadius: 8,
                                background: '#111111',
                                color: '#FFFFFF',
                                minHeight: 'auto',
                                fontWeight: 800,
                            }}
                        >
                            <Send size={15} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
