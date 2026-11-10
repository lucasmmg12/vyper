'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Search, TrendingUp, TrendingDown, DollarSign, History, MessageCircle, Send, Users, Loader2, CheckCircle2 } from 'lucide-react';

interface Client {
    id: number;
    name: string;
    phone: string;
    debt_balance: number;
}

interface DebtTransaction {
    id: number;
    client_id: number;
    client_name: string;
    amount: number;
    transaction_type: 'charge' | 'payment';
    balance_after: number;
    date: string;
    created_at: string;
    notes?: string;
}

export default function DebtManagementPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [transactions, setTransactions] = useState<DebtTransaction[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [transactionType, setTransactionType] = useState<'charge' | 'payment'>('charge');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Debt reminders state
    const [sendingClientId, setSendingClientId] = useState<number | null>(null);
    const [massSending, setMassSending] = useState(false);
    const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);
    const [selectedDebtorIds, setSelectedDebtorIds] = useState<number[]>([]);

    useEffect(() => {
        fetchClients();
        fetchTransactions();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/clients?limit=10000');
            const data = await res.json();
            const list: Client[] = data.clients || [];
            setClients(list);
            const activeDebtors = list.filter(c => Number(c.debt_balance) > 0 && c.phone);
            setSelectedDebtorIds(activeDebtors.map(d => d.id));
        } catch (err) {
            console.error('Error fetching clients:', err);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/debt-transactions?current_month=true');
            const data = await res.json();
            setTransactions(data.transactions || []);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        }
    };

    const debtors = clients
        .filter(c => Number(c.debt_balance) > 0)
        .sort((a, b) => Number(b.debt_balance) - Number(a.debt_balance));

    const totalPendingDebt = debtors.reduce((sum, c) => sum + Number(c.debt_balance || 0), 0);

    const handleSendSingleReminderBot = async (client: Client) => {
        if (!client.phone) {
            alert('Este cliente no tiene teléfono registrado.');
            return;
        }
        setSendingClientId(client.id);
        setReminderFeedback(null);
        try {
            const res = await fetch('/api/ai/retention-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'debt-reminder',
                    clientName: client.name,
                    balance: Number(client.debt_balance),
                    phone: client.phone,
                }),
            });
            const data = await res.json();
            if (data.sent) {
                setReminderFeedback(`✅ Recordatorio automático enviado por Bot a ${client.name}`);
            } else {
                setReminderFeedback(`⚠️ No se pudo enviar por Bot a ${client.name}. Usá el botón "Abrir WA".`);
            }
        } catch {
            setReminderFeedback(`❌ Error al enviar recordatorio a ${client.name}`);
        } finally {
            setSendingClientId(null);
        }
    };

    const handleOpenWaLink = (client: Client) => {
        const cleanPhone = (client.phone || '').replace(/\D/g, '');
        if (!cleanPhone) {
            alert('Este cliente no tiene teléfono registrado.');
            return;
        }
        const waPhone = cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`;
        const formattedBalance = `$${Number(client.debt_balance).toLocaleString('es-AR')}`;
        const msg = `👋 Hola *${client.name}*, ¿cómo estás?\n\nTe escribimos de *Vyper Suplementos* para recordarte amablemente que tu cuenta corriente registra un saldo pendiente de *${formattedBalance}* 💳.\n\nPodés abonar por transferencia o en sucursal cuando gustes. ¡Muchas gracias! 🦾`;
        window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleMassReminder = async () => {
        const targets = debtors.filter(d => selectedDebtorIds.includes(d.id) && d.phone);
        if (targets.length === 0) {
            alert('Seleccioná al menos un cliente con deuda y teléfono.');
            return;
        }
        if (!confirm(`¿Enviar recordatorio automático de saldo por WhatsApp (BuilderBot) a ${targets.length} clientes con deuda?`)) {
            return;
        }
        setMassSending(true);
        setReminderFeedback(null);
        let sentCount = 0;

        for (const client of targets) {
            try {
                const res = await fetch('/api/ai/retention-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'debt-reminder',
                        clientName: client.name,
                        balance: Number(client.debt_balance),
                        phone: client.phone,
                    }),
                });
                const data = await res.json();
                if (data.sent) sentCount++;
            } catch {
                // continue with next
            }
        }

        setMassSending(false);
        setReminderFeedback(`📢 Recordatorio masivo finalizado: ${sentCount} de ${targets.length} mensajes enviados vía BuilderBot.`);
    };

    const toggleSelectDebtor = (id: number) => {
        setSelectedDebtorIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const filteredClients = clients.filter(c => {
        const term = searchTerm.toLowerCase();
        const nameMatch = c.name?.toLowerCase().includes(term);
        const searchDigits = searchTerm.replace(/\D/g, '');
        const phoneDigits = (c.phone || '').replace(/\D/g, '');
        const phoneMatch = searchDigits.length > 0 && phoneDigits.includes(searchDigits);
        return nameMatch || phoneMatch;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) {
            setError('Debes seleccionar un cliente');
            return;
        }

        if (amount <= 0) {
            setError('El importe debe ser mayor a 0');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const res = await fetch('/api/debt-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: selectedClient.id,
                    client_name: selectedClient.name,
                    amount,
                    transaction_type: transactionType
                })
            });

            if (!res.ok) throw new Error('Error al registrar transacción');

            setSuccess(true);
            setAmount(0);
            setSelectedClient(null);
            setSearchTerm('');
            fetchClients();
            fetchTransactions();

            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleClientSelect = (client: Client) => {
        setSelectedClient(client);
        setSearchTerm('');
    };

    const today = new Date().toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Calculate new balance preview
    const currentBalance = selectedClient?.debt_balance || 0;
    const newBalance = transactionType === 'charge'
        ? currentBalance + amount
        : currentBalance - amount;

    return (
        <div className="page-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CreditCard size={28} />
                        CUENTA CORRIENTE
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Gestión de Deudas, Cobranzas y Recordatorios por WhatsApp · Total por cobrar: <strong style={{ color: '#ef4444' }}>${totalPendingDebt.toLocaleString('es-AR')}</strong>
                    </p>
                </div>

                {debtors.length > 0 && (
                    <button
                        onClick={handleMassReminder}
                        disabled={massSending || selectedDebtorIds.length === 0}
                        style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#fff',
                            border: 'none',
                            padding: '0.65rem 1.25rem',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        {massSending ? (
                            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Enviando recordatorios...</>
                        ) : (
                            <><Send size={16} /> 📢 Recordatorio Masivo a Deudores ({selectedDebtorIds.length})</>
                        )}
                    </button>
                )}
            </header>

            {reminderFeedback && (
                <div style={{
                    padding: '0.875rem 1.25rem',
                    marginBottom: '1.5rem',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid #10b981',
                    color: '#059669',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}>
                    <CheckCircle2 size={18} />
                    <span>{reminderFeedback}</span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                {/* Form Section */}
                <div className="glass-card">
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={24} color="#4ade80" />
                        Registrar Transacción
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem' }}>

                            {/* Fecha */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    FECHA
                                </label>
                                <input
                                    type="text"
                                    value={today}
                                    disabled
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', fontSize: '0.85rem' }}
                                />
                            </div>

                            {/* Cliente Selector */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    CLIENTE *
                                </label>

                                {selectedClient ? (
                                    <div style={{
                                        padding: '0.75rem',
                                        background: 'rgba(74, 222, 128, 0.1)',
                                        border: '1px solid #4ade80',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <p style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{selectedClient.name}</p>
                                            <p style={{ color: '#ef4444', fontSize: '0.8rem' }}>
                                                Deuda: ${selectedClient.debt_balance.toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedClient(null)}
                                            className="secondary"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                            <input
                                                type="text"
                                                placeholder="Buscar cliente..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{ width: '100%', paddingLeft: '2.5rem' }}
                                            />
                                        </div>

                                        {searchTerm && filteredClients.length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                zIndex: 100,
                                                marginTop: '0.5rem',
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                background: '#000',
                                                width: 'calc(50% - 1.5rem)'
                                            }}>
                                                {filteredClients.slice(0, 10).map(client => (
                                                    <div
                                                        key={client.id}
                                                        onClick={() => handleClientSelect(client)}
                                                        style={{
                                                            padding: '0.75rem',
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{client.name}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {client.phone} • Deuda: ${client.debt_balance.toLocaleString()}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Importe */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    IMPORTE ($) *
                                </label>
                                <input
                                    type="number"
                                    value={amount || ''}
                                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    required
                                    min="0"
                                    step="0.01"
                                    style={{ width: '100%', fontSize: '1rem', fontWeight: 'bold' }}
                                />
                            </div>

                            {/* Transaction Type Selector */}
                            <div style={{ gridColumn: 'span 4' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    TIPO DE TRANSACCIÓN *
                                </label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('charge')}
                                        style={{
                                            flex: 1,
                                            padding: '1rem',
                                            background: transactionType === 'charge' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                                            border: transactionType === 'charge' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            color: transactionType === 'charge' ? '#ef4444' : '#fff'
                                        }}
                                    >
                                        <TrendingUp size={20} />
                                        <span style={{ fontWeight: 'bold' }}>COMPRA EN CUENTA CORRIENTE</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('payment')}
                                        style={{
                                            flex: 1,
                                            padding: '1rem',
                                            background: transactionType === 'payment' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.05)',
                                            border: transactionType === 'payment' ? '2px solid #4ade80' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            color: transactionType === 'payment' ? '#4ade80' : '#fff'
                                        }}
                                    >
                                        <TrendingDown size={20} />
                                        <span style={{ fontWeight: 'bold' }}>PAGO</span>
                                    </button>
                                </div>
                            </div>

                            {/* Balance Preview */}
                            {amount > 0 && selectedClient && (
                                <div style={{
                                    gridColumn: 'span 4',
                                    padding: '1rem',
                                    background: transactionType === 'charge' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(74, 222, 128, 0.1)',
                                    border: `1px solid ${transactionType === 'charge' ? '#ef4444' : '#4ade80'}`,
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>BALANCE ACTUAL</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                                                ${currentBalance.toLocaleString()}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {transactionType === 'charge' ? <TrendingUp size={32} color="#ef4444" /> : <TrendingDown size={32} color="#4ade80" />}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NUEVO BALANCE</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: transactionType === 'charge' ? '#ef4444' : '#4ade80' }}>
                                                ${newBalance.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div style={{ gridColumn: 'span 4' }}>
                                <button
                                    type="submit"
                                    disabled={loading || !selectedClient || amount <= 0}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        opacity: (loading || !selectedClient || amount <= 0) ? 0.5 : 1
                                    }}
                                >
                                    {loading ? 'PROCESANDO...' : transactionType === 'charge' ? '📝 REGISTRAR COMPRA' : '💰 REGISTRAR PAGO'}
                                </button>
                            </div>

                            {/* Messages */}
                            {success && (
                                <div style={{ gridColumn: 'span 4', padding: '1rem', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid #4ade80', borderRadius: '8px', color: '#4ade80' }}>
                                    ✅ Transacción registrada correctamente. Se envió notificación al cliente.
                                </div>
                            )}
                            {error && (
                                <div style={{ gridColumn: 'span 4', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444' }}>
                                    ❌ {error}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Active Debtors & Automated WhatsApp Reminders */}
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={22} color="#ef4444" />
                            Clientes con Saldo Pendiente ({debtors.length})
                        </h2>
                        {debtors.length > 0 && (
                            <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', margin: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={selectedDebtorIds.length === debtors.length}
                                    onChange={e => setSelectedDebtorIds(e.target.checked ? debtors.map(d => d.id) : [])}
                                    style={{ width: 16, height: 16, minHeight: 'auto', margin: 0 }}
                                />
                                Seleccionar todos
                            </label>
                        )}
                    </div>

                    {debtors.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#10b981', padding: '1.5rem', fontWeight: 600 }}>
                            🎉 ¡Excelente! No hay clientes con deuda pendiente actualmente.
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                                        <th style={{ padding: '0.75rem 0.5rem', width: 36 }}></th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontSize: '0.8rem' }}>CLIENTE</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontSize: '0.8rem' }}>TELÉFONO</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontSize: '0.8rem' }}>SALDO DEUDOR</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontSize: '0.8rem' }}>ACCIONES DE COBRANZA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {debtors.map(d => (
                                        <tr key={d.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDebtorIds.includes(d.id)}
                                                    onChange={() => toggleSelectDebtor(d.id)}
                                                    style={{ width: 16, height: 16, minHeight: 'auto', margin: 0 }}
                                                />
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>{d.name}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d.phone || '—'}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 800, color: '#ef4444', fontSize: '0.95rem' }}>
                                                ${Number(d.debt_balance).toLocaleString('es-AR')}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                    <button
                                                        type="button"
                                                        className="secondary"
                                                        onClick={() => {
                                                            setSelectedClient(d);
                                                            setTransactionType('payment');
                                                            setAmount(Number(d.debt_balance));
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                                                    >
                                                        💰 Registrar Pago
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSendSingleReminderBot(d)}
                                                        disabled={sendingClientId === d.id}
                                                        style={{
                                                            padding: '0.4rem 0.75rem',
                                                            fontSize: '0.75rem',
                                                            background: '#2563eb',
                                                            color: '#fff',
                                                            border: 'none',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                        }}
                                                        title="Enviar recordatorio automático vía BuilderBot"
                                                    >
                                                        {sendingClientId === d.id ? (
                                                            <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                                                        ) : (
                                                            <><Send size={13} /> 📲 Recordatorio Bot</>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenWaLink(d)}
                                                        style={{
                                                            padding: '0.4rem 0.75rem',
                                                            fontSize: '0.75rem',
                                                            background: '#25D366',
                                                            color: '#000',
                                                            border: 'none',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                        }}
                                                        title="Abrir recordatorio en WhatsApp Web"
                                                    >
                                                        <MessageCircle size={13} /> Abrir WA
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

                {/* Transactions History */}
                <div className="glass-card">
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={24} color="#a5b4fc" />
                        Movimientos del Mes - {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase()} ({transactions.length})
                    </h2>

                    {transactions.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No hay transacciones registradas
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontSize: '0.8rem' }}>FECHA</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontSize: '0.8rem' }}>CLIENTE</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontSize: '0.8rem' }}>TIPO</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontSize: '0.8rem' }}>IMPORTE</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontSize: '0.8rem' }}>BALANCE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(t => (
                                        <tr
                                            key={t.id}
                                            style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                {new Date(t.date || t.created_at).toLocaleDateString('es-AR')}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem' }}>{t.client_name}</td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    background: t.transaction_type === 'charge' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)',
                                                    color: t.transaction_type === 'charge' ? '#ef4444' : '#4ade80'
                                                }}>
                                                    {t.transaction_type === 'charge' ? '📝 COMPRA' : '💰 PAGO'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 'bold', color: t.transaction_type === 'charge' ? '#ef4444' : '#4ade80' }}>
                                                {t.transaction_type === 'charge' ? '+' : '-'}${t.amount.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                                ${t.balance_after.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
