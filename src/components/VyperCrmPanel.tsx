'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    MessageSquare,
    Search,
    Plus,
    Send,
    Phone,
    User,
    X,
    Smile,
    Image as ImageIcon,
    Paperclip,
    Zap,
    Copy,
    CheckCheck,
    Check,
    RefreshCw,
    Download,
    FileText,
    DollarSign,
    Coins,
    CreditCard,
    ShoppingBag,
    Clock,
    Lock,
    Sparkles,
    Trash2,
    Loader2,
    Volume2,
    ExternalLink,
    Webhook,
    Play,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getTier } from '@/utils/tiers';

const EMOJI_LIST = [
    '😀', '😂', '😊', '😎', '🤩', '🥳', '💪', '🦾', '🔥', '⚡',
    '👍', '👏', '🙌', '🤝', '❤️', '✅', '❌', '⚠️', '🛒', '📦',
    '🪙', '💸', '💳', '🏆', '🎯', '🚀', '👋', '🙏', '💯', '🎉',
];

interface CrmClient {
    id: number;
    name: string;
    phone?: string;
    coin_balance: number;
    debt_balance: number;
}

interface CrmPedido {
    id: string;
    numero_pedido: number;
    cliente_nombre: string;
    estado: 'pendiente' | 'procesando' | 'completado' | 'cancelado';
    total: number;
    created_at: string;
}

interface CrmConversation {
    phone: string;
    lastMessage: string;
    lastDate: string;
    direction: 'incoming' | 'outgoing';
    senderName: string;
    unreadCount: number;
    lastIncomingDate: string | null;
    window24hOpen: boolean;
    client: CrmClient | null;
    activePedido: CrmPedido | null;
}

interface CrmMessage {
    id: number;
    phone: string;
    direction: 'incoming' | 'outgoing';
    content: string;
    media_url?: string | null;
    media_type?: string;
    sender_name?: string | null;
    is_read?: boolean;
    created_at: string;
}

interface CrmShortcut {
    id: string;
    shortcut: string;
    label: string;
    message: string;
    category: string;
}

function formatChatDateDivider(dateVal: string) {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Hoy';
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTimeShort(dateVal: string) {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
        return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

export default function VyperCrmPanel() {
    const [conversations, setConversations] = useState<CrmConversation[]>([]);
    const [totalUnread, setTotalUnread] = useState(0);
    const [shortcuts, setShortcuts] = useState<CrmShortcut[]>([]);
    const [botStatus, setBotStatus] = useState<any>({ online: true, status: 'ready' });
    const [loading, setLoading] = useState(true);

    // Selected Conversation & Chat state
    const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
    const [messages, setMessages] = useState<CrmMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [activeClient, setActiveClient] = useState<CrmClient | null>(null);
    const [activePedidos, setActivePedidos] = useState<CrmPedido[]>([]);

    // Composer state
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [quickFilter, setQuickFilter] = useState<
        'all' | 'unread' | 'window24h' | 'con_deuda' | 'con_pedido' | 'vip'
    >('all');

    // Modals & Drawers
    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatPhone, setNewChatPhone] = useState('');
    const [newChatName, setNewChatName] = useState('');

    const [showShortcutsPopup, setShowShortcutsPopup] = useState(false);
    const [shortcutFilter, setShortcutFilter] = useState('');
    const [showShortcutManager, setShowShortcutManager] = useState(false);
    const [newShortcutCmd, setNewShortcutCmd] = useState('');
    const [newShortcutLabel, setNewShortcutLabel] = useState('');
    const [newShortcutMsg, setNewShortcutMsg] = useState('');

    // Meta Template Picker modal inside CRM
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [tplName, setTplName] = useState('vyper_notificacion_general');
    const [tplLang, setTplLang] = useState('es_AR');
    const [tplVar1, setTplVar1] = useState('');
    const [tplVar2, setTplVar2] = useState('');
    const [tplVar3, setTplVar3] = useState('');
    const [tplVar4, setTplVar4] = useState('');
    const [sendingTemplate, setSendingTemplate] = useState(false);

    // Right 360° Client Sidebar Actions
    const [showClientSidebar, setShowClientSidebar] = useState(true);
    const [editingClientName, setEditingClientName] = useState('');
    const [quickActionType, setQuickActionType] = useState<'sale' | 'debt_charge' | 'debt_pay' | 'coins' | null>(null);
    const [quickAmount, setQuickAmount] = useState('');
    const [quickActionLoading, setQuickActionLoading] = useState(false);

    // Lightbox & Webhook copy
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [copiedWebhook, setCopiedWebhook] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 60);
    };

    const fetchCrmList = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch('/api/crm');
            const data = await res.json();
            if (data.conversations) {
                setConversations(data.conversations);
                setTotalUnread(data.totalUnread || 0);
            }
            if (data.shortcuts) setShortcuts(data.shortcuts);
            if (data.botStatus) setBotStatus(data.botStatus);
        } catch (e) {
            console.error('Error fetching CRM list:', e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const fetchConversationDetail = async (phone: string, silent = false) => {
        if (!silent) setMessagesLoading(true);
        try {
            const res = await fetch(`/api/crm?phone=${encodeURIComponent(phone)}`);
            const data = await res.json();
            setMessages(data.messages || []);
            setActiveClient(data.client || null);
            setActivePedidos(data.pedidos || []);
            setEditingClientName(data.client?.name || '');
            // Clear unread badge locally
            setConversations(prev =>
                prev.map(c => (c.phone === phone ? { ...c, unreadCount: 0 } : c))
            );
            if (!silent) scrollToBottom();
        } catch (e) {
            console.error('Error fetching conversation detail:', e);
        } finally {
            if (!silent) setMessagesLoading(false);
        }
    };

    useEffect(() => {
        fetchCrmList();
        const interval = setInterval(() => {
            fetchCrmList(true);
            if (selectedPhone) fetchConversationDetail(selectedPhone, true);
        }, 8000);
        return () => clearInterval(interval);
    }, [selectedPhone]);

    // Realtime subscription to whatsapp_messages
    useEffect(() => {
        const channel = supabase
            .channel('vyper_crm_realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
                payload => {
                    const newMsg = payload.new as CrmMessage;
                    fetchCrmList(true);
                    if (selectedPhone && newMsg.phone === selectedPhone) {
                        setMessages(prev => {
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                        scrollToBottom();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedPhone]);

    const selectedConv = useMemo(
        () => conversations.find(c => c.phone === selectedPhone) || null,
        [conversations, selectedPhone]
    );

    const handleSelectConversation = (phone: string) => {
        setSelectedPhone(phone);
        fetchConversationDetail(phone);
    };

    // Detect "/" shortcut trigger in composer
    const handleTextChange = (val: string) => {
        setMessageText(val);
        if (val.startsWith('/')) {
            setShowShortcutsPopup(true);
            setShortcutFilter(val.toLowerCase());
        } else {
            setShowShortcutsPopup(false);
        }
    };

    const filteredShortcuts = useMemo(() => {
        if (!shortcutFilter) return shortcuts;
        return shortcuts.filter(
            s =>
                s.shortcut.toLowerCase().includes(shortcutFilter) ||
                s.label.toLowerCase().includes(shortcutFilter)
        );
    }, [shortcuts, shortcutFilter]);

    const applyShortcut = (sc: CrmShortcut) => {
        const clientName = activeClient?.name || selectedConv?.senderName || 'Cliente';
        const firstName = clientName.split(' ')[0];
        const personalized = sc.message.replace(/\{nombre\}/gi, firstName);
        setMessageText(personalized);
        setShowShortcutsPopup(false);
    };

    // Send direct message (POST /api/v2/{id}/messages)
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedPhone || !messageText.trim() || sending) return;

        const textToSend = messageText.trim();
        setSending(true);
        setMessageText('');
        setShowEmoji(false);

        try {
            const res = await fetch('/api/crm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_message',
                    phone: selectedPhone,
                    content: textToSend,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                alert(`No se pudo enviar el mensaje directo: ${data.error || 'Verificá si la ventana de 24h está abierta o enviá una Plantilla Meta.'}`);
                setMessageText(textToSend);
            } else {
                await fetchConversationDetail(selectedPhone, true);
                fetchCrmList(true);
                scrollToBottom();
            }
        } catch (err: any) {
            alert(`Error enviando mensaje: ${err?.message}`);
            setMessageText(textToSend);
        } finally {
            setSending(false);
        }
    };

    // Upload & Send Media Attachment
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedPhone) return;

        setUploadingMedia(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await fetch('/api/ecommerce/upload', {
                method: 'POST',
                body: formData,
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok || !uploadData.url) {
                throw new Error(uploadData.error || 'Error subiendo archivo');
            }

            const sendRes = await fetch('/api/crm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_message',
                    phone: selectedPhone,
                    content: messageText.trim() || file.name,
                    mediaUrl: uploadData.url,
                }),
            });
            const sendData = await sendRes.json();
            if (!sendRes.ok || !sendData.ok) {
                throw new Error(sendData.error || 'Error enviando adjunto por WhatsApp');
            }

            setMessageText('');
            await fetchConversationDetail(selectedPhone, true);
            fetchCrmList(true);
            scrollToBottom();
        } catch (err: any) {
            alert(err?.message || 'Error enviando archivo');
        } finally {
            setUploadingMedia(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Open Meta Template Modal with auto-populated Vyper variables
    const openTemplatePicker = (presetType: 'general' | 'deuda' | 'coins' | 'pedido' = 'general') => {
        const name = activeClient?.name || selectedConv?.senderName || 'Cliente';
        const firstName = name.split(' ')[0];
        const coins = activeClient?.coin_balance || 0;
        const debt = activeClient?.debt_balance || 0;
        const tier = getTier(coins);
        const pedido = activePedidos[0];

        setTplName('vyper_notificacion_general');
        setTplLang('es_AR');
        setTplVar1(firstName);

        if (presetType === 'deuda' || (presetType === 'general' && debt > 0)) {
            setTplVar2(`Estado de Cuenta Corriente ($${debt.toLocaleString('es-AR')})`);
            setTplVar3(`Te recordamos amablemente que tu cuenta registra un saldo pendiente de $${debt.toLocaleString('es-AR')}.`);
            setTplVar4('Podés abonar por transferencia (Alias: VYPER.SUPLEMENTOS) o en sucursal. ¡Muchas gracias!');
        } else if (presetType === 'pedido' || (presetType === 'general' && pedido)) {
            const num = String(pedido?.numero_pedido || 1).padStart(4, '0');
            setTplVar2(`Actualización de tu Pedido #${num}`);
            setTplVar3(`Tu pedido por $${Number(pedido?.total || 0).toLocaleString('es-AR')} se encuentra en estado: ${(pedido?.estado || 'en preparación').toUpperCase()}.`);
            setTplVar4('Respondé este mensaje si querés coordinar el retiro o envío a domicilio.');
        } else {
            setTplVar2('Novedades y Beneficios Vyper Suplementos');
            setTplVar3(
                coins > 0
                    ? `Contás con ${coins} Vyper Coins disponibles (Nivel ${tier.name}) para canjear en tu próxima compra.`
                    : 'Tenemos stock renovado y promociones vigentes en suplementos nacionales e importados.'
            );
            setTplVar4('Respondé este mensaje y te asesoramos en el acto.');
        }

        setShowTemplateModal(true);
    };

    const handleSendTemplateFromCrm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPhone) return;
        setSendingTemplate(true);
        try {
            const res = await fetch('/api/crm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_template',
                    phone: selectedPhone,
                    templateName: tplName,
                    languageCode: tplLang,
                    parameters: [tplVar1, tplVar2, tplVar3, tplVar4],
                }),
            });
            const data = await res.json();
            setShowTemplateModal(false);
            await fetchConversationDetail(selectedPhone, true);
            fetchCrmList(true);
            scrollToBottom();
            if (!res.ok || !data.ok) {
                alert(
                    `La plantilla se registró en el historial del chat, pero Meta devolvió: ${
                        data.error || 'Aún en revisión (PENDING)'
                    }`
                );
            }
        } catch (err: any) {
            alert(`Error enviando plantilla: ${err?.message}`);
        } finally {
            setSendingTemplate(false);
        }
    };

    // Start new conversation
    const handleStartNewChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChatPhone.trim()) return;
        const digits = newChatPhone.replace(/\D/g, '');
        const norm = digits.startsWith('549') ? digits : digits.startsWith('54') ? `549${digits.slice(2)}` : `549${digits}`;

        if (newChatName.trim()) {
            await fetch('/api/crm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upsert_client',
                    phone: norm,
                    name: newChatName.trim(),
                }),
            });
        }

        setShowNewChat(false);
        setNewChatPhone('');
        setNewChatName('');
        await fetchCrmList(true);
        handleSelectConversation(norm);
    };

    // Quick ERP Action from 360° Client Sidebar
    const handleExecuteQuickErpAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPhone || !quickActionType || !quickAmount) return;
        const amountNum = Number(quickAmount);
        if (isNaN(amountNum) || amountNum <= 0) return;

        setQuickActionLoading(true);
        try {
            let clientId = activeClient?.id;
            const cName = activeClient?.name || editingClientName || selectedConv?.senderName || 'Cliente WhatsApp';

            // Ensure client exists in `users`
            if (!clientId) {
                const upRes = await fetch('/api/crm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'upsert_client',
                        phone: selectedPhone,
                        name: cName,
                    }),
                });
                const upData = await upRes.json();
                clientId = upData.client?.id;
            }

            if (quickActionType === 'sale') {
                await fetch('/api/sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: amountNum,
                        branch: 'Rivadavia',
                        client_id: clientId,
                        payment_method: 'Efectivo / WhatsApp',
                    }),
                });
                // Also add Vyper Coins (1 coin per $1000)
                if (clientId) {
                    const coinsToAdd = Math.max(1, Math.floor(amountNum / 1000));
                    await fetch('/api/coin-transactions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: clientId,
                            amount: amountNum,
                            coinsAdded: coinsToAdd,
                        }),
                    });
                }
            } else if (quickActionType === 'debt_charge' || quickActionType === 'debt_pay') {
                if (clientId) {
                    await fetch('/api/debt-transactions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: clientId,
                            amount: amountNum,
                            transactionType: quickActionType === 'debt_charge' ? 'charge' : 'payment',
                            notes: 'Cargado desde CRM WhatsApp',
                        }),
                    });
                }
            } else if (quickActionType === 'coins') {
                if (clientId) {
                    await fetch('/api/coin-transactions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: clientId,
                            amount: amountNum * 1000,
                            coinsAdded: amountNum,
                        }),
                    });
                }
            }

            setQuickActionType(null);
            setQuickAmount('');
            await fetchConversationDetail(selectedPhone, true);
            fetchCrmList(true);
        } catch (err) {
            console.error(err);
            alert('Error ejecutando acción rápida');
        } finally {
            setQuickActionLoading(false);
        }
    };

    // Save Shortcut
    const handleSaveShortcut = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newShortcutCmd || !newShortcutLabel || !newShortcutMsg) return;
        await fetch('/api/crm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save_shortcut',
                shortcut: newShortcutCmd,
                label: newShortcutLabel,
                message: newShortcutMsg,
            }),
        });
        setNewShortcutCmd('');
        setNewShortcutLabel('');
        setNewShortcutMsg('');
        fetchCrmList(true);
    };

    const handleSimulateIncoming = async () => {
        const res = await fetch('/api/crm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'simulate_incoming',
                phone: selectedPhone || '5492646796509',
                name: activeClient?.name || 'Lucas (Prueba Webhook)',
                body: '¡Hola Vyper! Quería consultar si tienen stock de Creatina Star Nutrition y Whey de Vainilla 💪',
            }),
        });
        const data = await res.json();
        await fetchCrmList(true);
        if (data.message?.phone) {
            handleSelectConversation(data.message.phone);
        }
    };

    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            if (quickFilter === 'unread' && c.unreadCount === 0) return false;
            if (quickFilter === 'window24h' && !c.window24hOpen) return false;
            if (quickFilter === 'con_deuda' && (!c.client || c.client.debt_balance <= 0)) return false;
            if (quickFilter === 'con_pedido' && !c.activePedido) return false;
            if (quickFilter === 'vip' && (!c.client || c.client.coin_balance < 100)) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            const nameMatch = (c.client?.name || c.senderName || '').toLowerCase().includes(q);
            const phoneMatch = c.phone.includes(q.replace(/\D/g, ''));
            const msgMatch = (c.lastMessage || '').toLowerCase().includes(q);
            return nameMatch || phoneMatch || msgMatch;
        });
    }, [conversations, quickFilter, searchQuery]);

    const webhookUrl = `${
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ophbmcprxcnpkpndusbe.supabase.co'
    }/functions/v1/whatsapp-webhook`;

    return (
        <div
            style={{
                background: '#FFFFFF',
                border: '2px solid #111111',
                borderRadius: 16,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 190px)',
                minHeight: 640,
                boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            }}
        >
            {/* ═══════════ TOP HEADER BAR (Webhook + Line Status + Actions) ═══════════ */}
            <div
                style={{
                    padding: '0.75rem 1.25rem',
                    background: '#111111',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquare size={18} />
                        <span style={{ fontWeight: 900, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                            CRM WHATSAPP · CONTACT CENTER VYPER
                        </span>
                    </div>

                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.2rem 0.65rem',
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.12)',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                        }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: botStatus?.online !== false ? '#10B981' : '#F59E0B',
                            }}
                        />
                        Línea Meta API: {botStatus?.status === 'require_action' ? 'Requiere Acción' : 'Activa'}
                    </span>

                    {totalUnread > 0 && (
                        <span
                            style={{
                                background: '#FFFFFF',
                                color: '#111111',
                                padding: '0.15rem 0.55rem',
                                borderRadius: 999,
                                fontSize: '0.725rem',
                                fontWeight: 800,
                            }}
                        >
                            {totalUnread} sin leer
                        </span>
                    )}
                </div>

                {/* Webhook URL Copy + Quick Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => {
                            navigator.clipboard.writeText(webhookUrl);
                            setCopiedWebhook(true);
                            setTimeout(() => setCopiedWebhook(false), 2500);
                        }}
                        title="Copiar URL del Webhook para pegar en BuilderBot → Webhooks"
                        style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: 'rgba(255,255,255,0.12)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            minHeight: 'auto',
                            boxShadow: 'none',
                        }}
                    >
                        {copiedWebhook ? <Check size={13} /> : <Webhook size={13} />}{' '}
                        {copiedWebhook ? '¡Webhook Copiado!' : 'Copiar URL Webhook'}
                    </button>

                    <button
                        type="button"
                        onClick={handleSimulateIncoming}
                        title="Simular la llegada de un mensaje por Webhook para probar el CRM"
                        style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: 'rgba(255,255,255,0.12)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            minHeight: 'auto',
                            boxShadow: 'none',
                        }}
                    >
                        <Play size={13} /> Simular Entrada
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowShortcutManager(true)}
                        style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: 'rgba(255,255,255,0.12)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            minHeight: 'auto',
                            boxShadow: 'none',
                        }}
                    >
                        <Zap size={13} /> Atajos (/)
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowNewChat(true)}
                        style={{
                            padding: '0.35rem 0.85rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background: '#FFFFFF',
                            color: '#111111',
                            border: '1px solid #FFFFFF',
                            borderRadius: 8,
                            cursor: 'pointer',
                            minHeight: 'auto',
                            boxShadow: 'none',
                        }}
                    >
                        <Plus size={14} /> Nuevo Chat
                    </button>
                </div>
            </div>

            {/* ═══════════ MAIN 3-COLUMN CRM WORKSPACE ═══════════ */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {/* ─── LEFT COLUMN: CONVERSATION LIST ─── */}
                <div
                    style={{
                        width: 340,
                        flexShrink: 0,
                        borderRight: '1px solid #E5E7EB',
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#FAFAFA',
                    }}
                >
                    {/* Search & Filter Pills */}
                    <div style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}>
                        <div style={{ position: 'relative', marginBottom: '0.6rem' }}>
                            <Search
                                size={15}
                                style={{ position: 'absolute', left: 10, top: 11, color: '#6B7280' }}
                            />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, teléfono o texto..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    paddingLeft: '2.1rem',
                                    paddingRight: '0.75rem',
                                    paddingTop: '0.5rem',
                                    paddingBottom: '0.5rem',
                                    fontSize: '0.8125rem',
                                    marginBottom: 0,
                                    borderRadius: 8,
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: 2 }}>
                            {[
                                { id: 'all', label: 'Todos' },
                                { id: 'unread', label: 'No leídos' },
                                { id: 'window24h', label: '24h Activa' },
                                { id: 'con_deuda', label: 'Con Deuda' },
                                { id: 'con_pedido', label: 'Con Pedido' },
                                { id: 'vip', label: 'VIP Coins' },
                            ].map(f => {
                                const active = quickFilter === f.id;
                                return (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setQuickFilter(f.id as any)}
                                        style={{
                                            padding: '0.25rem 0.55rem',
                                            fontSize: '0.6875rem',
                                            fontWeight: 700,
                                            borderRadius: 999,
                                            background: active ? '#111111' : '#F3F4F6',
                                            color: active ? '#FFFFFF' : '#374151',
                                            border: 'none',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            minHeight: 'auto',
                                            boxShadow: 'none',
                                            textTransform: 'none',
                                        }}
                                    >
                                        {f.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Conversations Scroll Area */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>
                                Cargando conversaciones...
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: '#6B7280' }}>
                                <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.35 }} />
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111111', marginBottom: 4 }}>
                                    Sin conversaciones aún
                                </div>
                                <p style={{ fontSize: '0.775rem', marginBottom: '1rem' }}>
                                    Pegá la URL del Webhook en BuilderBot o presioná &ldquo;Simular Entrada&rdquo; arriba para probar.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleSimulateIncoming}
                                    style={{
                                        padding: '0.45rem 0.9rem',
                                        fontSize: '0.75rem',
                                        background: '#111111',
                                        color: '#FFFFFF',
                                        minHeight: 'auto',
                                    }}
                                >
                                    <Play size={13} /> Crear Conversación de Prueba
                                </button>
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const isSelected = conv.phone === selectedPhone;
                                const displayName =
                                    conv.client?.name || conv.senderName || `+${conv.phone}`;
                                const initials = displayName
                                    .replace(/[^a-zA-Z0-9]/g, '')
                                    .slice(0, 2)
                                    .toUpperCase() || 'VP';

                                return (
                                    <div
                                        key={conv.phone}
                                        onClick={() => handleSelectConversation(conv.phone)}
                                        style={{
                                            padding: '0.85rem 0.9rem',
                                            borderBottom: '1px solid #E5E7EB',
                                            background: isSelected
                                                ? '#F3F4F6'
                                                : conv.unreadCount > 0
                                                ? '#FFFFFF'
                                                : '#FAFAFA',
                                            borderLeft: isSelected
                                                ? '4px solid #111111'
                                                : '4px solid transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            gap: '0.75rem',
                                            alignItems: 'flex-start',
                                            transition: 'background 0.15s',
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                background: isSelected ? '#111111' : '#E5E7EB',
                                                color: isSelected ? '#FFFFFF' : '#111111',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                fontSize: '0.8rem',
                                                flexShrink: 0,
                                                position: 'relative',
                                            }}
                                        >
                                            {initials}
                                            {conv.window24hOpen && (
                                                <span
                                                    title="Ventana de 24h abierta (respuesta libre sin cargo)"
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        right: 0,
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: '50%',
                                                        background: '#10B981',
                                                        border: '2px solid #FFFFFF',
                                                    }}
                                                />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'baseline',
                                                    marginBottom: 2,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: conv.unreadCount > 0 ? 800 : 700,
                                                        fontSize: '0.85rem',
                                                        color: '#111111',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {displayName}
                                                </span>
                                                <span style={{ fontSize: '0.6875rem', color: '#6B7280', flexShrink: 0 }}>
                                                    {formatTimeShort(conv.lastDate)}
                                                </span>
                                            </div>

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}
                                            >
                                                <p
                                                    style={{
                                                        fontSize: '0.775rem',
                                                        color: conv.unreadCount > 0 ? '#111111' : '#6B7280',
                                                        fontWeight: conv.unreadCount > 0 ? 700 : 400,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        margin: 0,
                                                    }}
                                                >
                                                    {conv.direction === 'outgoing' ? '✓✓ ' : ''}
                                                    {conv.lastMessage}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <span
                                                        style={{
                                                            background: '#111111',
                                                            color: '#FFFFFF',
                                                            borderRadius: 999,
                                                            padding: '0.1rem 0.45rem',
                                                            fontSize: '0.675rem',
                                                            fontWeight: 800,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Vyper Context Mini-Badges */}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: 4,
                                                    flexWrap: 'wrap',
                                                    marginTop: 5,
                                                }}
                                            >
                                                {conv.client && conv.client.coin_balance > 0 && (
                                                    <span
                                                        style={{
                                                            fontSize: '0.65rem',
                                                            fontWeight: 700,
                                                            padding: '0.1rem 0.4rem',
                                                            borderRadius: 4,
                                                            background: '#F3F4F6',
                                                            color: '#111111',
                                                            border: '1px solid #E5E7EB',
                                                        }}
                                                    >
                                                        🪙 {conv.client.coin_balance} Coins
                                                    </span>
                                                )}
                                                {conv.client && conv.client.debt_balance > 0 && (
                                                    <span
                                                        style={{
                                                            fontSize: '0.65rem',
                                                            fontWeight: 700,
                                                            padding: '0.1rem 0.4rem',
                                                            borderRadius: 4,
                                                            background: '#FEF2F2',
                                                            color: '#991B1B',
                                                            border: '1px solid #FECACA',
                                                        }}
                                                    >
                                                        💳 Deuda ${conv.client.debt_balance.toLocaleString('es-AR')}
                                                    </span>
                                                )}
                                                {conv.activePedido && (
                                                    <span
                                                        style={{
                                                            fontSize: '0.65rem',
                                                            fontWeight: 700,
                                                            padding: '0.1rem 0.4rem',
                                                            borderRadius: 4,
                                                            background: '#EFF6FF',
                                                            color: '#1E40AF',
                                                            border: '1px solid #BFDBFE',
                                                        }}
                                                    >
                                                        📦 #{String(conv.activePedido.numero_pedido).padStart(4, '0')} ({conv.activePedido.estado})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ─── CENTER COLUMN: CHAT CONSOLE ─── */}
                {!selectedPhone ? (
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#F8F9FA',
                            padding: '2rem',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                                background: '#111111',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1rem',
                            }}
                        >
                            <MessageSquare size={30} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.35rem' }}>
                            Seleccioná una conversación
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#6B7280', maxWidth: 420, marginBottom: '1.25rem' }}>
                            Recibí mensajes en tiempo real desde WhatsApp Business (Meta API), respondé con atajos <code>/</code>, enviá plantillas aprobadas y gestioná ventas, cuenta corriente y pedidos sin salir del chat.
                        </p>
                        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={() => setShowNewChat(true)}
                                style={{ background: '#111111', color: '#FFFFFF', fontSize: '0.8125rem' }}
                            >
                                <Plus size={15} /> Iniciar Nuevo Chat
                            </button>
                            <button
                                type="button"
                                onClick={handleSimulateIncoming}
                                className="secondary"
                                style={{ borderColor: '#111111', color: '#111111', fontSize: '0.8125rem' }}
                            >
                                <Play size={15} /> Simular Mensaje Entrante
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#F8F9FA' }}>
                        {/* Chat Header */}
                        <div
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: '#FFFFFF',
                                borderBottom: '1px solid #E5E7EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '1rem',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: '50%',
                                        background: '#111111',
                                        color: '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    {(activeClient?.name || selectedConv?.senderName || 'VP')
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111111' }}>
                                        {activeClient?.name || selectedConv?.senderName || `+${selectedPhone}`}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>📱 +{selectedPhone}</span>
                                        {selectedConv?.window24hOpen ? (
                                            <span style={{ color: '#059669', fontWeight: 700 }}>
                                                ● Ventana 24h abierta (Chat libre activo)
                                            </span>
                                        ) : (
                                            <span style={{ color: '#D97706', fontWeight: 700 }}>
                                                🔒 Fuera de ventana 24h (Recomendado: Plantilla Meta)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => openTemplatePicker('general')}
                                    className="secondary"
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        fontSize: '0.75rem',
                                        minHeight: 'auto',
                                        borderColor: '#111111',
                                        color: '#111111',
                                        fontWeight: 700,
                                    }}
                                >
                                    <Sparkles size={14} /> Enviar Plantilla Meta
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowClientSidebar(!showClientSidebar)}
                                    className="secondary"
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        fontSize: '0.75rem',
                                        minHeight: 'auto',
                                        background: showClientSidebar ? '#111111' : '#FFFFFF',
                                        color: showClientSidebar ? '#FFFFFF' : '#111111',
                                        borderColor: '#111111',
                                        fontWeight: 700,
                                    }}
                                >
                                    <User size={14} /> Ficha 360°
                                </button>
                            </div>
                        </div>

                        {/* Messages Scroll Container */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.6rem',
                            }}
                        >
                            {messagesLoading ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                                    Cargando historial de mensajes...
                                </div>
                            ) : messages.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6B7280' }}>
                                    <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                                        No hay mensajes previos con este número.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => openTemplatePicker('general')}
                                        style={{ background: '#111111', color: '#FFFFFF', fontSize: '0.8rem' }}
                                    >
                                        <Sparkles size={14} /> Iniciar conversación con Plantilla Meta
                                    </button>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isOut = msg.direction === 'outgoing';
                                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                                    const showDateDivider =
                                        !prevMsg ||
                                        new Date(prevMsg.created_at).toDateString() !==
                                            new Date(msg.created_at).toDateString();

                                    return (
                                        <React.Fragment key={msg.id || idx}>
                                            {showDateDivider && (
                                                <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                                                    <span
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '0.2rem 0.75rem',
                                                            borderRadius: 999,
                                                            background: '#E5E7EB',
                                                            color: '#374151',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {formatChatDateDivider(msg.created_at)}
                                                    </span>
                                                </div>
                                            )}

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: isOut ? 'flex-end' : 'flex-start',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        maxWidth: '72%',
                                                        padding: '0.65rem 0.9rem',
                                                        borderRadius: isOut
                                                            ? '14px 14px 2px 14px'
                                                            : '14px 14px 14px 2px',
                                                        background: isOut ? '#111111' : '#FFFFFF',
                                                        color: isOut ? '#FFFFFF' : '#111111',
                                                        border: isOut ? '1px solid #111111' : '1px solid #E5E7EB',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                                    }}
                                                >
                                                    {/* Sender label */}
                                                    {msg.sender_name && (
                                                        <div
                                                            style={{
                                                                fontSize: '0.675rem',
                                                                fontWeight: 700,
                                                                opacity: 0.7,
                                                                marginBottom: 3,
                                                            }}
                                                        >
                                                            {msg.sender_name}
                                                        </div>
                                                    )}

                                                    {/* Media Rendering */}
                                                    {msg.media_url && msg.media_type === 'image' && (
                                                        <div style={{ marginBottom: 6 }}>
                                                            <img
                                                                src={msg.media_url}
                                                                alt="Adjunto"
                                                                onClick={() => setLightboxUrl(msg.media_url!)}
                                                                style={{
                                                                    maxWidth: '100%',
                                                                    maxHeight: 240,
                                                                    borderRadius: 8,
                                                                    cursor: 'pointer',
                                                                    objectFit: 'cover',
                                                                }}
                                                            />
                                                        </div>
                                                    )}

                                                    {msg.media_url && msg.media_type === 'audio' && (
                                                        <div style={{ marginBottom: 6, minWidth: 220 }}>
                                                            <audio
                                                                controls
                                                                src={msg.media_url}
                                                                style={{ width: '100%', height: 36 }}
                                                            />
                                                        </div>
                                                    )}

                                                    {msg.media_url &&
                                                        msg.media_type !== 'image' &&
                                                        msg.media_type !== 'audio' && (
                                                            <a
                                                                href={msg.media_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 6,
                                                                    padding: '0.45rem 0.65rem',
                                                                    borderRadius: 8,
                                                                    background: isOut
                                                                        ? 'rgba(255,255,255,0.12)'
                                                                        : '#F3F4F6',
                                                                    color: 'inherit',
                                                                    fontSize: '0.775rem',
                                                                    fontWeight: 700,
                                                                    marginBottom: 6,
                                                                    textDecoration: 'none',
                                                                }}
                                                            >
                                                                <FileText size={15} /> Abrir archivo adjunto
                                                                <ExternalLink size={13} />
                                                            </a>
                                                        )}

                                                    {/* Message Text */}
                                                    {msg.content && (
                                                        <div
                                                            style={{
                                                                fontSize: '0.875rem',
                                                                lineHeight: 1.5,
                                                                whiteSpace: 'pre-wrap',
                                                                wordBreak: 'break-word',
                                                            }}
                                                        >
                                                            {msg.content}
                                                        </div>
                                                    )}

                                                    {/* Timestamp & Checkmarks */}
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'flex-end',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            marginTop: 4,
                                                            fontSize: '0.65rem',
                                                            opacity: 0.7,
                                                        }}
                                                    >
                                                        <span>
                                                            {new Date(msg.created_at).toLocaleTimeString('es-AR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                        {isOut && <CheckCheck size={12} />}
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ─── COMPOSER BAR (With "/" Shortcuts, Emojis, Attachments & Meta Template) ─── */}
                        <div
                            style={{
                                position: 'relative',
                                background: '#FFFFFF',
                                borderTop: '1px solid #E5E7EB',
                                padding: '0.75rem 1rem',
                            }}
                        >
                            {/* "/" Shortcuts Floating Menu */}
                            {showShortcutsPopup && filteredShortcuts.length > 0 && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '1rem',
                                        right: '1rem',
                                        marginBottom: 6,
                                        background: '#FFFFFF',
                                        border: '2px solid #111111',
                                        borderRadius: 12,
                                        boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                                        maxHeight: 220,
                                        overflowY: 'auto',
                                        zIndex: 50,
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '0.4rem 0.75rem',
                                            background: '#111111',
                                            color: '#FFFFFF',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        ⚡ Respuestas Rápidas Vyper (Clic para insertar)
                                    </div>
                                    {filteredShortcuts.map(sc => (
                                        <div
                                            key={sc.id}
                                            onClick={() => applyShortcut(sc)}
                                            style={{
                                                padding: '0.6rem 0.85rem',
                                                borderBottom: '1px solid #F3F4F6',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '1rem',
                                            }}
                                        >
                                            <div>
                                                <code style={{ fontWeight: 800, color: '#111111', marginRight: 8 }}>
                                                    {sc.shortcut}
                                                </code>
                                                <strong style={{ fontSize: '0.8125rem' }}>{sc.label}</strong>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: '#6B7280',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: 280,
                                                }}
                                            >
                                                {sc.message}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Emoji Picker Popover */}
                            {showEmoji && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '1rem',
                                        marginBottom: 6,
                                        background: '#FFFFFF',
                                        border: '1px solid #111111',
                                        borderRadius: 12,
                                        padding: '0.65rem',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(10, 1fr)',
                                        gap: 4,
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                                        zIndex: 50,
                                    }}
                                >
                                    {EMOJI_LIST.map(em => (
                                        <button
                                            key={em}
                                            type="button"
                                            onClick={() => setMessageText(prev => prev + em)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                fontSize: '1.15rem',
                                                cursor: 'pointer',
                                                padding: 4,
                                                minHeight: 'auto',
                                                boxShadow: 'none',
                                            }}
                                        >
                                            {em}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <form
                                onSubmit={handleSendMessage}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,audio/*,.pdf,.xlsx,.xls,.doc,.docx"
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowEmoji(!showEmoji)}
                                    className="btn-ghost"
                                    style={{ padding: '0.5rem', minHeight: 'auto' }}
                                    title="Emojis"
                                >
                                    <Smile size={19} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingMedia}
                                    className="btn-ghost"
                                    style={{ padding: '0.5rem', minHeight: 'auto' }}
                                    title="Adjuntar imagen, audio o PDF"
                                >
                                    {uploadingMedia ? (
                                        <Loader2 size={19} className="animate-spin" />
                                    ) : (
                                        <Paperclip size={19} />
                                    )}
                                </button>

                                <input
                                    type="text"
                                    value={messageText}
                                    onChange={e => handleTextChange(e.target.value)}
                                    placeholder='Escribí un mensaje o "/" para respuestas rápidas (/mayorista, /transferencia, /listo)...'
                                    style={{
                                        flex: 1,
                                        marginBottom: 0,
                                        padding: '0.65rem 0.9rem',
                                        borderRadius: 10,
                                        fontSize: '0.875rem',
                                    }}
                                />

                                <button
                                    type="submit"
                                    disabled={sending || !messageText.trim()}
                                    style={{
                                        background: '#111111',
                                        color: '#FFFFFF',
                                        padding: '0.65rem 1.15rem',
                                        borderRadius: 10,
                                        minHeight: 'auto',
                                        fontWeight: 800,
                                    }}
                                >
                                    {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ─── RIGHT COLUMN: FICHA 360° DEL CLIENTE VYPER ─── */}
                {selectedPhone && showClientSidebar && (
                    <div
                        style={{
                            width: 300,
                            flexShrink: 0,
                            borderLeft: '1px solid #E5E7EB',
                            background: '#FFFFFF',
                            padding: '1rem',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: '#6B7280',
                                    marginBottom: 6,
                                }}
                            >
                                FICHA 360° CLIENTE VYPER
                            </div>

                            {/* Editable Client Name / Link to DB */}
                            <div style={{ display: 'flex', gap: 6 }}>
                                <input
                                    type="text"
                                    value={editingClientName}
                                    onChange={e => setEditingClientName(e.target.value)}
                                    placeholder="Nombre del cliente..."
                                    style={{
                                        marginBottom: 0,
                                        padding: '0.45rem 0.65rem',
                                        fontSize: '0.8125rem',
                                        fontWeight: 700,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!editingClientName.trim()) return;
                                        await fetch('/api/crm', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                action: 'upsert_client',
                                                phone: selectedPhone,
                                                name: editingClientName.trim(),
                                            }),
                                        });
                                        await fetchConversationDetail(selectedPhone, true);
                                        fetchCrmList(true);
                                    }}
                                    style={{
                                        padding: '0.45rem 0.7rem',
                                        fontSize: '0.75rem',
                                        background: '#111111',
                                        color: '#FFFFFF',
                                        minHeight: 'auto',
                                    }}
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>

                        {/* Balance Cards (Coins & Cuenta Corriente) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: 10,
                                    background: '#F8F9FA',
                                    border: '1px solid #E5E7EB',
                                }}
                            >
                                <div style={{ fontSize: '0.675rem', color: '#6B7280', fontWeight: 700 }}>
                                    VYPER COINS
                                </div>
                                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#111111' }}>
                                    🪙 {activeClient?.coin_balance || 0}
                                </div>
                                <div style={{ fontSize: '0.675rem', fontWeight: 700, color: '#374151' }}>
                                    Nivel {getTier(activeClient?.coin_balance || 0).name}
                                </div>
                            </div>

                            <div
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: 10,
                                    background:
                                        (activeClient?.debt_balance || 0) > 0 ? '#FEF2F2' : '#F8F9FA',
                                    border:
                                        (activeClient?.debt_balance || 0) > 0
                                            ? '1px solid #FECACA'
                                            : '1px solid #E5E7EB',
                                }}
                            >
                                <div style={{ fontSize: '0.675rem', color: '#6B7280', fontWeight: 700 }}>
                                    CTA. CORRIENTE
                                </div>
                                <div
                                    style={{
                                        fontSize: '1.1rem',
                                        fontWeight: 900,
                                        color:
                                            (activeClient?.debt_balance || 0) > 0 ? '#991B1B' : '#111111',
                                    }}
                                >
                                    ${Number(activeClient?.debt_balance || 0).toLocaleString('es-AR')}
                                </div>
                                <div style={{ fontSize: '0.675rem', color: '#6B7280' }}>
                                    {(activeClient?.debt_balance || 0) > 0 ? 'Saldo deudor' : 'Al día'}
                                </div>
                            </div>
                        </div>

                        {/* Quick Operational Actions right from Chat */}
                        <div>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: '#6B7280',
                                    marginBottom: 6,
                                }}
                            >
                                ACCIONES OPERATIVAS RÁPIDAS
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                <button
                                    type="button"
                                    onClick={() => setQuickActionType('sale')}
                                    className="secondary"
                                    style={{
                                        padding: '0.45rem',
                                        fontSize: '0.725rem',
                                        minHeight: 'auto',
                                        fontWeight: 700,
                                        borderColor: '#111111',
                                        color: '#111111',
                                    }}
                                >
                                    💰 + Venta
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuickActionType('debt_charge')}
                                    className="secondary"
                                    style={{
                                        padding: '0.45rem',
                                        fontSize: '0.725rem',
                                        minHeight: 'auto',
                                        fontWeight: 700,
                                        borderColor: '#111111',
                                        color: '#111111',
                                    }}
                                >
                                    💳 + Fiado
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuickActionType('debt_pay')}
                                    className="secondary"
                                    style={{
                                        padding: '0.45rem',
                                        fontSize: '0.725rem',
                                        minHeight: 'auto',
                                        fontWeight: 700,
                                        borderColor: '#111111',
                                        color: '#111111',
                                    }}
                                >
                                    ✅ Cobrar Cta.
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuickActionType('coins')}
                                    className="secondary"
                                    style={{
                                        padding: '0.45rem',
                                        fontSize: '0.725rem',
                                        minHeight: 'auto',
                                        fontWeight: 700,
                                        borderColor: '#111111',
                                        color: '#111111',
                                    }}
                                >
                                    🪙 + Coins
                                </button>
                            </div>

                            {quickActionType && (
                                <form
                                    onSubmit={handleExecuteQuickErpAction}
                                    style={{
                                        marginTop: 8,
                                        padding: '0.75rem',
                                        background: '#F8F9FA',
                                        border: '1px solid #111111',
                                        borderRadius: 10,
                                    }}
                                >
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: 6 }}>
                                        {quickActionType === 'sale' && '💰 Registrar Venta ($) + Coins'}
                                        {quickActionType === 'debt_charge' && '💳 Cargar Compra en Cta. Cte. ($)'}
                                        {quickActionType === 'debt_pay' && '✅ Registrar Pago de Deuda ($)'}
                                        {quickActionType === 'coins' && '🪙 Cantidad de Vyper Coins a sumar'}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <input
                                            type="number"
                                            value={quickAmount}
                                            onChange={e => setQuickAmount(e.target.value)}
                                            placeholder="Monto..."
                                            autoFocus
                                            style={{ marginBottom: 0, padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={quickActionLoading}
                                            style={{
                                                padding: '0.4rem 0.7rem',
                                                fontSize: '0.75rem',
                                                background: '#111111',
                                                color: '#FFFFFF',
                                                minHeight: 'auto',
                                            }}
                                        >
                                            {quickActionLoading ? '...' : 'OK'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickActionType(null)}
                                            className="btn-ghost"
                                            style={{ padding: '0.4rem', minHeight: 'auto' }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Active Web Orders for this Client */}
                        <div>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: '#6B7280',
                                    marginBottom: 6,
                                }}
                            >
                                PEDIDOS WEB RECIENTES ({activePedidos.length})
                            </div>
                            {activePedidos.length === 0 ? (
                                <div style={{ fontSize: '0.775rem', color: '#6B7280' }}>
                                    Sin pedidos online registrados con este teléfono.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {activePedidos.map(ped => (
                                        <div
                                            key={ped.id}
                                            style={{
                                                padding: '0.65rem',
                                                borderRadius: 8,
                                                border: '1px solid #E5E7EB',
                                                background: '#F8F9FA',
                                                fontSize: '0.775rem',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontWeight: 800,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                <span>#{String(ped.numero_pedido).padStart(4, '0')}</span>
                                                <span>${Number(ped.total).toLocaleString('es-AR')}</span>
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: '0.675rem',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        padding: '0.1rem 0.4rem',
                                                        borderRadius: 4,
                                                        background: '#111111',
                                                        color: '#FFFFFF',
                                                    }}
                                                >
                                                    {ped.estado}
                                                </span>
                                                <a
                                                    href={`/pedido/${ped.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: '0.7rem', fontWeight: 700, textDecoration: 'underline' }}
                                                >
                                                    Ver Tracking ↗
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════ MODAL: SEND META TEMPLATE WITH AUTO-VARIABLES ═══════════ */}
            {showTemplateModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                    onClick={() => setShowTemplateModal(false)}
                >
                    <div
                        style={{
                            background: '#FFFFFF',
                            border: '2px solid #111111',
                            borderRadius: 16,
                            maxWidth: 540,
                            width: '100%',
                            padding: '1.5rem',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>
                                📋 Enviar Plantilla Meta (<code>{tplName}</code>)
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowTemplateModal(false)}
                                className="btn-ghost"
                                style={{ padding: 4, minHeight: 'auto' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Quick Presets */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => openTemplatePicker('general')}
                                className="secondary"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.725rem', minHeight: 'auto' }}
                            >
                                🪙 Preset Fidelización
                            </button>
                            <button
                                type="button"
                                onClick={() => openTemplatePicker('deuda')}
                                className="secondary"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.725rem', minHeight: 'auto' }}
                            >
                                💳 Preset Saldo Cta. Cte.
                            </button>
                            <button
                                type="button"
                                onClick={() => openTemplatePicker('pedido')}
                                className="secondary"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.725rem', minHeight: 'auto' }}
                            >
                                📦 Preset Estado Pedido
                            </button>
                        </div>

                        <form onSubmit={handleSendTemplateFromCrm}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Variable &#123;&#123;1&#125;&#125; — Nombre del Cliente</label>
                                    <input value={tplVar1} onChange={e => setTplVar1(e.target.value)} style={{ marginBottom: 0 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Variable &#123;&#123;2&#125;&#125; — Motivo</label>
                                    <input value={tplVar2} onChange={e => setTplVar2(e.target.value)} style={{ marginBottom: 0 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Variable &#123;&#123;3&#125;&#125; — Detalle</label>
                                    <input value={tplVar3} onChange={e => setTplVar3(e.target.value)} style={{ marginBottom: 0 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Variable &#123;&#123;4&#125;&#125; — Nota / Cierre</label>
                                    <input value={tplVar4} onChange={e => setTplVar4(e.target.value)} style={{ marginBottom: 0 }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowTemplateModal(false)}
                                    className="secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingTemplate}
                                    style={{ background: '#111111', color: '#FFFFFF' }}
                                >
                                    {sendingTemplate ? 'Enviando...' : 'Enviar Plantilla Oficial'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════ MODAL: NEW CHAT ═══════════ */}
            {showNewChat && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                    onClick={() => setShowNewChat(false)}
                >
                    <div
                        style={{
                            background: '#FFFFFF',
                            border: '2px solid #111111',
                            borderRadius: 16,
                            maxWidth: 420,
                            width: '100%',
                            padding: '1.5rem',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '1rem' }}>
                            Iniciar Nueva Conversación
                        </h3>
                        <form onSubmit={handleStartNewChat}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Teléfono (ej: 2646796509)</label>
                                <input
                                    value={newChatPhone}
                                    onChange={e => setNewChatPhone(e.target.value)}
                                    placeholder="264..."
                                    autoFocus
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Nombre del Cliente (opcional)</label>
                                <input
                                    value={newChatName}
                                    onChange={e => setNewChatName(e.target.value)}
                                    placeholder="Ej: Gimnasio Atlas / Juan Pérez"
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button type="button" onClick={() => setShowNewChat(false)} className="secondary">
                                    Cancelar
                                </button>
                                <button type="submit" style={{ background: '#111111', color: '#FFFFFF' }}>
                                    Abrir Chat
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════ MODAL: SHORTCUTS MANAGER (/) ═══════════ */}
            {showShortcutManager && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                    onClick={() => setShowShortcutManager(false)}
                >
                    <div
                        style={{
                            background: '#FFFFFF',
                            border: '2px solid #111111',
                            borderRadius: 16,
                            maxWidth: 620,
                            width: '100%',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            padding: '1.5rem',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>
                                ⚡ Gestor de Atajos Rápidos (<code>/</code>)
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowShortcutManager(false)}
                                className="btn-ghost"
                                style={{ padding: 4, minHeight: 'auto' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveShortcut} style={{ marginBottom: '1.25rem', padding: '1rem', background: '#F8F9FA', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                    value={newShortcutCmd}
                                    onChange={e => setNewShortcutCmd(e.target.value)}
                                    placeholder="/comando (ej: /precios)"
                                    style={{ marginBottom: 0 }}
                                />
                                <input
                                    value={newShortcutLabel}
                                    onChange={e => setNewShortcutLabel(e.target.value)}
                                    placeholder="Título del atajo"
                                    style={{ marginBottom: 0 }}
                                />
                            </div>
                            <textarea
                                value={newShortcutMsg}
                                onChange={e => setNewShortcutMsg(e.target.value)}
                                placeholder="Texto completo del mensaje..."
                                rows={3}
                                style={{ marginBottom: '0.5rem' }}
                            />
                            <button type="submit" style={{ background: '#111111', color: '#FFFFFF', fontSize: '0.8rem', minHeight: 'auto', padding: '0.45rem 1rem' }}>
                                <Plus size={14} /> Guardar Atajo
                            </button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {shortcuts.map(sc => (
                                <div
                                    key={sc.id}
                                    style={{
                                        padding: '0.75rem',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: 8,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                    }}
                                >
                                    <div>
                                        <div>
                                            <code style={{ fontWeight: 800, marginRight: 8 }}>{sc.shortcut}</code>
                                            <strong style={{ fontSize: '0.85rem' }}>{sc.label}</strong>
                                        </div>
                                        <div style={{ fontSize: '0.775rem', color: '#4B5563', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                                            {sc.message}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await fetch('/api/crm', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ action: 'delete_shortcut', id: sc.id }),
                                            });
                                            fetchCrmList(true);
                                        }}
                                        className="btn-ghost"
                                        style={{ color: '#EF4444', padding: 4, minHeight: 'auto' }}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════ LIGHTBOX MODAL FOR IMAGES ═══════════ */}
            {lightboxUrl && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                    }}
                    onClick={() => setLightboxUrl(null)}
                >
                    <img
                        src={lightboxUrl}
                        alt="Vista ampliada"
                        style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: 12 }}
                    />
                </div>
            )}
        </div>
    );
}
