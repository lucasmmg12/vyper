
'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Search, TrendingUp, TrendingDown, DollarSign, History } from 'lucide-react';
import Link from 'next/link';

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

    useEffect(() => {
        fetchClients();
        fetchTransactions();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/clients?limit=10000');
            const data = await res.json();
            setClients(data.clients || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
        }
    };

    const fetchTransactions = async () => {
        try {
            // Obtener todas las transacciones del mes actual
            const res = await fetch('/api/debt-transactions?current_month=true');
            const data = await res.json();
            setTransactions(data.transactions || []);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

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
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: '#ffffff', fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <CreditCard size={40} color="#ffffff" />
                        CUENTA CORRIENTE
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Gestión de Deudas y Pagos</p>
                </div>
                <Link href="/admin" passHref>
                    <button className="secondary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem' }}>VOLVER</button>
                </Link>
            </header>

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
