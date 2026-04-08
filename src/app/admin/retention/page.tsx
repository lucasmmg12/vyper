'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCcw, Search, MessageCircle, AlertCircle, ShoppingBag, Send } from 'lucide-react';
import { TierBadge } from '@/utils/tiers';

interface Client {
    id: number;
    name: string;
    phone: string;
    coin_balance: number;
}

interface Sale {
    id: number;
    client_id: number;
    amount: number;
    created_at: string;
}

interface FollowUpOpportunity {
    client: Client;
    lastPurchaseDate: string;
    daysSinceLastPurchase: number;
    lastPurchaseAmount: number;
}

export default function RetentionPage() {
    const [opportunities, setOpportunities] = useState<FollowUpOpportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [clientsRes, salesRes] = await Promise.all([
                fetch('/api/clients?limit=10000'),
                fetch('/api/sales?limit=10000') // In production, we'd paginate or filter on backend
            ]);

            const [clientsData, salesData] = await Promise.all([
                clientsRes.json(),
                salesRes.json()
            ]);

            const clients: Client[] = clientsData.clients || [];
            const sales: Sale[] = salesData.sales || [];

            // Find last purchase for each client
            const lastPurchases = new Map<number, Sale>();
            sales.forEach(sale => {
                if (!sale.client_id) return;
                const existing = lastPurchases.get(sale.client_id);
                if (!existing || new Date(sale.created_at) > new Date(existing.created_at)) {
                    lastPurchases.set(sale.client_id, sale);
                }
            });

            const today = new Date();
            const ops: FollowUpOpportunity[] = [];

            lastPurchases.forEach(sale => {
                const client = clients.find(c => c.id === sale.client_id);
                if (!client || !client.phone) return;

                const saleDate = new Date(sale.created_at);
                const diffTime = Math.abs(today.getTime() - saleDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Target: clients who bought 25 to 35 days ago (ideal for supplement renewal)
                if (diffDays >= 25 && diffDays <= 35) {
                    ops.push({
                        client,
                        lastPurchaseDate: sale.created_at,
                        lastPurchaseAmount: Number(sale.amount),
                        daysSinceLastPurchase: diffDays
                    });
                }
            });

            // Sort by days (descending, the ones closest to 35 days first)
            ops.sort((a, b) => b.daysSinceLastPurchase - a.daysSinceLastPurchase);
            setOpportunities(ops);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppClick = (op: FollowUpOpportunity) => {
        const cleanPhone = op.client.phone.replace(/\D/g, '');
        // Format to Argentina format if needed (simple check)
        const waPhone = cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`;

        const message = `Hola ${op.client.name.split(' ')[0]} 👋 Vi que hace un mes hiciste tu última compra. ¿Te vas quedando sin suplementos? Avisame si te guardo algo o te lo enviamos para no cortar el progreso 🦾`;

        const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    const filteredOps = opportunities.filter(op => {
        const term = searchTerm.toLowerCase();
        const nameMatch = op.client.name.toLowerCase().includes(term);
        const searchDigits = searchTerm.replace(/\D/g, '');
        const phoneDigits = (op.client.phone || '').replace(/\D/g, '');
        const phoneMatch = searchDigits.length > 0 && phoneDigits.includes(searchDigits);
        return nameMatch || phoneMatch;
    });

    return (
        <div className="page-container">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <RefreshCcw size={24} /> Retención
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Motor de Recompra Inteligente (Follow-Up)</p>
            </header>

            {/* Context Widget */}
            <div className="glass-card" style={{ marginBottom: '2rem', borderLeft: '4px solid #00FF88', background: 'linear-gradient(90deg, rgba(0,255,136,0.05) 0%, rgba(0,0,0,0) 100%)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00FF88', marginBottom: '0.5rem' }}>
                    <AlertCircle size={20} /> Ventana de Recompra (Día 25 - 35)
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Un suplemento promedio (proteína, creatina) dura 30 días. Este motor detecta a los clientes cuya última compra fue hace un mes exacto.
                    Contactarlos proactivamente hoy triplica la probabilidad de recompra y evita que vayan a la competencia.
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem' }}>
                    <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Oportunidades de hoy:</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{opportunities.length}</div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="table-container glass-card" style={{ padding: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Acciones Pendientes</h2>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#666' }} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem', background: 'rgba(0,0,0,0.5)', width: '100%' }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Analizando base de datos...</div>
                ) : filteredOps.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <RefreshCcw size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                        <p>No hay oportunidades de recompra para hoy.</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>El sistema escanea clientes que compraron hace 25-35 días.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>CLIENTE</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>TIEMPO TRANSCURRIDO</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>TICKET ANTERIOR</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>ACCIÓN 1-CLIC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOps.map((op, idx) => (
                                    <tr key={idx} style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                                        transition: 'background 0.2s',
                                        cursor: 'default'
                                    }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {op.client.name}
                                                <TierBadge coins={op.client.coin_balance} size="sm" />
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                {op.client.phone}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{
                                                color: op.daysSinceLastPurchase >= 30 ? '#ef4444' : '#facc15',
                                                fontWeight: 800,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem'
                                            }}>
                                                <AlertCircle size={14} />
                                                Hace {op.daysSinceLastPurchase} días
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                Compra: {new Date(op.lastPurchaseDate).toLocaleDateString('es-AR')}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'white', fontWeight: 600 }}>
                                            ${op.lastPurchaseAmount.toLocaleString('es-AR')}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleWhatsAppClick(op)}
                                                style={{
                                                    background: '#25D366',
                                                    color: '#000',
                                                    border: 'none',
                                                    padding: '0.6rem 1.2rem',
                                                    borderRadius: '50px',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                <MessageCircle size={16} />
                                                Enviar WhatsApp
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
