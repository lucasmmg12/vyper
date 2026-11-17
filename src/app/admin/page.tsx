'use client';

import { useState, useEffect } from 'react';
import SalesForm from '@/components/SalesForm';
import ExpensesForm from '@/components/ExpensesForm';
import RecentTransactions from '@/components/RecentTransactions';
import ExcelImporter from '@/components/ExcelImporter';
import VyperCrmPanel from '@/components/VyperCrmPanel';
import { Upload, Send, MessageSquare } from 'lucide-react';
import DailySummaryModal from '@/components/DailySummaryModal';
import { showVyperToast } from '@/components/CommandPalette';

export default function AdminPage() {
    const [view, setView] = useState<'SALES' | 'EXPENSES' | 'CRM'>('SALES');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showImporter, setShowImporter] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [unreadCrm, setUnreadCrm] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await fetch('/api/crm');
                const data = await res.json();
                if (typeof data.totalUnread === 'number') {
                    setUnreadCrm(data.totalUnread);
                }
            } catch {
                // ignore
            }
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleSuccess = () => {
        showVyperToast(view === 'SALES' ? '✅ Venta registrada correctamente' : '✅ Egreso registrado correctamente');
        setRefreshTrigger(prev => prev + 1);
        setShowImporter(false);
    };

    return (
        <>
            <div
                className="page-container"
                style={{
                    maxWidth: view === 'CRM' ? '100%' : undefined,
                    padding: view === 'CRM' ? '0.75rem 1rem' : undefined,
                }}
            >
                {/* Tabs & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: view === 'CRM' ? '0.75rem' : '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div className="nav-pill-container" style={{ padding: '0.4rem' }}>
                        <button
                            onClick={() => setView('SALES')}
                            className={`nav-pill-button ${view === 'SALES' ? 'active' : ''}`}
                            style={{ width: '130px', justifyContent: 'center' }}
                        >
                            Ventas
                        </button>
                        <button
                            onClick={() => setView('EXPENSES')}
                            className={`nav-pill-button ${view === 'EXPENSES' ? 'active' : ''}`}
                            style={{ width: '130px', justifyContent: 'center' }}
                        >
                            Egresos
                        </button>
                        <button
                            onClick={() => setView('CRM')}
                            className={`nav-pill-button ${view === 'CRM' ? 'active' : ''}`}
                            style={{
                                minWidth: '145px',
                                justifyContent: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                            }}
                        >
                            <MessageSquare size={15} />
                            Whatsapp
                            {unreadCrm > 0 && (
                                <span
                                    style={{
                                        background: view === 'CRM' ? '#FFFFFF' : '#111111',
                                        color: view === 'CRM' ? '#111111' : '#FFFFFF',
                                        borderRadius: 999,
                                        padding: '0.05rem 0.45rem',
                                        fontSize: '0.675rem',
                                        fontWeight: 900,
                                    }}
                                >
                                    {unreadCrm}
                                </span>
                            )}
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
                                gap: '0.375rem',
                            }}
                        >
                            <Send size={14} />
                            Resumen Diario
                        </button>

                        {view !== 'CRM' && (
                            <button
                                onClick={() => setShowImporter(!showImporter)}
                                className="secondary"
                                style={{
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.8125rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                }}
                            >
                                <Upload size={14} />
                                {showImporter ? 'Cerrar' : 'Importar Excel'}
                            </button>
                        )}
                    </div>
                </div>

                {view === 'CRM' ? (
                    <VyperCrmPanel />
                ) : (
                    <>
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
                    </>
                )}
            </div>

            {/* Daily Summary Modal */}
            <DailySummaryModal
                isOpen={showSummaryModal}
                onClose={() => setShowSummaryModal(false)}
            />
        </>
    );
}
