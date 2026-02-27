
'use client';

import { useState } from 'react';

const INITIAL_FORM = {
    name: '',
    phone: '',
    coin_balance: 0,
    debt_balance: 0,
    observations: ''
};

export default function NewClientForm({ onSuccess }: { onSuccess: () => void }) {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            alert('Nombre y Teléfono son obligatorios');
            return;
        }

        setLoading(true);

        let formattedPhone = formData.phone.trim().replace(/[\s-]/g, '');
        if (!formattedPhone.startsWith('+549')) {
            if (formattedPhone.startsWith('+54') && !formattedPhone.startsWith('+549')) {
                formattedPhone = '+549' + formattedPhone.slice(3);
            } else if (formattedPhone.startsWith('549')) {
                formattedPhone = '+' + formattedPhone;
            } else {
                formattedPhone = '+549' + formattedPhone;
            }
        }

        const dataToSubmit = { ...formData, phone: formattedPhone };

        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSubmit)
            });

            if (res.ok) {
                setFormData(INITIAL_FORM);
                onSuccess();
            } else {
                alert('Error al crear cliente');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', fontWeight: 600 }}>
                Nuevo cliente
            </h3>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nombre completo *</label>
                    <input
                        type="text"
                        required
                        placeholder="Ej: Juan Pérez"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.25rem' }}>
                        <span>Teléfono / WhatsApp *</span>
                        <span style={{ fontSize: '0.75rem', color: '#00D1FF' }}>
                            ⚠️ Ingrese solo el número local (sin +549). Ej: 2645438114
                        </span>
                    </label>
                    <input
                        type="tel"
                        required
                        placeholder="2645438114"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                        <label>Vyper Coins</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.coin_balance}
                            onChange={e => setFormData({ ...formData, coin_balance: parseFloat(e.target.value) || 0 })}
                        />
                    </div>

                    <div>
                        <label>Deuda ($)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.debt_balance}
                            onChange={e => setFormData({ ...formData, debt_balance: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                <div>
                    <label>Observaciones</label>
                    <textarea
                        rows={3}
                        placeholder="Notas adicionales..."
                        value={formData.observations}
                        onChange={e => setFormData({ ...formData, observations: e.target.value })}
                    />
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
                    {loading ? 'Guardando...' : 'Crear cliente'}
                </button>
            </form>
        </div>
    );
}
