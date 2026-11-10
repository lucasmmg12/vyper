'use client';

import { useState, useEffect } from 'react';
import { RefreshCcw, Search, MessageCircle, AlertCircle, Send, Sparkles, Loader2, X, Check } from 'lucide-react';
import { TierBadge } from '@/utils/tiers';

interface Client {
    id: number;
    name: string;
    phone: string;
    coin_balance: number;
    last_load_date?: string;
}

interface Sale {
    id: number;
    client_id?: number;
    amount: number;
    created_at: string;
    date?: string;
}

interface CoinTx {
    id: number;
    client_id: number;
    amount: number;
    created_at?: string;
    date?: string;
}

interface FollowUpOpportunity {
    client: Client;
    lastPurchaseDate: string;
    daysSinceLastPurchase: number;
    lastPurchaseAmount: number;
}

export default function RetentionPage() {
    const [allOpportunities, setAllOpportunities] = useState<FollowUpOpportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [windowFilter, setWindowFilter] = useState<'25-35' | '15-25' | '35+' | 'todos'>('25-35');

    // AI Modal state
    const [aiTarget, setAiTarget] = useState<FollowUpOpportunity | null>(null);
    const [aiMessage, setAiMessage] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [sendingBot, setSendingBot] = useState(false);
    const [botStatus, setBotStatus] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [clientsRes, salesRes, coinTxRes] = await Promise.all([
                fetch('/api/clients?limit=10000'),
                fetch('/api/sales?limit=10000'),
                fetch('/api/coin-transactions?limit=5000').catch(() => null),
            ]);

            const [clientsData, salesData, coinTxData] = await Promise.all([
                clientsRes.json(),
                salesRes.json(),
                coinTxRes ? coinTxRes.json() : Promise.resolve({ transactions: [] }),
            ]);

            const clients: Client[] = clientsData.clients || [];
            const sales: Sale[] = salesData.sales || [];
            const coinTxs: CoinTx[] = coinTxData.transactions || [];

            // Find last purchase for each client across sales, coin_transactions, and last_load_date
            const lastPurchases = new Map<number, { dateStr: string; amount: number }>();

            sales.forEach(sale => {
                if (!sale.client_id) return;
                const dStr = sale.date || sale.created_at;
                if (!dStr) return;
                const existing = lastPurchases.get(sale.client_id);
                if (!existing || new Date(dStr) > new Date(existing.dateStr)) {
                    lastPurchases.set(sale.client_id, { dateStr: dStr, amount: Number(sale.amount || 0) });
                }
            });

            coinTxs.forEach(tx => {
                if (!tx.client_id) return;
                const dStr = tx.date || tx.created_at;
                if (!dStr) return;
                const existing = lastPurchases.get(tx.client_id);
                if (!existing || new Date(dStr) > new Date(existing.dateStr)) {
                    lastPurchases.set(tx.client_id, { dateStr: dStr, amount: Number(tx.amount || 0) });
                }
            });

            const today = new Date();
            const ops: FollowUpOpportunity[] = [];

            clients.forEach(client => {
                if (!client || !client.phone) return;
                const txInfo = lastPurchases.get(client.id);
                const dateStr = txInfo?.dateStr || client.last_load_date;
                if (!dateStr) return;

                const saleDate = new Date(dateStr);
                if (isNaN(saleDate.getTime())) return;

                const diffTime = today.getTime() - saleDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 15) {
                    ops.push({
                        client,
                        lastPurchaseDate: dateStr,
                        lastPurchaseAmount: txInfo?.amount || (client.coin_balance > 0 ? client.coin_balance * 1000 : 25000),
                        daysSinceLastPurchase: diffDays,
                    });
                }
            });

            ops.sort((a, b) => a.daysSinceLastPurchase - b.daysSinceLastPurchase);
            setAllOpportunities(ops);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppClick = (op: FollowUpOpportunity, customText?: string) => {
        const cleanPhone = op.client.phone.replace(/\D/g, '');
        const waPhone = cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`;

        const message =
            customText ||
            `Hola ${op.client.name.split(' ')[0]} 👋 Vi que hace ${op.daysSinceLastPurchase} días hiciste tu última compra. ¿Te vas quedando sin suplementos? Avisame si te guardo algo o te lo enviamos para no cortar el progreso 🦾`;

        const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    const handleOpenAiModal = async (op: FollowUpOpportunity) => {
        setAiTarget(op);
        setBotStatus(null);
        setAiGenerating(true);
        setAiMessage('');

        try {
            const res = await fetch('/api/ai/retention-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: op.client.name,
                    daysSinceLastPurchase: op.daysSinceLastPurchase,
                    lastPurchaseAmount: op.lastPurchaseAmount,
                    coinBalance: op.client.coin_balance,
                }),
            });
            const data = await res.json();
            if (data.message) {
                setAiMessage(data.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAiGenerating(false);
        }
    };

    const handleSendViaBot = async () => {
        if (!aiTarget || !aiMessage.trim()) return;
        setSendingBot(true);
        setBotStatus(null);
        try {
            const res = await fetch('/api/ai/retention-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: aiTarget.client.name,
                    phone: aiTarget.client.phone,
                    customMessage: aiMessage,
                    sendViaBot: true,
                }),
            });
            const data = await res.json();
            if (data.sent) {
                setBotStatus('✅ ¡Mensaje enviado automáticamente por WhatsApp vía BuilderBot!');
            } else {
                setBotStatus('⚠️ No se pudo enviar por Bot (verificá credenciales BuilderBot). Podés usar "Abrir en WhatsApp".');
            }
        } catch {
            setBotStatus('❌ Error de red al intentar enviar por Bot.');
        } finally {
            setSendingBot(false);
        }
    };

    const windowedOps = allOpportunities.filter(op => {
        const d = op.daysSinceLastPurchase;
        if (windowFilter === '25-35') return d >= 25 && d <= 35;
        if (windowFilter === '15-25') return d >= 15 && d < 25;
        if (windowFilter === '35+') return d > 35;
        return true;
    });

    const filteredOps = windowedOps.filter(op => {
        const term = searchTerm.toLowerCase();
        const nameMatch = op.client.name.toLowerCase().includes(term);
        const searchDigits = searchTerm.replace(/\D/g, '');
        const phoneDigits = (op.client.phone || '').replace(/\D/g, '');
        const phoneMatch = searchDigits.length > 0 && phoneDigits.includes(searchDigits);
        return nameMatch || phoneMatch;
    });

    return (
        <div className="page-container">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <RefreshCcw size={24} /> Retención
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Motor de Recompra Inteligente (Follow-Up con IA + WhatsApp Bot)</p>
            </header>

            {/* Context Widget */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #10b981', background: 'linear-gradient(90deg, rgba(16,185,129,0.06) 0%, rgba(0,0,0,0) 100%)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.5rem' }}>
                    <AlertCircle size={20} /> Ventana de Recompra Inteligente
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Un suplemento promedio (proteína, creatina) dura 30 días. Este motor detecta a los clientes cuya última compra fue hace aproximadamente un mes y te permite redactar un mensaje personalizado con IA según su nivel de Vyper Coins.
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Oportunidades en ventana seleccionada:</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{filteredOps.length}</div>
                    </div>

                    {/* Retention Window Filter */}
                    <div className="nav-pill-container" style={{ width: 'fit-content' }}>
                        {[
                            { id: '15-25', label: '15 - 25 días' },
                            { id: '25-35', label: '🎯 25 - 35 días (Ideal)' },
                            { id: '35+', label: '+35 días inactivos' },
                            { id: 'todos', label: 'Todos (+15d)' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                className={`nav-pill-button ${windowFilter === tab.id ? 'active' : ''}`}
                                onClick={() => setWindowFilter(tab.id as any)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Message Modal */}
            {aiTarget && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.55)', zIndex: 120,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                }}>
                    <div className="glass-card animate-scaleIn" style={{ width: '100%', maxWidth: 540 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={18} color="#7c3aed" /> Mensaje IA para {aiTarget.client.name}
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                                    Última compra hace {aiTarget.daysSinceLastPurchase} días · {aiTarget.client.coin_balance} Vyper Coins
                                </p>
                            </div>
                            <button className="btn-ghost" onClick={() => setAiTarget(null)} style={{ padding: 4, minHeight: 'auto' }}>
                                <X size={18} />
                            </button>
                        </div>

                        {aiGenerating ? (
                            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
                                <p style={{ fontSize: '0.875rem' }}>Redactando mensaje personalizado con IA...</p>
                            </div>
                        ) : (
                            <>
                                <textarea
                                    rows={6}
                                    value={aiMessage}
                                    onChange={e => setAiMessage(e.target.value)}
                                    style={{ width: '100%', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: 1.5 }}
                                />

                                {botStatus && (
                                    <div style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: 10,
                                        marginBottom: '1rem',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        background: botStatus.startsWith('✅') ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                        color: botStatus.startsWith('✅') ? '#059669' : '#d97706',
                                    }}>
                                        {botStatus}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={handleSendViaBot}
                                        disabled={sendingBot || !aiMessage.trim()}
                                        style={{
                                            flex: 1,
                                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                            color: '#fff',
                                            border: 'none',
                                        }}
                                    >
                                        {sendingBot ? (
                                            <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Enviando Bot...</>
                                        ) : (
                                            <><Send size={15} /> 🤖 Enviar automático por Bot</>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleWhatsAppClick(aiTarget, aiMessage)}
                                        disabled={!aiMessage.trim()}
                                        style={{
                                            flex: 1,
                                            background: '#25D366',
                                            color: '#000',
                                            border: 'none',
                                        }}
                                    >
                                        <MessageCircle size={15} /> 📲 Abrir en WhatsApp
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* List */}
            <div className="table-container glass-card" style={{ padding: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Acciones Pendientes</h2>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem', width: '100%', margin: 0 }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Analizando base de datos...</div>
                ) : filteredOps.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <RefreshCcw size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                        <p>No hay oportunidades en este rango ({windowFilter} días).</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Probá cambiando el filtro superior a &quot;Todos (+15d)&quot; o &quot;+35 días inactivos&quot;.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>CLIENTE</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>TIEMPO TRANSCURRIDO</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>TICKET ANTERIOR</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOps.map((op, idx) => (
                                    <tr key={idx} style={{
                                        borderBottom: '1px solid var(--border-light)',
                                        transition: 'background 0.2s',
                                        cursor: 'default'
                                    }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {op.client.name}
                                                <TierBadge coins={op.client.coin_balance} size="sm" />
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                {op.client.phone}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{
                                                color: op.daysSinceLastPurchase >= 30 ? '#ef4444' : '#f59e0b',
                                                fontWeight: 800,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem'
                                            }}>
                                                <AlertCircle size={14} />
                                                Hace {op.daysSinceLastPurchase} días
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                Últ. registro: {new Date(op.lastPurchaseDate).toLocaleDateString('es-AR')}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                                            ${op.lastPurchaseAmount.toLocaleString('es-AR')}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleOpenAiModal(op)}
                                                    className="secondary"
                                                    style={{
                                                        padding: '0.55rem 1rem',
                                                        borderRadius: '50px',
                                                        fontWeight: 700,
                                                        fontSize: '0.8rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        borderColor: '#7c3aed',
                                                        color: '#7c3aed',
                                                    }}
                                                >
                                                    <Sparkles size={14} />
                                                    ✨ Redactar con IA
                                                </button>
                                                <button
                                                    onClick={() => handleWhatsAppClick(op)}
                                                    style={{
                                                        background: '#25D366',
                                                        color: '#000',
                                                        border: 'none',
                                                        padding: '0.55rem 1.1rem',
                                                        borderRadius: '50px',
                                                        fontWeight: 700,
                                                        fontSize: '0.8rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <MessageCircle size={15} />
                                                    WhatsApp
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
