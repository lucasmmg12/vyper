
'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';

interface Client {
    id: number;
    name: string;
    phone: string;
    coin_balance: number;
    debt_balance: number;
    observations?: string;
    client_id?: string;
    last_load_date?: string;
    user_password?: string;
    user_view?: boolean;
    user_photo?: string;
    user_profile?: string;
    user_status?: boolean;
    image_url?: string;
}

interface EditClientModalProps {
    client: Client;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditClientModal({ client, onClose, onSuccess }: EditClientModalProps) {
    const [formData, setFormData] = useState<Client>(client);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Transaction State
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [transactionType, setTransactionType] = useState<'payment' | 'charge'>('payment');
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionNotes, setTransactionNotes] = useState('');
    const [transactionBranch, setTransactionBranch] = useState('Rawson');
    const [transactionLoading, setTransactionLoading] = useState(false);

    // History State
    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`/api/debt-transactions?client_id=${client.id}&limit=50`);
            const data = await res.json();
            setHistory(data.transactions || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        setFormData(client);
        fetchHistory();
    }, [client]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0
                : type === 'checkbox' ? checked
                    : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/clients', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                setError(data.error || 'Error al actualizar');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };



    const handleDelete = async () => {
        console.log('Delete button clicked for client:', client.name);

        if (!confirm(`¿Estás seguro de eliminar a ${client.name}?`)) {
            console.log('Delete cancelled by user');
            return;
        }

        console.log('Attempting to delete client ID:', client.id);
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/clients?id=${client.id}`, {
                method: 'DELETE'
            });

            console.log('Delete response status:', res.status);

            if (res.ok) {
                console.log('Client deleted successfully');
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                console.error('Delete error:', data);
                setError(data.error || 'Error al eliminar');
            }
        } catch (err) {
            console.error('Delete exception:', err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleTransactionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTransactionLoading(true);

        try {
            const res = await fetch('/api/debt-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: client.id,
                    client_name: client.name,
                    amount: parseFloat(transactionAmount),
                    transaction_type: transactionType,
                    notes: transactionNotes,
                    branch: transactionBranch
                })
            });

            if (res.ok) {
                const data = await res.json();
                // Update local state with new balance
                setFormData(prev => ({ ...prev, debt_balance: data.newBalance }));
                setShowTransactionForm(false);
                setTransactionAmount('');
                setTransactionNotes('');
                fetchHistory(); // Refresh history
                // Optionally trigger parent update
                // onSuccess(); // Maybe don't close the modal yet, just refresh data? 
            } else {
                alert('Error al registrar transacción');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setTransactionLoading(false);
        }
    };


    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
        }}>
            <div style={{
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                background: '#000',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    position: 'sticky',
                    top: 0,
                    background: '#000',
                    padding: '1rem 0',
                    zIndex: 10
                }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Editar Cliente</h2>
                    <button
                        onClick={onClose}
                        className="secondary"
                        style={{ padding: '0.5rem', width: '40px', height: '40px' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* Nombre */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Nombre completo *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Teléfono / WhatsApp *
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleChange}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Vyper Coins y Deuda */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#facc15' }}>
                                    Vyper Coins 🪙
                                </label>
                                <input
                                    type="number"
                                    name="coin_balance"
                                    value={formData.coin_balance || 0}
                                    onChange={handleChange}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ef4444' }}>
                                    Deuda ($)
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        name="debt_balance"
                                        value={formData.debt_balance || 0}
                                        onChange={handleChange}
                                        step="0.01"
                                        style={{ width: '100%' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowTransactionForm(!showTransactionForm)}
                                        style={{
                                            padding: '0 0.75rem',
                                            fontSize: '1.2rem',
                                            background: '#333',
                                            color: '#fff',
                                            border: '1px solid #444'
                                        }}
                                        title="Gestionar Deuda"
                                    >
                                        💳
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Form Overlay */}
                        {showTransactionForm && (
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(20, 20, 20, 0.95)',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                marginBottom: '1rem'
                            }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#fff' }}>Registrar Movimiento de Cuenta</h4>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('payment')}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            background: transactionType === 'payment' ? '#4ade80' : 'rgba(74, 222, 128, 0.1)',
                                            color: transactionType === 'payment' ? '#000' : '#4ade80',
                                            border: '1px solid #4ade80'
                                        }}
                                    >
                                        Registrar Pago (Baja Deuda)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('charge')}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            background: transactionType === 'charge' ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                                            color: transactionType === 'charge' ? '#fff' : '#ef4444',
                                            border: '1px solid #ef4444'
                                        }}
                                    >
                                        Nueva Deuda (Sube Deuda)
                                    </button>
                                </div>

                                <select
                                    value={transactionBranch}
                                    onChange={e => setTransactionBranch(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #333', color: '#fff' }}
                                >
                                    <option value="Rawson">Sucursal Rawson</option>
                                    <option value="Rivadavia">Sucursal Rivadavia</option>
                                </select>

                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        placeholder="Monto"
                                        value={transactionAmount}
                                        onChange={e => setTransactionAmount(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #333' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Notas / Concepto"
                                        value={transactionNotes}
                                        onChange={e => setTransactionNotes(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid #333' }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={handleTransactionSubmit}
                                            disabled={transactionLoading || !transactionAmount}
                                            style={{ flex: 1, background: '#fff', color: '#000', padding: '0.5rem' }}
                                        >
                                            {transactionLoading ? 'Procesando...' : 'Confirmar Transacción'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowTransactionForm(false)}
                                            style={{ background: '#333', color: '#fff', padding: '0.5rem' }}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Observaciones */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                Observaciones
                            </label>
                            <textarea
                                name="observations"
                                value={formData.observations || ''}
                                onChange={handleChange}
                                rows={3}
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>

                        {/* Additional Fields Section */}
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#a5b4fc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                Datos del Sistema
                            </h4>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Client ID
                                    </label>
                                    <input
                                        type="text"
                                        name="client_id"
                                        value={formData.client_id || ''}
                                        onChange={handleChange}
                                        style={{ width: '100%', fontSize: '0.85rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Perfil de Usuario
                                    </label>
                                    <select
                                        name="user_profile"
                                        value={formData.user_profile || 'CLIENT'}
                                        onChange={handleChange}
                                        style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
                                    >
                                        <option value="CLIENT">Cliente</option>
                                        <option value="ADMIN">Administrador</option>
                                        <option value="STAFF">Staff</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Contraseña
                                </label>
                                <input
                                    type="text"
                                    name="user_password"
                                    value={formData.user_password || ''}
                                    onChange={handleChange}
                                    style={{ width: '100%', fontSize: '0.85rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="user_status"
                                        checked={formData.user_status ?? true}
                                        onChange={handleChange}
                                    />
                                    Usuario Activo
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        name="user_view"
                                        checked={formData.user_view ?? true}
                                        onChange={handleChange}
                                    />
                                    Visible
                                </label>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Foto Usuario URL
                                    </label>
                                    <input
                                        type="text"
                                        name="user_photo"
                                        value={formData.user_photo || ''}
                                        onChange={handleChange}
                                        style={{ width: '100%', fontSize: '0.85rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Imagen URL
                                    </label>
                                    <input
                                        type="text"
                                        name="image_url"
                                        value={formData.image_url || ''}
                                        onChange={handleChange}
                                        style={{ width: '100%', fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* History Section */}
                        {history.length > 0 && (
                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#fff' }}>
                                    Historial de Movimientos
                                </h4>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', position: 'sticky', top: 0 }}>
                                                <th style={{ padding: '0.5rem' }}>Fecha</th>
                                                <th style={{ padding: '0.5rem' }}>Tipo</th>
                                                <th style={{ padding: '0.5rem' }}>Nota</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Monto</th>
                                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map(h => (
                                                <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '0.5rem' }}>{new Date(h.date || h.created_at).toLocaleDateString()}</td>
                                                    <td style={{ padding: '0.5rem' }}>
                                                        <span style={{
                                                            padding: '0.2rem 0.4rem',
                                                            borderRadius: '4px',
                                                            background: h.transaction_type === 'payment' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                            color: h.transaction_type === 'payment' ? '#4ade80' : '#ef4444'
                                                        }}>
                                                            {h.transaction_type === 'payment' ? 'Pago' : 'Cargo'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{h.notes || '-'}</td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>${h.amount.toLocaleString()}</td>
                                                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>${(h.balance_after ?? 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid #ef4444',
                                borderRadius: '8px',
                                color: '#ef4444'
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Botones */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    background: '#4ade80',
                                    color: 'black',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Save size={18} />
                                {loading ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="secondary"
                                style={{
                                    width: '50px',
                                    padding: 0,
                                    borderColor: '#ef4444',
                                    color: '#ef4444'
                                }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </form>
            </div >
        </div >
    );
}
