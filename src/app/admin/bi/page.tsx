
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

const COLORS = ['#db2777', '#6d28d9', '#4ade80', '#facc15', '#ef4444', '#3b82f6'];

export default function BusinessIntelligence() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/analytics')
            .then(res => res.json())
            .then(setData)
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
            // Add to "Varios"
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

    return (
        <div className="page-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: '#ffffff', fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                        ANALYTICS
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Business Intelligence Dashboard</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/admin" passHref>
                        <button className="secondary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem' }}>VOLVER</button>
                    </Link>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid-layout" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-muted)' }}>VENTAS TOTALES (AÑO)</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80' }}>
                        ${data.timeline.reduce((acc, curr) => acc + curr.sales, 0).toLocaleString()}
                    </div>
                </div>
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-muted)' }}>GASTOS TOTALES (AÑO)</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                        ${(data.timeline.reduce((acc, curr) => acc + curr.expenses, 0)).toLocaleString()}
                    </div>
                </div>
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-muted)' }}>BALANCE NETO</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#facc15' }}>
                        ${(data.timeline.reduce((acc, curr) => acc + curr.sales, 0) - data.timeline.reduce((acc, curr) => acc + curr.expenses, 0)).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="grid-layout" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>

                {/* Branch Comparison */}
                <div className="glass-card" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#6d28d9' }}>COMPARATIVA SUCURSALES (TENDENCIA)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.branchComparison}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="month" stroke="#a3a3a3" />
                            <YAxis stroke="#a3a3a3" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                formatter={(value: number, name: string) => {
                                    const [branch, type] = name.split('_');
                                    return [`$${value.toLocaleString()}`, `${branch} (${type === 'sales' ? 'Ventas' : 'Gastos'})`];
                                }}
                            />
                            <Legend formatter={(val) => {
                                const [branch, type] = val.split('_');
                                return `${branch.toUpperCase()} ${type === 'sales' ? 'VENTAS' : 'GASTOS'}`;
                            }} />

                            <Line type="monotone" dataKey="Rawson_sales" name="Rawson_sales" stroke="#4ade80" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="Rawson_expenses" name="Rawson_expenses" stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" />
                            <Line type="monotone" dataKey="Rivadavia_sales" name="Rivadavia_sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="Rivadavia_expenses" name="Rivadavia_expenses" stroke="#facc15" strokeWidth={2} strokeDasharray="3 3" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Sales vs Expenses Trend */}
                    <div className="glass-card" style={{ height: '400px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>TENDENCIA: INGRESOS VS EGRESOS</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.timeline}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="month" stroke="#a3a3a3" />
                                <YAxis stroke="#a3a3a3" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="sales" name="Ventas" stroke="#4ade80" fillOpacity={1} fill="url(#colorSales)" />
                                <Area type="monotone" dataKey="expenses" name="Egresos" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Weekday Analysis */}
                    <div className="glass-card" style={{ height: '400px' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#facc15' }}>VENTAS POR DÍA SEMANA</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.weekdayStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="day" stroke="#a3a3a3" />
                                <YAxis stroke="#a3a3a3" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
                                />
                                <Bar dataKey="sales" fill="#facc15" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Forecast Chart */}
                    <div className="glass-card" style={{ height: '400px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>PREDICCIÓN DE FACTURACIÓN</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={combinedForecastData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="month" stroke="#a3a3a3" />
                                <YAxis
                                    stroke="#a3a3a3"
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="sales" name="Histórico" stroke="#4ade80" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="forecast" name="Proyección" stroke="#6d28d9" strokeWidth={2} strokeDasharray="5 5" />
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
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#1a1a1a' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
