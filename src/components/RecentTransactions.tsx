
'use client';

import { useState, useEffect } from 'react';
import { Trash2, Edit2, Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

type TransactionType = 'SALES' | 'EXPENSES';

interface Transaction {
    id: number;
    date: string;
    amount: number;
    branch: string;
    observations?: string;
    category?: string; // Only for expenses
}

export default function RecentTransactions({ type, refreshTrigger }: { type: TransactionType, refreshTrigger?: number }) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Transaction>>({});
    const [loading, setLoading] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoint = type === 'SALES' ? '/api/sales?limit=10' : '/api/expenses?limit=10';
            const res = await fetch(endpoint);
            const data = await res.json();
            setTransactions(type === 'SALES' ? data.sales : data.expenses);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [type, refreshTrigger]);

    // Delete Handler
    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        try {
            const endpoint = type === 'SALES' ? `/api/sales?id=${id}` : `/api/expenses?id=${id}`;
            await fetch(endpoint, { method: 'DELETE' });
            fetchData(); // Refresh
        } catch (error) {
            console.error(error);
        }
    };

    // Edit Handlers
    const startEdit = (t: Transaction) => {
        setEditingId(t.id);
        setEditForm({ ...t });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            const endpoint = type === 'SALES' ? '/api/sales' : '/api/expenses';
            await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    // Chart Data Preparation (Grouped by date and summed)
    const groupedData = transactions.reduce((acc: { [key: string]: number }, curr) => {
        const dateKey = curr.date ? new Date(curr.date).toLocaleDateString() : 'Sin fecha';
        acc[dateKey] = (acc[dateKey] || 0) + curr.amount;
        return acc;
    }, {});

    const chartData = Object.entries(groupedData)
        .reverse()
        .map(([date, amount]) => ({
            date: date.substring(0, 5), // Keep it short for the axis
            fullDate: date,
            amount
        }));

    const totalLast10 = transactions.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                <span>Últimos movimientos</span>
                <span style={{ fontSize: '0.9rem', color: type === 'SALES' ? '#4ade80' : '#ef4444' }}>
                    Total (10): ${totalLast10.toLocaleString()}
                </span>
            </h3>

            {/* Mini Chart */}
            <div style={{ height: '100px', marginBottom: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={type === 'SALES' ? '#4ade80' : '#ef4444'} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={type === 'SALES' ? '#4ade80' : '#ef4444'} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            hide={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666', fontSize: 10 }}
                            interval="preserveStartEnd"
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                            itemStyle={{ color: type === 'SALES' ? '#4ade80' : '#ef4444' }}
                            wrapperStyle={{ outline: 'none' }}
                            labelStyle={{ color: '#fff', marginBottom: '4px' }}
                            labelFormatter={(value, name) => {
                                const item = chartData.find(d => d.date === value);
                                return item ? item.fullDate : value;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke={type === 'SALES' ? '#4ade80' : '#ef4444'}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Transactions List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '0.5rem' }}>Fecha</th>
                            <th style={{ padding: '0.5rem' }}>Suc.</th>
                            <th style={{ padding: '0.5rem' }}>Obs / Cat</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Monto</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => (
                            <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {editingId === t.id ? (
                                    // EDIT MODE ROW
                                    <>
                                        <td><input type="date" value={editForm.date?.split('T')[0]} onChange={e => setEditForm({ ...editForm, date: e.target.value })} style={{ padding: '0.3rem', fontSize: '0.8rem' }} /></td>
                                        <td>
                                            <select value={editForm.branch} onChange={e => setEditForm({ ...editForm, branch: e.target.value })} style={{ padding: '0.3rem', fontSize: '0.8rem' }}>
                                                <option value="Rawson">Rawson</option>
                                                <option value="Rivadavia">Rivadavia</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={editForm.observations || editForm.category || ''}
                                                onChange={e => type === 'SALES' ? setEditForm({ ...editForm, observations: e.target.value }) : setEditForm({ ...editForm, category: e.target.value })}
                                                style={{ padding: '0.3rem', fontSize: '0.8rem' }}
                                            />
                                        </td>
                                        <td><input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })} style={{ padding: '0.3rem', fontSize: '0.8rem', textAlign: 'right' }} /></td>
                                        <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '0.5rem' }}>
                                            <button onClick={saveEdit} style={{ padding: '0.3rem', background: '#4ade80', color: 'black' }}><Check size={14} /></button>
                                            <button onClick={cancelEdit} style={{ padding: '0.3rem', background: '#333', color: 'white' }}><X size={14} /></button>
                                        </td>
                                    </>
                                ) : (
                                    // VIEW MODE ROW
                                    <>
                                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{t.date ? new Date(t.date).toLocaleDateString() : '-'}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                background: t.branch === 'Rawson' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                color: t.branch === 'Rawson' ? '#4ade80' : '#3b82f6'
                                            }}>
                                                {t.branch?.substring(0, 3).toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.5rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {type === 'SALES' ? t.observations : (
                                                <span style={{ color: '#facc15' }}>{t.category}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>${t.amount?.toLocaleString()}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                <button onClick={() => startEdit(t)} style={{ background: 'transparent', padding: '0', color: '#999' }}><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(t.id)} style={{ background: 'transparent', padding: '0', color: '#ef4444' }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {transactions.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No hay movimientos recientes</div>}
            </div>
        </div>
    );
}
