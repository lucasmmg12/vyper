
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
                    </label>
                    <div style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        fontSize: '0.78rem',
                        color: '#111111',
                        lineHeight: 1.4
                    }}>
                        📱 Ingresá solo el número local <strong>sin el +549</strong>.
                        <br />
                        Ejemplo: <strong style={{ fontFamily: 'monospace' }}>2645438114</strong> → se guarda como <strong style={{ fontFamily: 'monospace' }}>+5492645438114</strong>
                    </div>
                    <input
                        type="tel"
                        required
                        placeholder="2645438114"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                    {formData.phone.trim() && (
                        <p style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.35rem', fontFamily: 'monospace' }}>
                            ✅ Se guardará como: <strong>{
                                (() => {
                                    let p = formData.phone.trim().replace(/[\s-]/g, '');
                                    if (!p.startsWith('+549')) {
                                        if (p.startsWith('+54') && !p.startsWith('+549')) p = '+549' + p.slice(3);
                                        else if (p.startsWith('549')) p = '+' + p;
                                        else p = '+549' + p;
                                    }
                                    return p;
                                })()
                            }</strong>
                        </p>
                    )}
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
