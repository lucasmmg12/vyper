
'use client';

import { useState, useEffect } from 'react';
import { Coins, Search, TrendingUp, Edit2, Trash2, History } from 'lucide-react';
import Link from 'next/link';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

interface Client {
    id: number;
    name: string;
    phone: string;
    coin_balance: number;
}

interface CoinTransaction {
    id: number;
    client_id: number;
    client_name: string;
    amount: number;
    coins_added: number;
    date: string;
    created_at: string;
}

export default function VyperCoinsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [editingTransaction, setEditingTransaction] = useState<CoinTransaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<CoinTransaction | null>(null);

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
            const res = await fetch('/api/coin-transactions?limit=100');
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

    const coinsToAdd = Math.floor(amount / 1000);
    const newBalance = (selectedClient?.coin_balance || 0) + coinsToAdd;

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
            // 1. Update client's coin balance
            const updateRes = await fetch('/api/clients', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedClient.id,
                    coin_balance: newBalance
                })
            });

            if (!updateRes.ok) throw new Error('Error al actualizar cliente');

            // 2. Create transaction record
            const transactionRes = await fetch('/api/coin-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: selectedClient.id,
                    client_name: selectedClient.name,
                    amount,
                    coins_added: coinsToAdd
                })
            });

            if (!transactionRes.ok) throw new Error('Error al registrar transacción');

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

    const handleDeleteClick = (transaction: CoinTransaction) => {
        console.log('Delete clicked for transaction:', transaction);
        setTransactionToDelete(transaction);
    };

    const handleConfirmDelete = async () => {
        if (!transactionToDelete) return;

        console.log('Delete confirmed for:', transactionToDelete);

        try {
            // 1. Revert coins from client
            const client = clients.find(c => c.id === transactionToDelete.client_id);
            console.log('Found client:', client);

            if (client) {
                const newBalance = client.coin_balance - transactionToDelete.coins_added;
                console.log(`Updating client balance from ${client.coin_balance} to ${newBalance}`);

                const clientRes = await fetch('/api/clients', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: client.id,
                        coin_balance: newBalance
                    })
                });

                if (!clientRes.ok) {
                    const error = await clientRes.json();
                    console.error('Error updating client:', error);
                    throw new Error('Error al actualizar cliente');
                }
            }

            // 2. Delete transaction
            console.log('Deleting transaction ID:', transactionToDelete.id);
            const deleteRes = await fetch(`/api/coin-transactions?id=${transactionToDelete.id}`, {
                method: 'DELETE'
            });

            if (!deleteRes.ok) {
                const error = await deleteRes.json();
                console.error('Error deleting transaction:', error);
                throw new Error('Error al eliminar transacción');
            }

            console.log('Transaction deleted successfully');
            setTransactionToDelete(null);
            fetchClients();
            fetchTransactions();
        } catch (err: any) {
            console.error('Delete transaction error:', err);
            alert('Error al eliminar transacción: ' + (err.message || 'Error desconocido'));
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

    return (
        <div className="page-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: '#ffffff', fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Coins size={40} color="#ffffff" />
                        VYPER COINS
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Sistema de Recompensas - $1000 = 1 Coin 🪙</p>
                </div>
                <Link href="/admin" passHref>
                    <button className="secondary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem' }}>VOLVER</button>
                </Link>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                {/* Form Section */}
                <div className="glass-card">
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={24} color="#4ade80" />
                        Registrar Venta
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
                                            <p style={{ color: '#facc15', fontSize: '0.8rem' }}>
                                                {selectedClient.coin_balance} 🪙
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
                                                            {client.phone} • {client.coin_balance} 🪙
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

                            {/* Coins Preview */}
                            {amount > 0 && selectedClient && (
                                <div style={{
                                    gridColumn: 'span 4',
                                    padding: '1rem',
                                    background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.1), rgba(251, 191, 36, 0.05))',
                                    border: '2px solid #facc15',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    gap: '2rem',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>COINS A SUMAR</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#facc15' }}>+{coinsToAdd} 🪙</p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NUEVO BALANCE</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>{newBalance} 🪙</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div style={{
                                    gridColumn: 'span 4',
                                    padding: '0.75rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid #ef4444',
                                    borderRadius: '8px',
                                    color: '#ef4444',
                                    fontSize: '0.9rem'
                                }}>
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div style={{
                                    gridColumn: 'span 4',
                                    padding: '0.75rem',
                                    background: 'rgba(74, 222, 128, 0.1)',
                                    border: '1px solid #4ade80',
                                    borderRadius: '8px',
                                    color: '#4ade80',
                                    fontSize: '0.9rem'
                                }}>
                                    ✅ ¡Vyper Coins agregadas exitosamente!
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !selectedClient || amount <= 0}
                                style={{
                                    gridColumn: 'span 4',
                                    padding: '0.75rem',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    background: loading || !selectedClient || amount <= 0 ? '#333' : '#facc15',
                                    color: 'black',
                                    cursor: loading || !selectedClient || amount <= 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading ? 'PROCESANDO...' : '🪙 AGREGAR VYPER COINS'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Transactions History */}
                <div className="glass-card">
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={24} color="#a5b4fc" />
                        Historial de Transacciones ({transactions.length})
                    </h2>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '0.75rem 0.5rem' }}>FECHA</th>
                                    <th style={{ padding: '0.75rem 0.5rem' }}>CLIENTE</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>IMPORTE</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>COINS</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>ACCIONES</th>
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
                                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>
                                            {new Date(t.date || t.created_at).toLocaleDateString('es-AR')}
                                        </td>
                                        <td style={{ padding: '0.75rem 0.5rem' }}>{t.client_name}</td>
                                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                                            ${t.amount.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#facc15', fontWeight: 'bold' }}>
                                            +{t.coins_added} 🪙
                                        </td>
                                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDeleteClick(t)}
                                                className="secondary"
                                                style={{
                                                    padding: '0.4rem',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderColor: '#ef4444',
                                                    color: '#ef4444'
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {transactions.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                                No hay transacciones registradas
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Delete Modal */}
            {transactionToDelete && (
                <ConfirmDeleteModal
                    title="Eliminar Transacción"
                    message={`¿Estás seguro de eliminar esta transacción de ${transactionToDelete.client_name}? Se revertirán ${transactionToDelete.coins_added} coins del cliente.`}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setTransactionToDelete(null)}
                />
            )}
        </div>
    );
}
