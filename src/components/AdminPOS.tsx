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
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem' }}>WHATSAPP CLIENTE</label>
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
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="Ej: 2645438114"
                        required
                    />
                    {whatsapp.trim() && (
                        <p style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.35rem', fontFamily: 'monospace' }}>
                            ✅ Se guardará como: <strong>{
                                (() => {
                                    let p = whatsapp.trim().replace(/[\s-]/g, '');
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
