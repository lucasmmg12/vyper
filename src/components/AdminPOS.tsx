'use client';

import { useState } from 'react';

export default function AdminPOS() {
    const [whatsapp, setWhatsapp] = useState('');
    const [amount, setAmount] = useState('');
    const [clientName, setClientName] = useState('');
    const [isCredit, setIsCredit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setLastResult(null);

        try {
            const res = await fetch('/api/sale', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    whatsapp,
                    amount: parseFloat(amount),
                    isCredit,
                    clientName: clientName || undefined,
                }),
            });
            const data = await res.json();
            setLastResult(data);
            if (data.success) {
                // Reset form partially
                setAmount('');
                // Keep user just in case
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="brutalist-card">
            <h2>Punto de Venta (POS)</h2>
            <form onSubmit={handleSubmit} className="grid-layout" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>

                <div>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>WHATSAPP CLIENTE</label>
                    <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="Ej: 54911..."
                        required
                    />
                </div>

                <div>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>NOMBRE (Opcional)</label>
                    <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Nuevo Cliente"
                    />
                </div>

                <div>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>MONTO TOTAL ($)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        min="0"
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '2px solid white' }}>
                    <input
                        type="checkbox"
                        checked={isCredit}
                        onChange={(e) => setIsCredit(e.target.checked)}
                        style={{ width: 'auto', transform: 'scale(1.5)' }}
                        id="credit-check"
                    />
                    <label htmlFor="credit-check" style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                        REGISTRAR EN CUENTA CORRIENTE (FIADO)
                    </label>
                </div>

                <button type="submit" disabled={loading} style={{ background: 'white', color: 'black', padding: '1.5rem', fontSize: '1.5rem' }}>
                    {loading ? 'PROCESANDO...' : 'CONFIRMAR VENTA'}
                </button>

            </form>

            {lastResult && lastResult.success && (
                <div style={{ marginTop: '2rem', border: '2px dashed white', padding: '1rem' }}>
                    <h3>VENTA REGISTRADA</h3>
                    <p>Coins Ganadas: {lastResult.earnedCoins}</p>
                    <p>Nuevo Saldo Coins: {lastResult.user.coinBalance}</p>
                    <p>Deuda Actual: ${lastResult.user.debtBalance}</p>
                </div>
            )}
        </div>
    );
}
