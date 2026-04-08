
'use client';

import { useState, useEffect } from 'react';
import NewClientForm from '@/components/NewClientForm';
import ClientsExcelImporter from '@/components/ClientsExcelImporter';
import EditClientModal from '@/components/EditClientModal';
import { Trophy, AlertTriangle, Users, Search } from 'lucide-react';
import Link from 'next/link';
import { TierBadge } from '@/utils/tiers';

interface Client {
    id: number;
    name: string;
    phone: string;
    coin_balance: number;
    debt_balance: number;
    observations?: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [topCoins, setTopCoins] = useState<Client[]>([]);
    const [topDebt, setTopDebt] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [showImporter, setShowImporter] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const [allRes, coinsRes, debtRes] = await Promise.all([
                fetch('/api/clients?limit=10000'),
                fetch('/api/clients?sort=coins&limit=5'),
                fetch('/api/clients?sort=debt&limit=5')
            ]);

            const [allData, coinsData, debtData] = await Promise.all([
                allRes.json(),
                coinsRes.json(),
                debtRes.json()
            ]);

            setClients(allData.clients || []);
            setTopCoins(coinsData.clients || []);
            setTopDebt(debtData.clients || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleSuccess = () => {
        fetchClients();
        setShowImporter(false);
    };

    const filteredClients = clients.filter(c => {
        const term = searchTerm.toLowerCase();
        const nameMatch = c.name?.toLowerCase().includes(term);
        // Normalize phone: strip non-digits so "2645438114" matches "+5492645438114"
        const searchDigits = searchTerm.replace(/\D/g, '');
        const phoneDigits = (c.phone || '').replace(/\D/g, '');
        const phoneMatch = searchDigits.length > 0 && phoneDigits.includes(searchDigits);
        return nameMatch || phoneMatch;
    });

    return (
        <div className="page-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        Clientes
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gestión de base de datos</p>
                </div>

                <button
                    onClick={() => setShowImporter(!showImporter)}
                    className="secondary"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem' }}
                >
                    📁 {showImporter ? 'Ocultar' : 'Importar Excel'}
                </button>
            </header>

            {/* Excel Importer (Conditional) */}
            {showImporter && (
                <div style={{ marginBottom: '2rem' }}>
                    <ClientsExcelImporter onSuccess={handleSuccess} />
                </div>
            )}

            <div className="grid-layout" style={{ gridTemplateColumns: '35% 65%', gap: '2rem', alignItems: 'start' }}>

                {/* Left Column: New Client Form */}
                <div>
                    <NewClientForm onSuccess={handleSuccess} />
                </div>

                {/* Right Column: Stats & Lists */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Top Stats Cards */}
                    <div className="grid-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Top Coins */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Trophy size={20} color="#facc15" />
                                <h4 style={{ fontSize: '1rem', color: '#facc15' }}>Top Vyper Coins</h4>
                            </div>
                            {topCoins.map((c, i) => (
                                <div key={c.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '0.5rem 0',
                                    borderBottom: i < topCoins.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                }}>
                                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {c.name} <TierBadge coins={c.coin_balance} size="sm" />
                                    </span>
                                    <span style={{ fontWeight: 'bold', color: '#facc15' }}>{c.coin_balance} 🪙</span>
                                </div>
                            ))}
                            {topCoins.length === 0 && <p style={{ color: '#666', fontSize: '0.9rem' }}>Sin datos</p>}
                        </div>

                        {/* Top Debt */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <AlertTriangle size={20} color="#ef4444" />
                                <h4 style={{ fontSize: '1rem', color: '#ef4444' }}>Mayor deuda</h4>
                            </div>
                            {topDebt.map((c, i) => (
                                <div key={c.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '0.5rem 0',
                                    borderBottom: i < topDebt.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                }}>
                                    <span style={{ fontSize: '0.9rem' }}>{c.name}</span>
                                    <span style={{ fontWeight: 'bold', color: '#ef4444' }}>${c.debt_balance.toLocaleString()}</span>
                                </div>
                            ))}
                            {topDebt.length === 0 && <p style={{ color: '#666', fontSize: '0.9rem' }}>Sin datos</p>}
                        </div>
                    </div>

                    {/* All Clients List */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={20} />
                                <h4 style={{ fontSize: '1rem' }}>Todos los clientes ({filteredClients.length})</h4>
                            </div>
                            <div style={{ position: 'relative', width: '250px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o teléfono..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{
                                        paddingLeft: '2.5rem',
                                        fontSize: '0.9rem',
                                        margin: 0,
                                        background: 'rgba(255,255,255,0.05)'
                                    }}
                                />
                            </div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '1rem', fontStyle: 'italic' }}>
                            💡 Haz clic en cualquier cliente para editar o eliminar
                        </p>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: '#ffffff', color: '#111' }}>
                                        <th style={{ padding: '0.75rem 0.5rem', color: '#111' }}>Nombre</th>
                                        <th style={{ padding: '0.75rem 0.5rem', color: '#111' }}>Teléfono</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#111' }}>Coins</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#111' }}>Deuda</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map(c => (
                                        <tr
                                            key={c.id}
                                            onClick={() => setSelectedClient(c)}
                                            style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '0.75rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {c.name} <TierBadge coins={c.coin_balance} size="sm" />
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{c.phone}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#facc15' }}>{c.coin_balance}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: c.debt_balance > 0 ? '#ef4444' : '#4ade80' }}>
                                                ${c.debt_balance.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredClients.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                    {searchTerm ? 'No se encontraron resultados' : 'No hay clientes registrados'}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Edit Client Modal */}
            {selectedClient && (
                <EditClientModal
                    client={selectedClient}
                    onClose={() => setSelectedClient(null)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
