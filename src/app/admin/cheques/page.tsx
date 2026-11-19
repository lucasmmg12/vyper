'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plus,
    Search,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    Zap,
    FileText,
    Camera,
    RotateCcw,
    Pencil,
    Trash2,
    X,
    Building2,
    Calendar,
    AlertTriangle,
    Download,
    Eye,
    Loader2,
    Check,
} from 'lucide-react';
import { showVyperToast } from '@/components/CommandPalette';

interface ChequeItem {
    id: string;
    nro_cheque: string;
    banco: string;
    direccion: 'emitido' | 'recibido';
    tipo: 'fisico' | 'echeq';
    razon_social_emisora: string;
    beneficiario: string;
    factura_asociada?: string;
    monto: number;
    fecha_emision: string;
    fecha_vencimiento: string;
    estado: 'pendiente' | 'pagado';
    scan_url?: string | null;
    notas?: string;
    created_at: string;
    updated_at: string;
}

const BANCOS_SUGERIDOS = [
    'Banco San Juan',
    'Banco Santander',
    'Banco Galicia',
    'BBVA',
    'Banco Macro',
    'Banco Nación',
    'Banco Provincia',
    'Banco Credicoop',
    'ICBC',
    'Banco Patagonia',
];

function formatArsCurrency(val: number): string {
    return (
        '$ ' +
        Number(val || 0).toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

function formatShortVtoLabel(dateStr: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

export default function AdminChequesPage() {
    const [cheques, setCheques] = useState<ChequeItem[]>([]);
    const [razonesSociales, setRazonesSociales] = useState<string[]>([
        'VYPER LABS',
        'ECAR SAS',
        'CARLOS ADOLFO REGALADO',
        'LUCAS MARINERO',
    ]);
    const [facturasDisponibles, setFacturasDisponibles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter state (matching Photo 2)
    const [statusFilter, setStatusFilter] = useState<
        'todos' | 'pagados' | 'pendientes' | 'emitidos' | 'recibidos'
    >('todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [razonFilter, setRazonFilter] = useState('TODAS');
    const [beneficiarioFilter, setBeneficiarioFilter] = useState('TODOS');

    // Modal Registro Manual / Edición (matching Photo 3)
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formDireccion, setFormDireccion] = useState<'emitido' | 'recibido'>('emitido');
    const [formNroCheque, setFormNroCheque] = useState('');
    const [formBanco, setFormBanco] = useState('Banco San Juan');
    const [formRazonSocial, setFormRazonSocial] = useState('VYPER LABS');
    const [formBeneficiario, setFormBeneficiario] = useState('');
    const [formFactura, setFormFactura] = useState('');
    const [formMonto, setFormMonto] = useState('');
    const [formTipo, setFormTipo] = useState<'fisico' | 'echeq'>('fisico');
    const [formFechaEmision, setFormFechaEmision] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [formFechaVto, setFormFechaVto] = useState('');
    const [formScanUrl, setFormScanUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Inline / Modal creation of Razón Social Emisora
    const [showInlineNewRazon, setShowInlineNewRazon] = useState(false);
    const [newRazonInput, setNewRazonInput] = useState('');
    const [showRazonesManager, setShowRazonesManager] = useState(false);

    // Scan upload & preview
    const [uploadingScanId, setUploadingScanId] = useState<string | null>(null);
    const [previewScanUrl, setPreviewScanUrl] = useState<string | null>(null);
    const scanInputRef = useRef<HTMLInputElement>(null);
    const modalScanInputRef = useRef<HTMLInputElement>(null);
    const [targetScanChequeId, setTargetScanChequeId] = useState<string | null>(null);

    const fetchChequesData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch('/api/cheques');
            const data = await res.json();
            if (data.cheques) setCheques(data.cheques);
            if (data.razonesSociales) setRazonesSociales(data.razonesSociales);
            if (data.facturasDisponibles) setFacturasDisponibles(data.facturasDisponibles);
        } catch (err) {
            console.error('Error cargando cheques:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchChequesData();
    }, []);

    const openNewChequeModal = () => {
        setEditingId(null);
        setFormDireccion('emitido');
        setFormNroCheque('');
        setFormBanco('Banco San Juan');
        setFormRazonSocial(razonesSociales[0] || 'VYPER LABS');
        setFormBeneficiario('');
        setFormFactura('');
        setFormMonto('');
        setFormTipo('fisico');
        setFormFechaEmision(new Date().toISOString().slice(0, 10));
        setFormFechaVto('');
        setFormScanUrl(null);
        setShowInlineNewRazon(false);
        setShowModal(true);
    };

    const openEditChequeModal = (chq: ChequeItem) => {
        setEditingId(chq.id);
        setFormDireccion(chq.direccion);
        setFormNroCheque(chq.nro_cheque);
        setFormBanco(chq.banco);
        setFormRazonSocial(chq.razon_social_emisora || razonesSociales[0] || 'VYPER LABS');
        setFormBeneficiario(chq.beneficiario || '');
        setFormFactura(chq.factura_asociada || '');
        setFormMonto(String(chq.monto));
        setFormTipo(chq.tipo);
        setFormFechaEmision(chq.fecha_emision || new Date().toISOString().slice(0, 10));
        setFormFechaVto(chq.fecha_vencimiento || '');
        setFormScanUrl(chq.scan_url || null);
        setShowInlineNewRazon(false);
        setShowModal(true);
    };

    const handleAddRazonSocial = async () => {
        const clean = newRazonInput.trim().toUpperCase();
        if (!clean) return;
        try {
            const res = await fetch('/api/cheques', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_razon_social', nombre: clean }),
            });
            const data = await res.json();
            if (data.razonesSociales) {
                setRazonesSociales(data.razonesSociales);
                setFormRazonSocial(clean);
            }
            setNewRazonInput('');
            setShowInlineNewRazon(false);
            showVyperToast(`✅ Razón social "${clean}" agregada`);
        } catch {
            showVyperToast('Error guardando razón social', 'error');
        }
    };

    const handleDeleteRazonSocial = async (nombre: string) => {
        try {
            const res = await fetch('/api/cheques', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_razon_social', nombre }),
            });
            const data = await res.json();
            if (data.razonesSociales) {
                setRazonesSociales(data.razonesSociales);
            }
            showVyperToast(`Razón social "${nombre}" eliminada`);
        } catch {
            showVyperToast('Error eliminando razón social', 'error');
        }
    };

    const handleSaveCheque = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formNroCheque.trim() || !formMonto || !formFechaVto) {
            showVyperToast('Completá Nro. de Cheque, Monto y Vencimiento', 'error');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/cheques', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save',
                    id: editingId || undefined,
                    direccion: formDireccion,
                    nro_cheque: formNroCheque.trim(),
                    banco: formBanco.trim() || 'Banco San Juan',
                    razon_social_emisora: formRazonSocial,
                    beneficiario: formBeneficiario.trim(),
                    factura_asociada: formFactura,
                    monto: Number(formMonto),
                    tipo: formTipo,
                    fecha_emision: formFechaEmision,
                    fecha_vencimiento: formFechaVto,
                    scan_url: formScanUrl,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'Error guardando cheque');
            }
            setShowModal(false);
            await fetchChequesData(true);
            showVyperToast(
                editingId ? '✅ Cheque actualizado correctamente' : '✅ Cheque registrado correctamente'
            );
        } catch (err: any) {
            showVyperToast(err?.message || 'Error guardando cheque', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleEstado = async (chq: ChequeItem) => {
        try {
            await fetch('/api/cheques', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'toggle_estado', id: chq.id }),
            });
            await fetchChequesData(true);
            showVyperToast(
                chq.estado === 'pagado'
                    ? `Cheque #${chq.nro_cheque} marcado como Pendiente`
                    : `✓ Cheque #${chq.nro_cheque} marcado como ${
                          chq.direccion === 'emitido' ? 'PAGADO' : 'COBRADO'
                      }`
            );
        } catch {
            showVyperToast('Error cambiando estado del cheque', 'error');
        }
    };

    const handleDeleteCheque = async (chq: ChequeItem) => {
        if (!confirm(`¿Eliminar el cheque #${chq.nro_cheque} (${formatArsCurrency(chq.monto)})?`))
            return;
        try {
            await fetch('/api/cheques', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id: chq.id }),
            });
            await fetchChequesData(true);
            showVyperToast(`Cheque #${chq.nro_cheque} eliminado`);
        } catch {
            showVyperToast('Error eliminando cheque', 'error');
        }
    };

    const handleUploadScanForRow = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !targetScanChequeId) return;
        setUploadingScanId(targetScanChequeId);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const upRes = await fetch('/api/crm/media', { method: 'POST', body: fd });
            const upData = await upRes.json();
            if (!upRes.ok || !upData.url) throw new Error(upData.error || 'Error subiendo imagen');

            await fetch('/api/cheques', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_scan',
                    id: targetScanChequeId,
                    scan_url: upData.url,
                }),
            });
            await fetchChequesData(true);
            showVyperToast('📷 Escaneo del cheque adjuntado');
        } catch (err: any) {
            showVyperToast(err?.message || 'Error subiendo escaneo', 'error');
        } finally {
            setUploadingScanId(null);
            setTargetScanChequeId(null);
            if (scanInputRef.current) scanInputRef.current.value = '';
        }
    };

    const handleUploadScanInModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingScanId('modal');
        try {
            const fd = new FormData();
            fd.append('file', file);
            const upRes = await fetch('/api/crm/media', { method: 'POST', body: fd });
            const upData = await upRes.json();
            if (!upRes.ok || !upData.url) throw new Error(upData.error || 'Error subiendo archivo');
            setFormScanUrl(upData.url);
            showVyperToast('📷 Imagen del cheque cargada');
        } catch (err: any) {
            showVyperToast(err?.message || 'Error subiendo archivo', 'error');
        } finally {
            setUploadingScanId(null);
            if (modalScanInputRef.current) modalScanInputRef.current.value = '';
        }
    };

    // Counts for Filter Pills (Photo 2)
    const counts = useMemo(() => {
        return {
            todos: cheques.length,
            pagados: cheques.filter(c => c.estado === 'pagado').length,
            pendientes: cheques.filter(c => c.estado === 'pendiente').length,
            emitidos: cheques.filter(c => c.direccion === 'emitido').length,
            recibidos: cheques.filter(c => c.direccion === 'recibido').length,
        };
    }, [cheques]);

    // Financial KPIs
    const kpis = useMemo(() => {
        const emitidosPendientes = cheques
            .filter(c => c.direccion === 'emitido' && c.estado === 'pendiente')
            .reduce((acc, c) => acc + Number(c.monto || 0), 0);

        const emitidosPagados = cheques
            .filter(c => c.direccion === 'emitido' && c.estado === 'pagado')
            .reduce((acc, c) => acc + Number(c.monto || 0), 0);

        const recibidosCobrados = cheques
            .filter(c => c.direccion === 'recibido' && c.estado === 'pagado')
            .reduce((acc, c) => acc + Number(c.monto || 0), 0);

        const recibidosPendientes = cheques
            .filter(c => c.direccion === 'recibido' && c.estado === 'pendiente')
            .reduce((acc, c) => acc + Number(c.monto || 0), 0);

        // Agrupación por beneficiario para vista rápida de lotes (GENETIC, SCIMMIA, PAVE, ANGACO, etc.)
        const byBeneficiario: Record<string, { total: number; count: number }> = {};
        cheques
            .filter(c => c.estado === 'pendiente')
            .forEach(c => {
                const key = (c.beneficiario || 'SIN BENEFICIARIO').toUpperCase();
                if (!byBeneficiario[key]) byBeneficiario[key] = { total: 0, count: 0 };
                byBeneficiario[key].total += Number(c.monto || 0);
                byBeneficiario[key].count += 1;
            });

        return {
            emitidosPendientes,
            emitidosPagados,
            recibidosCobrados,
            recibidosPendientes,
            byBeneficiario,
        };
    }, [cheques]);

    // Próximos a vencer (pending cheques sorted by due date)
    const upcomingAlerts = useMemo(() => {
        return cheques
            .filter(c => c.estado === 'pendiente')
            .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
            .slice(0, 3);
    }, [cheques]);

    // Filtered list for table
    const filteredCheques = useMemo(() => {
        return cheques.filter(c => {
            if (statusFilter === 'pagados' && c.estado !== 'pagado') return false;
            if (statusFilter === 'pendientes' && c.estado !== 'pendiente') return false;
            if (statusFilter === 'emitidos' && c.direccion !== 'emitido') return false;
            if (statusFilter === 'recibidos' && c.direccion !== 'recibido') return false;

            if (razonFilter !== 'TODAS' && c.razon_social_emisora !== razonFilter) return false;
            if (
                beneficiarioFilter !== 'TODOS' &&
                (c.beneficiario || 'SIN BENEFICIARIO').toUpperCase() !== beneficiarioFilter
            )
                return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                (c.nro_cheque || '').toLowerCase().includes(q) ||
                (c.banco || '').toLowerCase().includes(q) ||
                (c.beneficiario || '').toLowerCase().includes(q) ||
                (c.razon_social_emisora || '').toLowerCase().includes(q) ||
                (c.factura_asociada || '').toLowerCase().includes(q)
            );
        });
    }, [cheques, statusFilter, razonFilter, beneficiarioFilter, searchQuery]);

    const totalEnVista = useMemo(
        () => filteredCheques.reduce((acc, c) => acc + Number(c.monto || 0), 0),
        [filteredCheques]
    );

    return (
        <div className="page-container" style={{ maxWidth: '100%', padding: '1.5rem 2rem' }}>
            {/* Hidden file input for row scan upload */}
            <input
                ref={scanInputRef}
                type="file"
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={handleUploadScanForRow}
            />

            {/* Header */}
            <header
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                }}
            >
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                        Cheques y eCheqs
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
                        Control de cheques emitidos (a pagar) y recibidos (a cobrar) por Razón Social Emisora
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => setShowRazonesManager(true)}
                        className="secondary"
                        style={{
                            padding: '0.6rem 1rem',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            borderColor: '#111111',
                            color: '#111111',
                            minHeight: 'auto',
                        }}
                    >
                        <Building2 size={15} /> Razones Sociales ({razonesSociales.length})
                    </button>

                    <button
                        type="button"
                        onClick={openNewChequeModal}
                        style={{
                            padding: '0.6rem 1.15rem',
                            fontSize: '0.8125rem',
                            fontWeight: 800,
                            background: '#111111',
                            color: '#FFFFFF',
                            minHeight: 'auto',
                        }}
                    >
                        <Plus size={16} /> Registrar Cheque
                    </button>
                </div>
            </header>

            {/* ═══════════ BANNER DE PRÓXIMOS VENCIMIENTOS (COMO FOTO 3 FONDO) ═══════════ */}
            {upcomingAlerts.length > 0 && (
                <div
                    style={{
                        marginBottom: '1.25rem',
                        padding: '0.9rem 1.15rem',
                        borderRadius: 14,
                        background: '#111111',
                        color: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.55rem',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#D1D5DB',
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={14} color="#FBBF24" /> Próximos Vencimientos Pendientes
                        </span>
                        <span>Total Pendiente a Pagar: {formatArsCurrency(kpis.emitidosPendientes)}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.6rem' }}>
                        {upcomingAlerts.map(al => (
                            <div
                                key={al.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 10,
                                    padding: '0.6rem 0.85rem',
                                    borderRadius: 10,
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.14)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                    <span style={{ fontWeight: 900, fontSize: '0.925rem', whiteSpace: 'nowrap' }}>
                                        {formatArsCurrency(al.monto)}
                                    </span>
                                    <span
                                        style={{
                                            padding: '0.15rem 0.45rem',
                                            borderRadius: 5,
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            background: al.direccion === 'emitido' ? '#991B1B' : '#1E40AF',
                                            color: '#FFFFFF',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {al.direccion === 'emitido' ? '↑ Pagar' : '↓ Cobrar'}
                                    </span>
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: '0.775rem',
                                                fontWeight: 800,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {al.beneficiario || 'SIN BENEFICIARIO'} ({al.razon_social_emisora})
                                        </div>
                                        <div style={{ fontSize: '0.675rem', color: '#9CA3AF' }}>
                                            #{al.nro_cheque} · {al.banco} · Vto: {formatShortVtoLabel(al.fecha_vencimiento)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleToggleEstado(al)}
                                    title="Marcar como Pagado / Efectivizado"
                                    style={{
                                        padding: '0.28rem 0.55rem',
                                        fontSize: '0.675rem',
                                        fontWeight: 800,
                                        borderRadius: 6,
                                        background: '#FFFFFF',
                                        color: '#111111',
                                        minHeight: 'auto',
                                        boxShadow: 'none',
                                        flexShrink: 0,
                                    }}
                                >
                                    ✓ Cumplir
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════ KPI CARDS & LOTES POR BENEFICIARIO ═══════════ */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                }}
            >
                <div
                    className="glass-card"
                    style={{
                        padding: '1.15rem 1.35rem',
                        border: '1px solid #E5E7EB',
                        borderRadius: 14,
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#6B7280',
                            marginBottom: 4,
                        }}
                    >
                        ↗ PENDIENTES A PAGAR (EMITIDOS)
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#991B1B' }}>
                        {formatArsCurrency(kpis.emitidosPendientes)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                        Efectivizados / Pagados: <strong>{formatArsCurrency(kpis.emitidosPagados)}</strong>
                    </div>
                </div>

                <div
                    className="glass-card"
                    style={{
                        padding: '1.15rem 1.35rem',
                        border: '1px solid #E5E7EB',
                        borderRadius: 14,
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#6B7280',
                            marginBottom: 4,
                        }}
                    >
                        ↙ COBRADOS / A COBRAR (RECIBIDOS)
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1E40AF' }}>
                        {formatArsCurrency(kpis.recibidosCobrados + kpis.recibidosPendientes)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                        Acreditados: <strong>{formatArsCurrency(kpis.recibidosCobrados)}</strong> · En cartera:{' '}
                        <strong>{formatArsCurrency(kpis.recibidosPendientes)}</strong>
                    </div>
                </div>

                <div
                    className="glass-card"
                    style={{
                        padding: '1.15rem 1.35rem',
                        border: '1px solid #E5E7EB',
                        borderRadius: 14,
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#6B7280',
                            marginBottom: 6,
                        }}
                    >
                        📋 PENDIENTE POR DESTINATARIO (CLIC PARA FILTRAR)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <button
                            type="button"
                            onClick={() => setBeneficiarioFilter('TODOS')}
                            style={{
                                padding: '0.25rem 0.55rem',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                borderRadius: 6,
                                background: beneficiarioFilter === 'TODOS' ? '#111111' : '#F3F4F6',
                                color: beneficiarioFilter === 'TODOS' ? '#FFFFFF' : '#374151',
                                minHeight: 'auto',
                                boxShadow: 'none',
                            }}
                        >
                            Todos
                        </button>
                        {Object.entries(kpis.byBeneficiario).map(([ben, info]) => {
                            const active = beneficiarioFilter === ben;
                            return (
                                <button
                                    key={ben}
                                    type="button"
                                    onClick={() =>
                                        setBeneficiarioFilter(active ? 'TODOS' : ben)
                                    }
                                    style={{
                                        padding: '0.25rem 0.55rem',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        borderRadius: 6,
                                        background: active ? '#111111' : '#F3F4F6',
                                        color: active ? '#FFFFFF' : '#111111',
                                        border: '1px solid #E5E7EB',
                                        minHeight: 'auto',
                                        boxShadow: 'none',
                                    }}
                                >
                                    {ben} ({info.count}): {formatArsCurrency(info.total)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ═══════════ BARRA DE PÍLDORAS DE FILTRO (EXACTAMENTE COMO FOTO 2) ═══════════ */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.85rem',
                    marginBottom: '1rem',
                }}
            >
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem',
                        borderRadius: 999,
                        background: '#F3F4F6',
                        border: '1px solid #E5E7EB',
                        overflowX: 'auto',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setStatusFilter('todos')}
                        style={{
                            padding: '0.45rem 1rem',
                            borderRadius: 999,
                            fontSize: '0.8125rem',
                            fontWeight: 800,
                            background: statusFilter === 'todos' ? '#FFFFFF' : 'transparent',
                            color: '#111111',
                            boxShadow:
                                statusFilter === 'todos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            minHeight: 'auto',
                        }}
                    >
                        Todos ({counts.todos})
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter('pagados')}
                        style={{
                            padding: '0.45rem 1rem',
                            borderRadius: 999,
                            fontSize: '0.8125rem',
                            fontWeight: 800,
                            background: statusFilter === 'pagados' ? '#FFFFFF' : 'transparent',
                            color: '#047857',
                            boxShadow:
                                statusFilter === 'pagados' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            minHeight: 'auto',
                        }}
                    >
                        <CheckCircle2 size={14} /> Pagados / Cobrados ({counts.pagados})
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter('pendientes')}
                        style={{
                            padding: '0.45rem 1rem',
                            borderRadius: 999,
                            fontSize: '0.8125rem',
                            fontWeight: 800,
                            background: statusFilter === 'pendientes' ? '#FFFFFF' : 'transparent',
                            color: '#B45309',
                            boxShadow:
                                statusFilter === 'pendientes' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            minHeight: 'auto',
                        }}
                    >
                        <Clock size={14} /> Pendientes ({counts.pendientes})
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter('emitidos')}
                        style={{
                            padding: '0.45rem 1rem',
                            borderRadius: 999,
                            fontSize: '0.8125rem',
                            fontWeight: 800,
                            background: statusFilter === 'emitidos' ? '#FFFFFF' : 'transparent',
                            color: '#B91C1C',
                            boxShadow:
                                statusFilter === 'emitidos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            minHeight: 'auto',
                        }}
                    >
                        <ArrowUpRight size={14} /> Emitidos (A Pagar) ({counts.emitidos})
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter('recibidos')}
                        style={{
                            padding: '0.45rem 1rem',
                            borderRadius: 999,
                            fontSize: '0.8125rem',
                            fontWeight: 800,
                            background: statusFilter === 'recibidos' ? '#FFFFFF' : 'transparent',
                            color: '#1D4ED8',
                            boxShadow:
                                statusFilter === 'recibidos' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            minHeight: 'auto',
                        }}
                    >
                        <ArrowDownLeft size={14} /> Recibidos (A Cobrar) ({counts.recibidos})
                    </button>
                </div>

                {/* Search & Razón Social Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select
                        value={razonFilter}
                        onChange={e => setRazonFilter(e.target.value)}
                        style={{
                            width: 'auto',
                            margin: 0,
                            padding: '0.5rem 0.85rem',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            borderRadius: 10,
                        }}
                    >
                        <option value="TODAS">Todas las Razones Sociales</option>
                        {razonesSociales.map(rs => (
                            <option key={rs} value={rs}>
                                Emisor: {rs}
                            </option>
                        ))}
                    </select>

                    <div style={{ position: 'relative', minWidth: 250 }}>
                        <Search
                            size={15}
                            style={{ position: 'absolute', left: 11, top: 11, color: '#6B7280' }}
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar nro, banco, beneficiario..."
                            style={{
                                margin: 0,
                                paddingLeft: '2.1rem',
                                paddingRight: '0.75rem',
                                paddingTop: '0.5rem',
                                paddingBottom: '0.5rem',
                                fontSize: '0.8125rem',
                                borderRadius: 10,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ═══════════ TABLA: LISTADO DETALLADO DE CHEQUES (EXACTAMENTE COMO FOTO 1) ═══════════ */}
            <div
                style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 16,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                }}
            >
                {/* Table Header Strip */}
                <div
                    style={{
                        padding: '1rem 1.35rem',
                        borderBottom: '1px solid #E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#111111' }}>
                            Listado Detallado de Cheques
                        </h3>
                        <span
                            style={{
                                padding: '0.18rem 0.6rem',
                                borderRadius: 999,
                                background: '#F3F4F6',
                                color: '#4B5563',
                                fontSize: '0.725rem',
                                fontWeight: 700,
                            }}
                        >
                            {filteredCheques.length} registros
                        </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>
                        Total en vista:{' '}
                        <strong style={{ color: '#111111', fontSize: '0.95rem', fontWeight: 900 }}>
                            {formatArsCurrency(totalEnVista)}
                        </strong>
                    </div>
                </div>

                {/* Responsive Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.8125rem',
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: '#F9FAFB',
                                    borderBottom: '1px solid #E5E7EB',
                                    textAlign: 'left',
                                    fontSize: '0.6875rem',
                                    fontWeight: 800,
                                    color: '#6B7280',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                <th style={{ padding: '0.85rem 1.25rem' }}>NRO CHEQUE</th>
                                <th style={{ padding: '0.85rem 1rem' }}>BANCO</th>
                                <th style={{ padding: '0.85rem 1rem' }}>DIRECCIÓN</th>
                                <th style={{ padding: '0.85rem 1rem' }}>TIPO</th>
                                <th style={{ padding: '0.85rem 1rem' }}>BENEFICIARIO / EMISOR</th>
                                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>MONTO ($)</th>
                                <th style={{ padding: '0.85rem 1rem' }}>FECHA VTO</th>
                                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>ESTADO</th>
                                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>SCAN</th>
                                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={10}
                                        style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}
                                    >
                                        Cargando listado de cheques...
                                    </td>
                                </tr>
                            ) : filteredCheques.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={10}
                                        style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}
                                    >
                                        No se encontraron cheques con los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                filteredCheques.map(chq => {
                                    const isEmitido = chq.direccion === 'emitido';
                                    const isPagado = chq.estado === 'pagado';
                                    const isEcheq = chq.tipo === 'echeq';

                                    return (
                                        <tr
                                            key={chq.id}
                                            style={{
                                                borderBottom: '1px solid #F3F4F6',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e =>
                                                (e.currentTarget.style.background = '#FAFAFA')
                                            }
                                            onMouseLeave={e =>
                                                (e.currentTarget.style.background = 'transparent')
                                            }
                                        >
                                            {/* NRO CHEQUE */}
                                            <td
                                                style={{
                                                    padding: '0.95rem 1.25rem',
                                                    fontFamily: 'var(--font-mono)',
                                                    fontWeight: 700,
                                                    color: '#111111',
                                                }}
                                            >
                                                #{chq.nro_cheque}
                                            </td>

                                            {/* BANCO */}
                                            <td
                                                style={{
                                                    padding: '0.95rem 1rem',
                                                    color: '#374151',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {chq.banco}
                                            </td>

                                            {/* DIRECCIÓN */}
                                            <td style={{ padding: '0.95rem 1rem' }}>
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '0.22rem 0.6rem',
                                                        borderRadius: 6,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        background: isEmitido ? '#FEF2F2' : '#EFF6FF',
                                                        color: isEmitido ? '#B91C1C' : '#1D4ED8',
                                                    }}
                                                >
                                                    {isEmitido ? (
                                                        <>↗ Emitido (Pagar)</>
                                                    ) : (
                                                        <>↙ Recibido (Cobrar)</>
                                                    )}
                                                </span>
                                            </td>

                                            {/* TIPO */}
                                            <td style={{ padding: '0.95rem 1rem' }}>
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '0.22rem 0.55rem',
                                                        borderRadius: 6,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        background: isEcheq ? '#EEF2FF' : '#F3F4F6',
                                                        color: isEcheq ? '#4338CA' : '#4B5563',
                                                    }}
                                                >
                                                    {isEcheq ? '⚡ eCheq' : '📄 Físico'}
                                                </span>
                                            </td>

                                            {/* BENEFICIARIO / EMISOR */}
                                            <td style={{ padding: '0.95rem 1rem' }}>
                                                <div
                                                    style={{
                                                        fontWeight: 800,
                                                        color: '#111111',
                                                        fontSize: '0.825rem',
                                                    }}
                                                >
                                                    {chq.beneficiario || 'AL PORTADOR'}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        color: '#6B7280',
                                                        marginTop: 1,
                                                    }}
                                                >
                                                    Emisor: {chq.razon_social_emisora}
                                                    {chq.factura_asociada ? ` · ${chq.factura_asociada}` : ''}
                                                </div>
                                            </td>

                                            {/* MONTO ($) */}
                                            <td
                                                style={{
                                                    padding: '0.95rem 1rem',
                                                    textAlign: 'right',
                                                    fontWeight: 900,
                                                    color: '#111111',
                                                    fontFamily: 'var(--font-mono)',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {formatArsCurrency(chq.monto)}
                                            </td>

                                            {/* FECHA VTO */}
                                            <td
                                                style={{
                                                    padding: '0.95rem 1rem',
                                                    whiteSpace: 'nowrap',
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: '0.78rem',
                                                    color: '#374151',
                                                }}
                                            >
                                                <span>{chq.fecha_vencimiento}</span>
                                                {isPagado ? (
                                                    <span
                                                        style={{
                                                            marginLeft: 6,
                                                            fontSize: '0.675rem',
                                                            fontWeight: 800,
                                                            color: '#059669',
                                                            fontFamily: 'var(--font-main)',
                                                        }}
                                                    >
                                                        ✓ Efectivizado
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            marginLeft: 6,
                                                            fontSize: '0.675rem',
                                                            fontWeight: 700,
                                                            color: '#D97706',
                                                            fontFamily: 'var(--font-main)',
                                                        }}
                                                    >
                                                        · Pendiente
                                                    </span>
                                                )}
                                            </td>

                                            {/* ESTADO */}
                                            <td style={{ padding: '0.95rem 1rem', textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleEstado(chq)}
                                                    style={{
                                                        padding: '0.25rem 0.7rem',
                                                        borderRadius: 999,
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 800,
                                                        background: isPagado ? '#D1FAE5' : '#FEF3C7',
                                                        color: isPagado ? '#065F46' : '#92400E',
                                                        border: isPagado
                                                            ? '1px solid #A7F3D0'
                                                            : '1px solid #FDE68A',
                                                        minHeight: 'auto',
                                                        boxShadow: 'none',
                                                    }}
                                                    title="Clic para cambiar entre Pendiente y Pagado/Cobrado"
                                                >
                                                    {isPagado ? (
                                                        <>
                                                            <CheckCircle2 size={12} />{' '}
                                                            {isEmitido ? 'PAGADO' : 'COBRADO'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock size={12} /> PENDIENTE
                                                        </>
                                                    )}
                                                </button>
                                            </td>

                                            {/* SCAN */}
                                            <td style={{ padding: '0.95rem 0.75rem', textAlign: 'center' }}>
                                                {uploadingScanId === chq.id ? (
                                                    <Loader2 size={15} className="animate-spin" />
                                                ) : chq.scan_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewScanUrl(chq.scan_url!)}
                                                        className="btn-ghost"
                                                        style={{
                                                            padding: 4,
                                                            minHeight: 'auto',
                                                            color: '#2563EB',
                                                        }}
                                                        title="Ver escaneo / foto del cheque"
                                                    >
                                                        <Camera size={16} />
                                                    </button>
                                                ) : (
                                                    <span style={{ color: '#9CA3AF' }}>—</span>
                                                )}
                                            </td>

                                            {/* ACCIONES */}
                                            <td
                                                style={{
                                                    padding: '0.95rem 1.25rem',
                                                    textAlign: 'right',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleEstado(chq)}
                                                        className="btn-ghost"
                                                        style={{ padding: 5, minHeight: 'auto', color: '#6B7280' }}
                                                        title={
                                                            isPagado
                                                                ? 'Volver a Pendiente'
                                                                : 'Marcar como Pagado / Cobrado'
                                                        }
                                                    >
                                                        {isPagado ? (
                                                            <RotateCcw size={14} />
                                                        ) : (
                                                            <Check size={14} />
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => openEditChequeModal(chq)}
                                                        className="btn-ghost"
                                                        style={{ padding: 5, minHeight: 'auto', color: '#6B7280' }}
                                                        title="Editar cheque"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setTargetScanChequeId(chq.id);
                                                            scanInputRef.current?.click();
                                                        }}
                                                        className="btn-ghost"
                                                        style={{ padding: 5, minHeight: 'auto', color: '#6B7280' }}
                                                        title="Subir foto / escaneo del cheque"
                                                    >
                                                        <Camera size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteCheque(chq)}
                                                        className="btn-ghost"
                                                        style={{ padding: 5, minHeight: 'auto', color: '#EF4444' }}
                                                        title="Eliminar cheque"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ═══════════ MODAL: REGISTRO MANUAL / EDICIÓN DE CHEQUE (EXACTAMENTE COMO FOTO 3) ═══════════ */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                        overflowY: 'auto',
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 20,
                            border: '2px solid #111111',
                            maxWidth: 520,
                            width: '100%',
                            padding: '1.75rem',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.28)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '1.15rem',
                            }}
                        >
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                                {editingId ? 'Editar Cheque' : 'Registro Manual'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="btn-ghost"
                                style={{ padding: 4, minHeight: 'auto' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCheque}>
                            {/* Selector Dirección Principal (↑ A Pagar (emitido) / ↓ A Cobrar (recibido)) */}
                            <div style={{ marginBottom: '1rem' }}>
                                <select
                                    value={formDireccion}
                                    onChange={e =>
                                        setFormDireccion(
                                            e.target.value === 'recibido' ? 'recibido' : 'emitido'
                                        )
                                    }
                                    style={{
                                        margin: 0,
                                        border: '2px solid #111111',
                                        borderRadius: 12,
                                        padding: '0.75rem 1rem',
                                        fontWeight: 800,
                                        fontSize: '0.9375rem',
                                        color: '#111111',
                                    }}
                                >
                                    <option value="emitido">↑ A Pagar (emitido)</option>
                                    <option value="recibido">↓ A Cobrar (recibido)</option>
                                </select>
                            </div>

                            {/* Nro. Cheque y Banco */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.75rem',
                                    marginBottom: '0.85rem',
                                }}
                            >
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                        Nro. Cheque
                                    </label>
                                    <input
                                        type="text"
                                        value={formNroCheque}
                                        onChange={e => setFormNroCheque(e.target.value)}
                                        placeholder="Ej: 7186300"
                                        required
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                        Banco
                                    </label>
                                    <input
                                        type="text"
                                        list="bancos-list"
                                        value={formBanco}
                                        onChange={e => setFormBanco(e.target.value)}
                                        placeholder="Ej: Banco San Juan"
                                        required
                                        style={{ marginBottom: 0 }}
                                    />
                                    <datalist id="bancos-list">
                                        {BANCOS_SUGERIDOS.map(b => (
                                            <option key={b} value={b} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            {/* Razón Social Emisora (Dropdown + Crear Nueva) */}
                            <div style={{ marginBottom: '0.85rem' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                        Razón Social Emisora
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowInlineNewRazon(!showInlineNewRazon)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#111111',
                                            fontSize: '0.725rem',
                                            fontWeight: 800,
                                            padding: 0,
                                            minHeight: 'auto',
                                            textDecoration: 'underline',
                                            boxShadow: 'none',
                                        }}
                                    >
                                        {showInlineNewRazon ? 'Cancelar' : '+ Crear nueva razón social'}
                                    </button>
                                </div>

                                {showInlineNewRazon ? (
                                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                        <input
                                            type="text"
                                            value={newRazonInput}
                                            onChange={e => setNewRazonInput(e.target.value)}
                                            placeholder="Nombre de la nueva Razón Social..."
                                            autoFocus
                                            style={{ marginBottom: 0 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddRazonSocial}
                                            style={{
                                                padding: '0.5rem 0.9rem',
                                                background: '#111111',
                                                color: '#FFFFFF',
                                                fontSize: '0.78rem',
                                                minHeight: 'auto',
                                            }}
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        value={formRazonSocial}
                                        onChange={e => setFormRazonSocial(e.target.value)}
                                        style={{ marginBottom: 0 }}
                                    >
                                        {razonesSociales.map(rs => (
                                            <option key={rs} value={rs}>
                                                {rs}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Beneficiario (opcional) */}
                            <div style={{ marginBottom: '0.85rem' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                    Beneficiario{' '}
                                    <span style={{ color: '#9CA3AF', fontWeight: 500 }}>
                                        (opcional)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={formBeneficiario}
                                    onChange={e => setFormBeneficiario(e.target.value)}
                                    placeholder="Podés dejarlo vacío (ej: SCIMMIA, GENETIC, PAVE, ANGACO)"
                                    style={{ marginBottom: 0 }}
                                />
                            </div>

                            {/* Asociar a Factura (Opcional) */}
                            <div style={{ marginBottom: '0.85rem' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                    Asociar a Factura (Opcional)
                                </label>
                                <select
                                    value={formFactura}
                                    onChange={e => setFormFactura(e.target.value)}
                                    style={{ marginBottom: 0 }}
                                >
                                    <option value="">Seleccionar factura (Opcional)</option>
                                    {facturasDisponibles.map((f: any) => (
                                        <option
                                            key={f.id}
                                            value={`${f.proveedor || 'Compra'} ${
                                                f.numero_factura ? '#' + f.numero_factura : ''
                                            }`}
                                        >
                                            {f.proveedor || 'Proveedor'}{' '}
                                            {f.numero_factura ? `- Factura #${f.numero_factura}` : ''} ($
                                            {Number(f.total || 0).toLocaleString('es-AR')})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Monto ARS y Tipo */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.75rem',
                                    marginBottom: '0.85rem',
                                }}
                            >
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                        Monto ARS
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formMonto}
                                        onChange={e => setFormMonto(e.target.value)}
                                        placeholder="0.00"
                                        required
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                        Tipo
                                    </label>
                                    <select
                                        value={formTipo}
                                        onChange={e =>
                                            setFormTipo(
                                                e.target.value === 'echeq' ? 'echeq' : 'fisico'
                                            )
                                        }
                                        style={{ marginBottom: 0 }}
                                    >
                                        <option value="fisico">Físico</option>
                                        <option value="echeq">eCheq</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fecha Emisión y Vencimiento */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '0.75rem',
                                    marginBottom: '1rem',
                                }}
                            >
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                        Fecha Emisión
                                    </label>
                                    <input
                                        type="date"
                                        value={formFechaEmision}
                                        onChange={e => setFormFechaEmision(e.target.value)}
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                        Vencimiento
                                    </label>
                                    <input
                                        type="date"
                                        value={formFechaVto}
                                        onChange={e => setFormFechaVto(e.target.value)}
                                        required
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                            </div>

                            {/* Foto / Scan Opcional */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <input
                                    ref={modalScanInputRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    style={{ display: 'none' }}
                                    onChange={handleUploadScanInModal}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button
                                        type="button"
                                        onClick={() => modalScanInputRef.current?.click()}
                                        className="secondary"
                                        style={{
                                            padding: '0.45rem 0.85rem',
                                            fontSize: '0.775rem',
                                            minHeight: 'auto',
                                        }}
                                    >
                                        {uploadingScanId === 'modal' ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Camera size={14} />
                                        )}{' '}
                                        {formScanUrl
                                            ? 'Cambiar Foto / Escaneo'
                                            : 'Adjuntar Foto / Escaneo (Opcional)'}
                                    </button>
                                    {formScanUrl && (
                                        <span
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: '#059669',
                                            }}
                                        >
                                            ✓ Archivo adjuntado
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    borderRadius: 12,
                                    background: '#111111',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.9375rem',
                                }}
                            >
                                {saving
                                    ? 'Guardando...'
                                    : editingId
                                    ? '✓ Guardar Cambios del Cheque'
                                    : '✓ Confirmar y Registrar Cheque'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════ MODAL: GESTOR DE RAZONES SOCIALES EMISORAS ═══════════ */}
            {showRazonesManager && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                    onClick={() => setShowRazonesManager(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#FFFFFF',
                            border: '2px solid #111111',
                            borderRadius: 18,
                            maxWidth: 460,
                            width: '100%',
                            padding: '1.5rem',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem',
                            }}
                        >
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>
                                🏢 Razones Sociales Emisoras
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowRazonesManager(false)}
                                className="btn-ghost"
                                style={{ padding: 4, minHeight: 'auto' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem' }}>
                            Agregá o administrá las Razones Sociales que aparecerán en el menú desplegable al registrar un cheque.
                        </p>

                        <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
                            <input
                                type="text"
                                value={newRazonInput}
                                onChange={e => setNewRazonInput(e.target.value)}
                                placeholder="Ej: VYPER SUPLEMENTOS SRL..."
                                style={{ marginBottom: 0 }}
                            />
                            <button
                                type="button"
                                onClick={handleAddRazonSocial}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#111111',
                                    color: '#FFFFFF',
                                    fontSize: '0.8rem',
                                    minHeight: 'auto',
                                }}
                            >
                                <Plus size={14} /> Agregar
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {razonesSociales.map(rs => (
                                <div
                                    key={rs}
                                    style={{
                                        padding: '0.6rem 0.85rem',
                                        borderRadius: 10,
                                        border: '1px solid #E5E7EB',
                                        background: '#F8F9FA',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#111111' }}>
                                        {rs}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteRazonSocial(rs)}
                                        className="btn-ghost"
                                        style={{ padding: 4, minHeight: 'auto', color: '#EF4444' }}
                                        title="Eliminar razón social"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════ MODAL: PREVISUALIZACIÓN DE ESCANEO / FOTO DEL CHEQUE ═══════════ */}
            {previewScanUrl && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 10010,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                    }}
                    onClick={() => setPreviewScanUrl(null)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 16,
                            border: '2px solid #111111',
                            maxWidth: 880,
                            width: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: '#111111',
                                color: '#FFFFFF',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                                📷 Escaneo / Imagen del Cheque
                            </span>
                            <button
                                type="button"
                                onClick={() => setPreviewScanUrl(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    color: '#FFFFFF',
                                    padding: 4,
                                    borderRadius: 6,
                                    minHeight: 'auto',
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem', textAlign: 'center', background: '#F8F9FA' }}>
                            {previewScanUrl.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={previewScanUrl}
                                    style={{ width: '100%', height: '75vh', border: 'none' }}
                                />
                            ) : (
                                <img
                                    src={previewScanUrl}
                                    alt="Cheque"
                                    style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 8 }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
