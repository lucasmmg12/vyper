'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, TrendingUp, TrendingDown, AlertTriangle, Store, Coins, CreditCard, Users, HelpCircle, DollarSign, UserX } from 'lucide-react';

interface TopDebtor {
    name: string;
    debt: number;
}

interface SummaryData {
    totalSales: number;
    totalExpenses: number;
    netProfit: number;
    salesCount: number;
    avgTicket: number;
    salesRivadavia: number;
    salesRawson: number;
    totalCoinsGiven: number;
    newCharges: number;
    payments: number;
    alertsCount: number;
    totalClients: number;
    // New metrics
    totalDebt: number;
    debtClientsCount: number;
    topDebtors: TopDebtor[];
    avgLTV: number;
    totalHistoricalSales: number;
}

interface DailySummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DailySummaryModal({ isOpen, onClose }: DailySummaryModalProps) {
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [data, setData] = useState<SummaryData | null>(null);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchPreview();
            setSent(false);
            setError('');
        }
    }, [isOpen]);

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const [salesRes, expensesRes, coinsRes, debtRes, clientsRes] = await Promise.all([
                fetch('/api/sales?limit=10000'),
                fetch('/api/expenses?limit=10000'),
                fetch('/api/coin-transactions?limit=10000'),
                fetch('/api/debt-transactions?limit=10000'),
                fetch('/api/clients?limit=10000'),
            ]);

            const [salesData, expensesData, coinsData, debtData, clientsData] = await Promise.all([
                salesRes.json(),
                expensesRes.json(),
                coinsRes.json(),
                debtRes.json(),
                clientsRes.json(),
            ]);

            // Filter today's data
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const isToday = (dateStr: string) => {
                const d = new Date(dateStr);
                return d >= today && d <= todayEnd;
            };

            const allSales = salesData.sales || [];
            const todaySales = allSales.filter((s: any) => isToday(s.date || s.created_at));
            const todayExpenses = (expensesData.expenses || []).filter((e: any) => isToday(e.date || e.created_at));
            const todayCoins = (coinsData.transactions || []).filter((c: any) => isToday(c.date || c.created_at));
            const todayDebt = (debtData.transactions || []).filter((d: any) => isToday(d.date || d.created_at));
            const allClients = clientsData.clients || [];

            const totalSales = todaySales.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
            const totalExpenses = todayExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
            const salesRivadavia = todaySales.filter((s: any) => s.branch?.toLowerCase().includes('rivadavia')).reduce((sum: number, s: any) => sum + Number(s.amount), 0);
            const salesRawson = todaySales.filter((s: any) => s.branch?.toLowerCase().includes('rawson')).reduce((sum: number, s: any) => sum + Number(s.amount), 0);
            const totalCoinsGiven = todayCoins.reduce((sum: number, c: any) => sum + Number(c.coins_added), 0);
            const newCharges = todayDebt.filter((d: any) => d.transaction_type === 'charge').reduce((sum: number, d: any) => sum + Number(d.amount), 0);
            const payments = todayDebt.filter((d: any) => d.transaction_type === 'payment').reduce((sum: number, d: any) => sum + Number(d.amount), 0);

            // Debt metrics
            const debtClients = allClients.filter((c: any) => Number(c.debt_balance) > 0);
            const totalDebt = debtClients.reduce((sum: number, c: any) => sum + Number(c.debt_balance), 0);
            const topDebtors: TopDebtor[] = debtClients
                .sort((a: any, b: any) => Number(b.debt_balance) - Number(a.debt_balance))
                .slice(0, 5)
                .map((c: any) => ({ name: c.name, debt: Number(c.debt_balance) }));

            // LTV calculation: total historical sales / total active clients
            const totalHistoricalSales = allSales.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
            const activeClients = allClients.filter((c: any) => c.user_status !== false);
            const avgLTV = activeClients.length > 0 ? totalHistoricalSales / activeClients.length : 0;

            const totalClients = activeClients.length;

            const alerts: string[] = [];
            if (debtClients.length > 0) alerts.push('deuda');
            if (todaySales.length === 0) alerts.push('sin ventas');
            if (totalSales > 0 && totalExpenses > totalSales * 0.8) alerts.push('egresos altos');

            setData({
                totalSales,
                totalExpenses,
                netProfit: totalSales - totalExpenses,
                salesCount: todaySales.length,
                avgTicket: todaySales.length > 0 ? totalSales / todaySales.length : 0,
                salesRivadavia,
                salesRawson,
                totalCoinsGiven,
                newCharges,
                payments,
                alertsCount: alerts.length,
                totalClients,
                totalDebt,
                debtClientsCount: debtClients.length,
                topDebtors,
                avgLTV,
                totalHistoricalSales,
            });
        } catch (err) {
            setError('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        setSending(true);
        setError('');
        try {
            const res = await fetch('/api/daily-summary', { method: 'POST' });
            const result = await res.json();
            if (res.ok && result.success) {
                setSent(true);
            } else {
                setError(result.error || 'Error al enviar');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '640px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    background: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '2rem',
                    position: 'relative',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                            📋 Resumen Diario
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            color: '#fff',
                            display: 'flex',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#00FF88', marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-muted)' }}>Cargando datos del día...</p>
                    </div>
                ) : data ? (
                    <>
                        {/* ═══ RESULTADO DEL DÍA ═══ */}
                        <SectionTitle icon={<TrendingUp size={16} />} title="Resultado del Día" tooltip="Resumen financiero de las operaciones registradas hoy en ambas sucursales." />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <StatCard
                                label="Ventas"
                                value={fmt(data.totalSales)}
                                sub={`${data.salesCount} operaciones`}
                                icon={<TrendingUp size={16} />}
                                color="#4ade80"
                            />
                            <StatCard
                                label="Egresos"
                                value={fmt(data.totalExpenses)}
                                icon={<TrendingDown size={16} />}
                                color="#ef4444"
                            />
                            <StatCard
                                label="Ganancia Neta"
                                value={fmt(data.netProfit)}
                                icon={data.netProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                color={data.netProfit >= 0 ? '#00FF88' : '#ef4444'}
                                highlight
                            />
                        </div>

                        {/* Ticket Promedio + LTV */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <MetricRow
                                emoji="🎫"
                                label="Ticket Promedio"
                                value={fmt(data.avgTicket)}
                                tooltip="Cuánto gasta en promedio cada cliente por compra hoy. Se calcula: Ventas del día ÷ Cantidad de operaciones."
                            />
                            <MetricRow
                                emoji="💎"
                                label="LTV Promedio"
                                value={fmt(data.avgLTV)}
                                tooltip="Lifetime Value: cuánto dinero ha gastado en promedio cada cliente desde que empezó a comprar. Se calcula: Ventas históricas totales ÷ Clientes activos."
                                highlight
                            />
                        </div>

                        {/* ═══ POR SUCURSAL ═══ */}
                        {(data.salesRivadavia > 0 || data.salesRawson > 0) && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <SectionTitle icon={<Store size={16} />} title="Por Sucursal" tooltip="Desglose de las ventas del día por ubicación física del local." />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <MiniStat label="📍 Rivadavia" value={fmt(data.salesRivadavia)} />
                                    <MiniStat label="📍 Rawson" value={fmt(data.salesRawson)} />
                                </div>
                            </div>
                        )}

                        {/* ═══ COINS & CTA CTE ═══ */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <SectionTitle icon={<Coins size={16} />} title="Vyper Coins" tooltip="Monedas de fidelización entregadas hoy. Cada $1.000 en compras = 1 Vyper Coin." />
                                <MiniStat label="Entregadas hoy" value={`${data.totalCoinsGiven} 🪙`} />
                            </div>
                            <div>
                                <SectionTitle icon={<CreditCard size={16} />} title="Cta Corriente" tooltip="Movimientos de cuenta corriente del día. Cargos = nueva deuda. Pagos = cobros de deuda." />
                                <MiniStat label="🔴 Cargos" value={fmt(data.newCharges)} />
                                {data.payments > 0 && <div style={{ marginTop: '0.5rem' }}><MiniStat label="🟢 Pagos" value={fmt(data.payments)} /></div>}
                            </div>
                        </div>

                        {/* ═══ DEUDAS ═══ */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <SectionTitle
                                icon={<UserX size={16} />}
                                title="Estado de Deudas"
                                tooltip="Dinero total que los clientes le deben al negocio en cuenta corriente. Incluye los clientes con mayor saldo pendiente."
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <MetricRow
                                    emoji="💳"
                                    label="Deuda Total"
                                    value={fmt(data.totalDebt)}
                                    tooltip="Suma de todas las deudas pendientes de todos los clientes con cuenta corriente activa."
                                    valueColor="#ef4444"
                                />
                                <MetricRow
                                    emoji="👥"
                                    label="Clientes en deuda"
                                    value={`${data.debtClientsCount}`}
                                    tooltip="Cantidad de clientes que tienen un saldo pendiente mayor a $0."
                                    valueColor="#facc15"
                                />
                            </div>

                            {data.topDebtors.length > 0 && (
                                <div style={{
                                    background: 'rgba(239,68,68,0.05)',
                                    border: '1px solid rgba(239,68,68,0.15)',
                                    borderRadius: '10px',
                                    padding: '0.75rem 1rem',
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Top Deudores
                                    </div>
                                    {data.topDebtors.map((d, i) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.35rem 0',
                                            borderBottom: i < data.topDebtors.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                            fontSize: '0.85rem',
                                        }}>
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                {i + 1}. {d.name}
                                            </span>
                                            <span style={{ fontWeight: 700, color: '#f87171' }}>{fmt(d.debt)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ═══ RESUMEN GENERAL ═══ */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '10px',
                            marginBottom: '1.5rem',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                        }}>
                            <span><Users size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {data.totalClients} clientes activos</span>
                            <span>Ventas históricas: <strong style={{ color: '#4ade80' }}>{fmt(data.totalHistoricalSales)}</strong></span>
                            {data.alertsCount > 0 && (
                                <span style={{ color: '#facc15' }}>
                                    <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                    {data.alertsCount} alerta{data.alertsCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                padding: '0.75rem',
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid #ef4444',
                                borderRadius: '8px',
                                color: '#ef4444',
                                fontSize: '0.85rem',
                                marginBottom: '1rem',
                                textAlign: 'center',
                            }}>
                                ❌ {error}
                            </div>
                        )}

                        {/* Success */}
                        {sent && (
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(0,255,136,0.1)',
                                border: '1px solid #00FF88',
                                borderRadius: '8px',
                                color: '#00FF88',
                                fontSize: '0.9rem',
                                marginBottom: '1rem',
                                textAlign: 'center',
                                fontWeight: 600,
                            }}>
                                ✅ Resumen enviado por WhatsApp al dueño
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={onClose}
                                className="secondary"
                                style={{ flex: 1, padding: '0.75rem', fontSize: '0.9rem' }}
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={sending || sent}
                                style={{
                                    flex: 2,
                                    padding: '0.75rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    background: sent ? '#333' : '#00FF88',
                                    color: sent ? '#666' : '#000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: sending || sent ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    opacity: sending ? 0.7 : 1,
                                }}
                            >
                                {sending ? (
                                    <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                                ) : sent ? (
                                    '✅ Enviado'
                                ) : (
                                    <><Send size={18} /> Enviar por WhatsApp</>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                        ❌ {error || 'Error al cargar datos'}
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══ Sub-components ═══

function StatCard({ label, value, sub, icon, color, highlight }: {
    label: string; value: string; sub?: string; icon: React.ReactNode; color: string; highlight?: boolean;
}) {
    return (
        <div style={{
            padding: '0.85rem',
            background: highlight ? `${color}10` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${highlight ? color + '40' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '12px',
            textAlign: 'center',
        }}>
            <div style={{ color, marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>{icon}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: highlight ? color : '#fff' }}>{value}</div>
            {sub && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
        </div>
    );
}

function SectionTitle({ icon, title, tooltip }: { icon: React.ReactNode; title: string; tooltip?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {icon} {title}
            {tooltip && (
                <span title={tooltip} style={{ cursor: 'help', opacity: 0.5, display: 'inline-flex' }}>
                    <HelpCircle size={13} />
                </span>
            )}
        </div>
    );
}

function MetricRow({ emoji, label, value, tooltip, highlight, valueColor }: {
    emoji: string; label: string; value: string; tooltip?: string; highlight?: boolean; valueColor?: string;
}) {
    return (
        <div style={{
            padding: '0.65rem 0.85rem',
            background: highlight ? 'rgba(185,242,255,0.05)' : 'rgba(255,255,255,0.03)',
            border: highlight ? '1px solid rgba(185,242,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
        }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {emoji} {label}
                {tooltip && (
                    <span title={tooltip} style={{ cursor: 'help', opacity: 0.4, display: 'inline-flex' }}>
                        <HelpCircle size={12} />
                    </span>
                )}
            </span>
            <span style={{ fontWeight: 700, color: valueColor || (highlight ? '#b9f2ff' : '#fff') }}>{value}</span>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            padding: '0.6rem 0.75rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
        }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontWeight: 700 }}>{value}</span>
        </div>
    );
}
