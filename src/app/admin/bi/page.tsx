
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, HelpCircle, TrendingUp, TrendingDown, UserX, DollarSign, Users, Coins, CreditCard, Target, ShoppingCart } from 'lucide-react';
import { generateFinancialReport } from '@/utils/generateFinancialReport';
import { TierBadge, getTier } from '@/utils/tiers';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

interface AnalyticsData {
    timeline: { month: string; sales: number; expenses: number }[];
    expenseCategories: { name: string; value: number }[];
    forecast: { month: string; amount: number }[];
    weekdayStats: { day: string; sales: number }[];
    branchComparison: any[];
}

interface ClientData {
    id: number;
    name: string;
    phone: string;
    coin_balance: number;
    debt_balance: number;
}

interface ExtendedMetrics {
    totalClients: number;
    avgLTV: number;
    totalHistoricalSales: number;
    avgTicket: number;
    totalSalesCount: number;
    totalDebt: number;
    debtClientsCount: number;
    topDebtors: { name: string; debt: number }[];
    totalCoins: number;
    tierDistribution: { tier: string; emoji: string; count: number; color: string }[];
}

const COLORS = ['#db2777', '#6d28d9', '#4ade80', '#facc15', '#ef4444', '#3b82f6'];

export default function BusinessIntelligence() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [metrics, setMetrics] = useState<ExtendedMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/analytics').then(r => r.json()),
            fetch('/api/clients?limit=10000').then(r => r.json()),
            fetch('/api/sales?limit=10000').then(r => r.json()),
        ])
            .then(([analyticsData, clientsData, salesData]) => {
                setData(analyticsData);

                const clients: ClientData[] = clientsData.clients || [];
                const sales = salesData.sales || [];

                // Debt metrics
                const debtClients = clients.filter(c => Number(c.debt_balance) > 0);
                const totalDebt = debtClients.reduce((sum, c) => sum + Number(c.debt_balance), 0);
                const topDebtors = debtClients
                    .sort((a, b) => Number(b.debt_balance) - Number(a.debt_balance))
                    .slice(0, 5)
                    .map(c => ({ name: c.name, debt: Number(c.debt_balance) }));

                // LTV
                const totalHistoricalSales = sales.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
                const activeClients = clients.length;
                const avgLTV = activeClients > 0 ? totalHistoricalSales / activeClients : 0;

                // Ticket promedio
                const avgTicket = sales.length > 0 ? totalHistoricalSales / sales.length : 0;

                // Total coins
                const totalCoins = clients.reduce((sum, c) => sum + Number(c.coin_balance), 0);

                // Tier distribution
                const tierCounts: Record<string, { count: number; emoji: string; color: string }> = {
                    'Bronce': { count: 0, emoji: '🥉', color: '#cd7f32' },
                    'Plata': { count: 0, emoji: '🥈', color: '#c0c0c0' },
                    'Oro': { count: 0, emoji: '🥇', color: '#fbbf24' },
                    'Diamante': { count: 0, emoji: '💎', color: '#b9f2ff' },
                };
                clients.forEach(c => {
                    const tier = getTier(c.coin_balance);
                    if (tierCounts[tier.name]) tierCounts[tier.name].count++;
                });
                const tierDistribution = Object.entries(tierCounts).map(([tier, data]) => ({
                    tier,
                    emoji: data.emoji,
                    count: data.count,
                    color: data.color,
                }));

                setMetrics({
                    totalClients: activeClients,
                    avgLTV,
                    totalHistoricalSales,
                    avgTicket,
                    totalSalesCount: sales.length,
                    totalDebt,
                    debtClientsCount: debtClients.length,
                    topDebtors,
                    totalCoins,
                    tierDistribution,
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
                <h2>ANALIZANDO DATOS...</h2>
            </div>
        );
    }

    if (!data) return <div>Error loading data.</div>;

    const combinedForecastData = [
        ...data.timeline.map(d => ({ ...d, forecast: null })),
        ...(data.forecast.map(f => ({ month: f.month, sales: null, expenses: null, forecast: f.amount })))
    ];

    // Group categories smaller than 1% into "Varios"
    const totalExpenses = data.expenseCategories.reduce((sum, cat) => sum + cat.value, 0);
    const processedExpenseCategories = data.expenseCategories.reduce((acc: { name: string; value: number }[], category) => {
        const percentage = (category.value / totalExpenses) * 100;
        if (percentage < 1) {
            const variosIndex = acc.findIndex(c => c.name === 'Varios');
            if (variosIndex >= 0) {
                acc[variosIndex].value += category.value;
            } else {
                acc.push({ name: 'Varios', value: category.value });
            }
        } else {
            acc.push(category);
        }
        return acc;
    }, []);

    const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;

    return (
        <div className="page-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                        ANALYTICS
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Business Intelligence Dashboard</p>
                </div>

                <button
                    onClick={() => generateFinancialReport(data)}
                    className="secondary"
                    style={{
                        padding: '0.5rem 1.25rem',
                        fontSize: '0.8125rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Download size={16} />
                    DESCARGAR INFORME
                </button>
            </header>

            {/* ═══════════════════════════════════════════════ */}
            {/* KPI CARDS — Financial Overview                 */}
            {/* ═══════════════════════════════════════════════ */}
            <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
                <KPICard
                    label="VENTAS TOTALES"
                    value={fmt(data.timeline.reduce((acc, curr) => acc + curr.sales, 0))}
                    color="#4ade80"
                    icon={<TrendingUp size={20} />}
                    tooltip="Suma de todas las ventas registradas en el período. Incluye todas las sucursales y métodos de pago."
                />
                <KPICard
                    label="GASTOS TOTALES"
                    value={fmt(data.timeline.reduce((acc, curr) => acc + curr.expenses, 0))}
                    color="#ef4444"
                    icon={<TrendingDown size={20} />}
                    tooltip="Total de egresos operativos del negocio: mercadería, alquiler, salarios, servicios, etc."
                />
                <KPICard
                    label="BALANCE NETO"
                    value={fmt(data.timeline.reduce((acc, curr) => acc + curr.sales, 0) - data.timeline.reduce((acc, curr) => acc + curr.expenses, 0))}
                    color="#facc15"
                    icon={<DollarSign size={20} />}
                    tooltip="Ganancia real del negocio. Se calcula: Ventas Totales − Gastos Totales. Si es positivo, el negocio genera ganancia."
                />
            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* EXTENDED METRICS — Clientes, LTV, Deuda        */}
            {/* ═══════════════════════════════════════════════ */}
            {metrics && (
                <>
                    <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '2rem', gap: '1rem' }}>
                        <KPICard
                            label="TICKET PROMEDIO"
                            value={fmt(metrics.avgTicket)}
                            color="#a78bfa"
                            icon={<ShoppingCart size={20} />}
                            tooltip="Cuánto gasta en promedio un cliente por compra. Se calcula: Ventas Históricas Totales ÷ Cantidad de Operaciones. Sirve para saber si los clientes están gastando más o menos por visita."
                        />
                        <KPICard
                            label="LTV PROMEDIO"
                            value={fmt(metrics.avgLTV)}
                            color="#00D1FF"
                            icon={<Target size={20} />}
                            tooltip="Lifetime Value (Valor de Vida del Cliente): cuánto dinero ha gastado cada cliente en promedio desde su primera compra. Se calcula: Ventas Históricas Totales ÷ Clientes Activos. Un LTV alto significa que tus clientes son fieles y compran recurrentemente."
                            highlight
                        />
                        <KPICard
                            label="DEUDA TOTAL"
                            value={fmt(metrics.totalDebt)}
                            color="#ef4444"
                            icon={<CreditCard size={20} />}
                            tooltip="Suma de todos los saldos pendientes de los clientes que tienen cuenta corriente. Es dinero que te deben y aún no cobraste."
                        />
                        <KPICard
                            label="CLIENTES EN DEUDA"
                            value={`${metrics.debtClientsCount}`}
                            color="#facc15"
                            icon={<UserX size={20} />}
                            tooltip="Cantidad de clientes que tienen un saldo pendiente mayor a $0 en su cuenta corriente. Monitorear este número ayuda a controlar la morosidad."
                            sub={`de ${metrics.totalClients} totales`}
                        />
                        <KPICard
                            label="CLIENTES ACTIVOS"
                            value={`${metrics.totalClients}`}
                            color="#4ade80"
                            icon={<Users size={20} />}
                            tooltip="Cantidad total de clientes registrados en el sistema. Incluye todos los clientes con perfil creado."
                        />
                        <KPICard
                            label="VYPER COINS CIRCULANDO"
                            value={`${metrics.totalCoins.toLocaleString()} 🪙`}
                            color="#fbbf24"
                            icon={<Coins size={20} />}
                            tooltip="Total de Vyper Coins acumuladas por todos los clientes. Representa el nivel de engagement del programa de fidelización."
                        />
                    </div>

                    {/* Top Debtors + Tier Distribution */}
                    <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        {/* Top Deudores */}
                        <div className="glass-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <UserX size={20} color="#ef4444" />
                                <h3 style={{ margin: 0 }}>TOP DEUDORES</h3>
                                <span title="Los 5 clientes con mayor saldo pendiente en cuenta corriente. Útil para gestionar cobros y priorizar seguimiento." style={{ cursor: 'help', opacity: 0.4 }}>
                                    <HelpCircle size={14} />
                                </span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                Clientes con mayor saldo pendiente en cuenta corriente
                            </p>

                            {metrics.topDebtors.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {metrics.topDebtors.map((d, i) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(239,68,68,0.05)',
                                            border: '1px solid rgba(239,68,68,0.1)',
                                            borderRadius: '10px',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    background: i === 0 ? '#ef4444' : 'rgba(239,68,68,0.2)',
                                                    color: i === 0 ? '#fff' : '#f87171',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800,
                                                }}>
                                                    {i + 1}
                                                </span>
                                                <span style={{ fontSize: '0.9rem' }}>{d.name}</span>
                                            </div>
                                            <span style={{ fontWeight: 800, color: '#f87171', fontSize: '1rem' }}>{fmt(d.debt)}</span>
                                        </div>
                                    ))}
                                    <div style={{
                                        marginTop: '0.5rem',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(239,68,68,0.08)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                    }}>
                                        <span>💳 DEUDA TOTAL</span>
                                        <span style={{ color: '#ef4444' }}>{fmt(metrics.totalDebt)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#4ade80' }}>
                                    ✅ No hay clientes con deuda pendiente
                                </div>
                            )}
                        </div>

                        {/* Tier Distribution */}
                        <div className="glass-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Coins size={20} color="#fbbf24" />
                                <h3 style={{ margin: 0 }}>DISTRIBUCIÓN DE NIVELES</h3>
                                <span title="Cómo se distribuyen tus clientes entre los niveles del programa de fidelización Vyper Coins. Bronce: 0-99, Plata: 100-499, Oro: 500-999, Diamante: 1000+." style={{ cursor: 'help', opacity: 0.4 }}>
                                    <HelpCircle size={14} />
                                </span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                Segmentación de clientes por nivel de Vyper Coins
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {metrics.tierDistribution.map(t => {
                                    const pct = metrics.totalClients > 0 ? (t.count / metrics.totalClients) * 100 : 0;
                                    return (
                                        <div key={t.tier}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {t.emoji} <strong>{t.tier}</strong>
                                                </span>
                                                <span style={{ color: t.color, fontWeight: 700 }}>{t.count} clientes ({pct.toFixed(0)}%)</span>
                                            </div>
                                            <div style={{
                                                height: '8px',
                                                background: 'rgba(255,255,255,0.06)',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                            }}>
                                                <div style={{
                                                    width: `${pct}%`,
                                                    height: '100%',
                                                    background: t.color,
                                                    borderRadius: '4px',
                                                    transition: 'width 0.5s ease',
                                                    boxShadow: `0 0 6px ${t.color}40`,
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* CHARTS                                         */}
            {/* ═══════════════════════════════════════════════ */}
            <div className="grid-layout" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>

                {/* Branch Comparison */}
                <div className="glass-card" style={{ height: '400px' }} id="chart-branch">
                    <h3 style={{ marginBottom: '1rem' }}>COMPARATIVA SUCURSALES (TENDENCIA)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.branchComparison}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                            <XAxis dataKey="month" stroke="#a3a3a3" />
                            <YAxis stroke="#a3a3a3" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value: number, name: string) => {
                                    const [branch, type] = name.split('_');
                                    return [`$${value.toLocaleString()}`, `${branch} (${type === 'sales' ? 'Ventas' : 'Gastos'})`];
                                }}
                            />
                            <Legend formatter={(val) => {
                                const [branch, type] = val.split('_');
                                return `${branch.toUpperCase()} ${type === 'sales' ? 'VENTAS' : 'GASTOS'}`;
                            }} />

                            <Line type="monotone" dataKey="Rawson_sales" name="Rawson_sales" stroke="#111111" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="Rawson_expenses" name="Rawson_expenses" stroke="#888888" strokeWidth={2} strokeDasharray="3 3" />
                            <Line type="monotone" dataKey="Rivadavia_sales" name="Rivadavia_sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="Rivadavia_expenses" name="Rivadavia_expenses" stroke="#93c5fd" strokeWidth={2} strokeDasharray="3 3" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Sales vs Expenses Trend */}
                    <div className="glass-card" style={{ height: '400px' }} id="chart-timeline">
                        <h3 style={{ marginBottom: '1rem' }}>TENDENCIA: INGRESOS VS EGRESOS</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.timeline}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#111111" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                                <XAxis dataKey="month" stroke="#a3a3a3" />
                                <YAxis stroke="#a3a3a3" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="sales" name="Ventas" stroke="#111111" fillOpacity={1} fill="url(#colorSales)" />
                                <Area type="monotone" dataKey="expenses" name="Egresos" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Weekday Analysis */}
                    <div className="glass-card" style={{ height: '400px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>VENTAS POR DÍA SEMANA</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.weekdayStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" vertical={false} />
                                <XAxis dataKey="day" stroke="#a3a3a3" />
                                <YAxis stroke="#a3a3a3" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
                                />
                                <Bar dataKey="sales" fill="#facc15" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Forecast Chart */}
                    <div className="glass-card" style={{ height: '400px' }} id="chart-forecast">
                        <h3 style={{ marginBottom: '1rem' }}>PREDICCIÓN DE FACTURACIÓN</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={combinedForecastData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                                <XAxis dataKey="month" stroke="#a3a3a3" />
                                <YAxis
                                    stroke="#a3a3a3"
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="sales" name="Histórico" stroke="#111111" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="forecast" name="Proyección" stroke="#888888" strokeWidth={2} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Expenses Breakdown */}
                    <div className="glass-card" style={{ height: '400px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>GASTOS POR CATEGORÍA</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={processedExpenseCategories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {processedExpenseCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}

// ═══ KPI Card Component ═══
function KPICard({ label, value, color, icon, tooltip, highlight, sub }: {
    label: string; value: string; color: string; icon: React.ReactNode; tooltip: string; highlight?: boolean; sub?: string;
}) {
    return (
        <div className="glass-card" style={{
            textAlign: 'center',
            padding: '1.5rem 1rem',
            background: highlight ? `${color}08` : undefined,
            border: highlight ? `1px solid ${color}30` : undefined,
            position: 'relative',
        }}>
            <div style={{ color, marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>{icon}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <h4 style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.7rem', letterSpacing: '0.05em' }}>{label}</h4>
                <span title={tooltip} style={{ cursor: 'help', opacity: 0.3, display: 'inline-flex' }}>
                    <HelpCircle size={12} />
                </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: highlight ? color : '#111111' }}>
                {value}
            </div>
            {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{sub}</div>}
        </div>
    );
}
