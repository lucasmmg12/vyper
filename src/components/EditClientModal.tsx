
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

    useEffect(() => {
        setFormData(client);
    }, [client]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
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
                                <input
                                    type="number"
                                    name="debt_balance"
                                    value={formData.debt_balance || 0}
                                    onChange={handleChange}
                                    step="0.01"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

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
            </div>
        </div>
    );
}
