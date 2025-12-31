
'use client';

import { useState } from 'react';
import SalesForm from '@/components/SalesForm';
import ExpensesForm from '@/components/ExpensesForm';
import RecentTransactions from '@/components/RecentTransactions';
import ExcelImporter from '@/components/ExcelImporter';
import { Upload } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
    const [view, setView] = useState<'SALES' | 'EXPENSES'>('SALES');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showImporter, setShowImporter] = useState(false);

    const handleSuccess = () => {
        alert(view === 'SALES' ? 'Venta guardada' : 'Gasto guardado');
        setRefreshTrigger(prev => prev + 1);
        setShowImporter(false);
    };

    return (
        <div className="page-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        Vyper Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Panel de control financiero</p>
                </div>

                <div className="nav-pill-container">
                    <Link href="/tutorial" passHref>
                        <button className="nav-pill-button help">
                            📚 Ayuda
                        </button>
                    </Link>
                    <Link href="/admin/vyper-coins" passHref>
                        <button className="nav-pill-button">
                            🪙 Vyper Coins
                        </button>
                    </Link>
                    <Link href="/admin/debt" passHref>
                        <button className="nav-pill-button">
                            💳 Cta Cte
                        </button>
                    </Link>
                    <Link href="/admin/clients" passHref>
                        <button className="nav-pill-button">
                            👥 Clientes
                        </button>
                    </Link>
                    <Link href="/admin/bi" passHref>
                        <button className="nav-pill-button">
                            📊 Analytics
                        </button>
                    </Link>
                    <Link href="/admin/competitors" passHref>
                        <button className="nav-pill-button">
                            ⚔️ Competencia
                        </button>
                    </Link>
                    <Link href="/" passHref>
                        <button className="nav-pill-button" style={{ color: '#ef4444' }}>
                            Salir
                        </button>
                    </Link>
                </div>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div className="nav-pill-container" style={{ padding: '0.4rem' }}>
                    <button
                        onClick={() => setView('SALES')}
                        className={`nav-pill-button ${view === 'SALES' ? 'active' : ''}`}
                        style={{ width: '140px', justifyContent: 'center' }}
                    >
                        Ventas
                    </button>
                    <button
                        onClick={() => setView('EXPENSES')}
                        className={`nav-pill-button ${view === 'EXPENSES' ? 'active' : ''}`}
                        style={{ width: '140px', justifyContent: 'center' }}
                    >
                        Egresos
                    </button>
                </div>

                <button
                    onClick={() => setShowImporter(!showImporter)}
                    className="secondary"
                    style={{
                        padding: '0.5rem 1.5rem',
                        fontSize: '0.9rem',
                        borderColor: showImporter ? '#4ade80' : '#a5b4fc',
                        color: showImporter ? '#4ade80' : '#a5b4fc',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Upload size={18} />
                    {showImporter ? 'Cerrar importador' : 'Importar Excel'}
                </button>
            </div>

            {/* Excel Importer */}
            {showImporter && (
                <div style={{ marginBottom: '2rem' }}>
                    <ExcelImporter type={view} onSuccess={handleSuccess} />
                </div>
            )}

            <div className="grid-layout" style={{ gridTemplateColumns: '40% 60%', alignItems: 'start' }}>
                {/* Left Col: Manual Entry Form */}
                <div>
                    {view === 'SALES' ? (
                        <SalesForm onSuccess={handleSuccess} />
                    ) : (
                        <ExpensesForm onSuccess={handleSuccess} />
                    )}
                </div>

                {/* Right Col: Recent Transactions & Editing */}
                <div style={{ height: '600px' }}>
                    <RecentTransactions type={view} refreshTrigger={refreshTrigger} />
                </div>
            </div>

        </div>
    );
}
