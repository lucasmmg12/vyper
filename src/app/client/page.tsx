'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ClientPage() {
    const [whatsapp, setWhatsapp] = useState('');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [view, setView] = useState<'WALLET' | 'MARKET'>('WALLET');

    const fetchUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/user?whatsapp=${whatsapp}`);
            const data = await res.json();

            if (res.ok && data.user) {
                setUser(data.user);
                setError('');
            } else {
                // Handle 404 or other errors
                setError('USUARIO NO ENCONTRADO. EL ADMIN DEBE REGISTRARTE (HACER UNA VENTA).');
                setUser(null);
            }
        } catch (err) {
            console.error(err);
            setError('ERROR DE CONEXIÓN. INTENTA MÁS TARDE.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>VYPER CLIENT ACCESS</h1>
                <form onSubmit={fetchUser}>
                    <input
                        type="text"
                        placeholder="INGRESA TU WHATSAPP"
                        value={whatsapp}
                        onChange={e => setWhatsapp(e.target.value)}
                        style={{ marginBottom: '1rem', textAlign: 'center' }}
                    />
                    {error && (
                        <div style={{
                            color: 'white',
                            background: 'red',
                            padding: '1rem',
                            marginBottom: '1rem',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}
                    <button type="submit" style={{ width: '100%', padding: '1.5rem' }}>
                        {loading ? 'BUSCANDO...' : 'INGRESAR'}
                    </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <Link href="/" style={{ color: 'white', textDecoration: 'underline' }}>VOLVER</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid white', paddingBottom: '1rem' }}>
                <h2>HOLA, {user.name}</h2>
                <button onClick={() => setUser(null)} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>SALIR</button>
            </header>

            <div className="grid-layout" style={{ gap: '1rem', padding: 0 }}>
                <div className="brutalist-card">
                    <h3>SALDO VYPER COINS</h3>
                    <div className="big-stat">{user.coinBalance}</div>
                </div>

                {user.debtBalance > 0 && (
                    <div className="brutalist-card" style={{ borderStyle: 'dashed' }}>
                        <h3>TU DEUDA</h3>
                        <div className="big-stat" style={{ fontSize: '3rem' }}>${user.debtBalance}</div>
                    </div>
                )}
            </div>

            <nav style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => setView('WALLET')}
                    style={{ flex: 1, background: view === 'WALLET' ? 'white' : 'black', color: view === 'WALLET' ? 'black' : 'white', border: '2px solid white' }}
                >
                    BILLETERA
                </button>
                <button
                    onClick={() => setView('MARKET')}
                    style={{ flex: 1, background: view === 'MARKET' ? 'white' : 'black', color: view === 'MARKET' ? 'black' : 'white', border: '2px solid white' }}
                >
                    MARKETPLACE
                </button>
            </nav>

            {view === 'WALLET' && (
                <div className="brutalist-card">
                    <h3>ÚLTIMOS MOVIMIENTOS</h3>
                    {user.transactions.map((t: any) => (
                        <div key={t.id} style={{ borderBottom: '1px solid #333', padding: '1rem 0', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{t.type}</div>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {t.amountCoins > 0 && <div style={{ color: 'white' }}>+{t.amountCoins} Coins</div>}
                                {t.amountFiat > 0 && <div style={{ color: 'white' }}>${t.amountFiat}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {view === 'MARKET' && (
                <div className="grid-layout" style={{ padding: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    {/* Mock Rewards */}
                    {[
                        { id: 1, name: 'Descuento 10%', cost: 100 },
                        { id: 2, name: 'Gorra Vyper', cost: 500 },
                        { id: 3, name: 'Entrada VIP', cost: 1000 },
                    ].map(r => (
                        <div key={r.id} className="brutalist-card" style={{ marginBottom: 0, textAlign: 'center' }}>
                            <div style={{ height: '100px', background: '#333', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>IMG</div>
                            <h4>{r.name}</h4>
                            <p style={{ margin: '1rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{r.cost} COINS</p>
                            <button disabled={user.coinBalance < r.cost} style={{ width: '100%', padding: '0.5rem' }}>
                                {user.coinBalance >= r.cost ? 'CANJEAR' : 'SALDO INSUFICIENTE'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}
