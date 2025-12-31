
'use client';

import { useState } from 'react';

export default function SalesForm({ onSuccess }: { onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        branch: 'Rawson',
        amount: '',
        observations: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetch('/api/sales', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            setFormData({ ...formData, amount: '', observations: '' });
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontWeight: 600 }}>
                Nueva venta
            </h3>
            <form onSubmit={handleSubmit}>
                <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                        <label>Fecha</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div>
                        <label>Sucursal</label>
                        <select
                            value={formData.branch}
                            onChange={e => setFormData({ ...formData, branch: e.target.value })}
                        >
                            <option value="Rawson" style={{ color: 'black' }}>Rawson</option>
                            <option value="Rivadavia" style={{ color: 'black' }}>Rivadavia</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label>Importe total ($)</label>
                    <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                    />
                </div>

                <div>
                    <label>Observaciones</label>
                    <textarea
                        rows={3}
                        placeholder="Detalle de medios de pago (Efectivo, MP, etc.)"
                        value={formData.observations}
                        onChange={e => setFormData({ ...formData, observations: e.target.value })}
                    />
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Guardando...' : 'Registrar venta'}
                </button>
            </form>
        </div>
    );
}
