'use client';

import { useState, useEffect } from 'react';
import { Producto } from '@/types/ecommerce';

interface PosCartItem {
    id: string;
    nombre: string;
    sku?: string;
    precio: number;
    cantidad: number;
}

export default function AdminPOS() {
    const [whatsapp, setWhatsapp] = useState('');
    const [amount, setAmount] = useState('');
    const [clientName, setClientName] = useState('');
    const [isCredit, setIsCredit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);

    // Quick Product / SKU Scanner state
    const [skuSearch, setSkuSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Producto[]>([]);
    const [posItems, setPosItems] = useState<PosCartItem[]>([]);
    const [scanFeedback, setScanFeedback] = useState('');

    useEffect(() => {
        if (skuSearch.trim().length >= 2) {
            const t = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/ecommerce/productos?all=true&limit=10&search=${encodeURIComponent(skuSearch.trim())}`);
                    const data = await res.json();
                    setSearchResults(data.productos || []);
                } catch {
                    setSearchResults([]);
                }
            }, 220);
            return () => clearTimeout(t);
        } else {
            setSearchResults([]);
        }
    }, [skuSearch]);

    const syncTotalFromItems = (nextItems: PosCartItem[]) => {
        setPosItems(nextItems);
        const sum = nextItems.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
        if (sum > 0) {
            setAmount(String(sum));
        }
    };

    const addProductToPos = (prod: Producto) => {
        const unitPrice = Number(prod.precio_mayorista || prod.precio_unitario || prod.precio_costo || 0);
        const existingIdx = posItems.findIndex(i => i.id === prod.id);
        let nextItems: PosCartItem[];
        if (existingIdx >= 0) {
            nextItems = posItems.map((it, idx) =>
                idx === existingIdx ? { ...it, cantidad: it.cantidad + 1 } : it
            );
        } else {
            nextItems = [
                ...posItems,
                {
                    id: prod.id,
                    nombre: prod.nombre,
                    sku: prod.sku,
                    precio: unitPrice,
                    cantidad: 1,
                },
            ];
        }
        syncTotalFromItems(nextItems);
        setSkuSearch('');
        setSearchResults([]);
        setScanFeedback(`✅ +1 ${prod.nombre}`);
        setTimeout(() => setScanFeedback(''), 2500);
    };

    const handleScannerKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const q = skuSearch.trim();
        if (!q) return;

        try {
            const res = await fetch(`/api/ecommerce/productos?all=true&limit=10&search=${encodeURIComponent(q)}`);
            const data = await res.json();
            const list: Producto[] = data.productos || [];
            const exact = list.find(p => p.sku && p.sku.toLowerCase() === q.toLowerCase());
            const chosen = exact || list[0];
            if (chosen) {
                addProductToPos(chosen);
            } else {
                setScanFeedback(`❌ No encontrado: "${q}"`);
            }
        } catch {
            setScanFeedback('❌ Error al buscar SKU');
        }
    };

    const removePosItem = (id: string) => {
        const next = posItems.filter(i => i.id !== id);
        setPosItems(next);
        const sum = next.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
        setAmount(sum > 0 ? String(sum) : '');
    };

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
                setPosItems([]);
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

                {/* Quick SKU / Barcode Scanner & Product Selector */}
                <div style={{
                    padding: '0.875rem',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.06)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    position: 'relative',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '0.8rem', margin: 0 }}>
                            🔫 ESCÁNER SKU / AGREGAR PRODUCTOS DEL CATÁLOGO (Opcional)
                        </label>
                        {scanFeedback && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: scanFeedback.startsWith('✅') ? '#10b981' : '#ef4444' }}>
                                {scanFeedback}
                            </span>
                        )}
                    </div>
                    <input
                        type="text"
                        value={skuSearch}
                        onChange={e => setSkuSearch(e.target.value)}
                        onKeyDown={handleScannerKeyDown}
                        placeholder="Escaneá código/SKU y apretá Enter, o buscá por nombre..."
                        style={{ marginBottom: 0 }}
                    />

                    {searchResults.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            left: '0.875rem',
                            right: '0.875rem',
                            zIndex: 50,
                            background: '#ffffff',
                            border: '1px solid rgba(0,0,0,0.15)',
                            borderRadius: '8px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            marginTop: '4px',
                        }}>
                            {searchResults.map(p => {
                                const price = Number(p.precio_mayorista || p.precio_unitario || p.precio_costo || 0);
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => addProductToPos(p)}
                                        style={{
                                            padding: '0.6rem 0.75rem',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '0.82rem',
                                            color: '#111',
                                        }}
                                    >
                                        <span>
                                            <strong>{p.nombre}</strong>
                                            {p.sku && <span style={{ color: '#666', marginLeft: 6 }}>[{p.sku}]</span>}
                                        </span>
                                        <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                            ${price.toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {posItems.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {posItems.map(item => (
                                <div key={item.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.8rem',
                                    padding: '0.35rem 0.6rem',
                                    background: 'rgba(255,255,255,0.8)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    color: '#111',
                                }}>
                                    <span>
                                        <strong>{item.cantidad}x</strong> {item.nombre}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <strong style={{ fontFamily: 'monospace' }}>
                                            ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                                        </strong>
                                        <button
                                            type="button"
                                            onClick={() => removePosItem(item.id)}
                                            style={{
                                                background: 'transparent',
                                                color: '#ef4444',
                                                border: 'none',
                                                padding: '0 4px',
                                                minHeight: 'auto',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                boxShadow: 'none',
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
