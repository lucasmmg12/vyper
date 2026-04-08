
'use client';

import { useState } from 'react';
import SalesForm from '@/components/SalesForm';
import ExpensesForm from '@/components/ExpensesForm';
import RecentTransactions from '@/components/RecentTransactions';
import ExcelImporter from '@/components/ExcelImporter';
import { Upload, Send } from 'lucide-react';
import DailySummaryModal from '@/components/DailySummaryModal';

export default function AdminPage() {
    const [view, setView] = useState<'SALES' | 'EXPENSES'>('SALES');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showImporter, setShowImporter] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    const handleSuccess = () => {
        alert(view === 'SALES' ? 'Venta guardada' : 'Gasto guardado');
        setRefreshTrigger(prev => prev + 1);
        setShowImporter(false);
    };

    return (
        <>
            <div className="page-container">
                {/* Tabs & Actions */}
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

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setShowSummaryModal(true)}
                            className="btn-green"
                            style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.8125rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem'
                            }}
                        >
                            <Send size={14} />
                            Resumen Diario
                        </button>

                        <button
                            onClick={() => setShowImporter(!showImporter)}
                            className="secondary"
                            style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.8125rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem'
                            }}
                        >
                            <Upload size={14} />
                            {showImporter ? 'Cerrar' : 'Importar Excel'}
                        </button>
                    </div>
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

            {/* Daily Summary Modal */}
            <DailySummaryModal
                isOpen={showSummaryModal}
                onClose={() => setShowSummaryModal(false)}
            />
        </>
    );
}
