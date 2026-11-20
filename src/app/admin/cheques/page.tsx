'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plus,
    Search,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    Camera,
    RotateCcw,
    Pencil,
    Trash2,
    X,
    Building2,
    Calendar as CalendarIcon,
    AlertTriangle,
    Loader2,
    Check,
    TrendingDown,
    Bell,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Download,
    Send,
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

const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const MESES_NOMBRES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
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

function formatCompactArs(val: number): string {
    const num = Number(val || 0);
    if (num >= 1_000_000) {
        return `$${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
        return `$${(num / 1_000).toFixed(0)}k`;
    }
    return `$${num.toFixed(0)}`;
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

function getDaysUntil(dateStr: string): number {
    if (!dateStr) return 0;
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return 0;
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function buildGoogleCalendarUrl(chq: ChequeItem): string {
    const dateCompact = (chq.fecha_vencimiento || '').replace(/-/g, '');
    const title = `${chq.direccion === 'emitido' ? 'PAGAR CHEQUE' : 'COBRAR CHEQUE'}: ${
        chq.beneficiario || 'PROVEEDOR'
    } (${formatArsCurrency(chq.monto)})`;
    const details = `Cheque #${chq.nro_cheque} | Banco: ${chq.banco} | Razón Social Emisora: ${
        chq.razon_social_emisora
    } | Tipo: ${chq.tipo.toUpperCase()} | Monto: ${formatArsCurrency(chq.monto)}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        title
    )}&dates=${dateCompact}/${dateCompact}&details=${encodeURIComponent(details)}`;
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

    // Interactive Chart Hover Node
    const [hoveredNodeIdx, setHoveredNodeIdx] = useState<number | null>(null);

    // Google Calendar Month State (default to Nov 2026 or month of first pending cheque)
    const [calYear, setCalYear] = useState<number>(2026);
    const [calMonth, setCalMonth] = useState<number>(10); // 0-indexed: 10 = Noviembre, 11 = Diciembre
    const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);

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

    // WhatsApp Reminder State
    const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
    const [reminderPhone, setReminderPhone] = useState('2645438114');
    const [showReminderModal, setShowReminderModal] = useState(false);

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

    // ═══════════ CURVA DE DESENDEUDAMIENTO (PENDIENTE NEGATIVA) ═══════════
    const burnDownData = useMemo(() => {
        const pendingEmitidos = cheques
            .filter(c => c.direccion === 'emitido' && c.estado === 'pendiente')
            .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento));

        const initialDebt = pendingEmitidos.reduce((acc, c) => acc + Number(c.monto || 0), 0);

        if (pendingEmitidos.length === 0) {
            return {
                initialDebt: 0,
                totalDaysToZero: 0,
                finalDate: '',
                points: [],
            };
        }

        // Group pending cheques by due date
        const byDate = new Map<string, ChequeItem[]>();
        pendingEmitidos.forEach(c => {
            const list = byDate.get(c.fecha_vencimiento) || [];
            list.push(c);
            byDate.set(c.fecha_vencimiento, list);
        });

        const points: {
            date: string;
            label: string;
            daysLeft: number;
            debtBefore: number;
            paidThatDay: number;
            debtRemaining: number;
            pctPaid: number;
            cheques: ChequeItem[];
        }[] = [];

        // Point 0: Hoy (100% deuda actual)
        const todayStr = new Date().toISOString().slice(0, 10);
        points.push({
            date: todayStr,
            label: 'Hoy (Inicio)',
            daysLeft: 0,
            debtBefore: initialDebt,
            paidThatDay: 0,
            debtRemaining: initialDebt,
            pctPaid: 0,
            cheques: [],
        });

        let runningDebt = initialDebt;
        Array.from(byDate.entries()).forEach(([dateStr, items]) => {
            const daySum = items.reduce((s, i) => s + Number(i.monto || 0), 0);
            const before = runningDebt;
            runningDebt = Math.max(0, Number((runningDebt - daySum).toFixed(2)));
            const [, m, d] = dateStr.split('-');
            const daysLeft = getDaysUntil(dateStr);
            points.push({
                date: dateStr,
                label: `${d}/${m}`,
                daysLeft,
                debtBefore: before,
                paidThatDay: daySum,
                debtRemaining: runningDebt,
                pctPaid: initialDebt > 0 ? Math.round(((initialDebt - runningDebt) / initialDebt) * 100) : 100,
                cheques: items,
            });
        });

        const finalDate = points[points.length - 1]?.date || '';
        const totalDaysToZero = Math.max(0, getDaysUntil(finalDate));

        return {
            initialDebt,
            totalDaysToZero,
            finalDate,
            points,
        };
    }, [cheques]);

    // ═══════════ CALENDARIO ESTILO GOOGLE CALENDAR ═══════════
    const calendarGrid = useMemo(() => {
        const firstDayOfMonth = new Date(calYear, calMonth, 1);
        const lastDayOfMonth = new Date(calYear, calMonth + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();

        // Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
        const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

        const cells: {
            day: number | null;
            dateStr: string | null;
            items: ChequeItem[];
            dayTotalEmitido: number;
        }[] = [];

        for (let i = 0; i < startOffset; i++) {
            cells.push({ day: null, dateStr: null, items: [], dayTotalEmitido: 0 });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const mStr = String(calMonth + 1).padStart(2, '0');
            const dStr = String(d).padStart(2, '0');
            const dateStr = `${calYear}-${mStr}-${dStr}`;
            const dayCheques = cheques.filter(c => c.fecha_vencimiento === dateStr);
            const dayTotalEmitido = dayCheques
                .filter(c => c.direccion === 'emitido')
                .reduce((s, c) => s + Number(c.monto || 0), 0);

            cells.push({
                day: d,
                dateStr,
                items: dayCheques,
                dayTotalEmitido,
            });
        }

        while (cells.length % 7 !== 0) {
            cells.push({ day: null, dateStr: null, items: [], dayTotalEmitido: 0 });
        }

        const monthTotalPending = cheques
            .filter(
                c =>
                    c.fecha_vencimiento.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, '0')}`) &&
                    c.direccion === 'emitido' &&
                    c.estado === 'pendiente'
            )
            .reduce((s, c) => s + Number(c.monto || 0), 0);

        return { cells, monthTotalPending };
    }, [cheques, calYear, calMonth]);

    // Months with cheques for quick jump pills in calendar
    const activeMonthsList = useMemo(() => {
        const map = new Map<string, { year: number; month: number; count: number; total: number }>();
        cheques.forEach(c => {
            if (!c.fecha_vencimiento) return;
            const [y, m] = c.fecha_vencimiento.split('-').map(Number);
            if (!y || !m) return;
            const key = `${y}-${String(m).padStart(2, '0')}`;
            const cur = map.get(key) || { year: y, month: m - 1, count: 0, total: 0 };
            cur.count += 1;
            cur.total += Number(c.monto || 0);
            map.set(key, cur);
        });
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, val]) => val);
    }, [cheques]);

    // Export all pending cheques as an .ICS calendar file for Google Calendar / Apple / Outlook
    const handleExportIcsCalendar = () => {
        const pending = cheques.filter(c => c.estado === 'pendiente');
        if (pending.length === 0) {
            showVyperToast('No hay cheques pendientes para exportar', 'error');
            return;
        }
        const lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Vyper Labs//Cheques Calendar//ES',
            'CALSCALE:GREGORIAN',
        ];
        pending.forEach(c => {
            const dt = (c.fecha_vencimiento || '').replace(/-/g, '');
            if (!dt) return;
            lines.push(
                'BEGIN:VEVENT',
                `UID:${c.id}@vyperlabs.com`,
                `DTSTART;VALUE=DATE:${dt}`,
                `DTEND;VALUE=DATE:${dt}`,
                `SUMMARY:${c.direccion === 'emitido' ? 'PAGAR CHEQUE' : 'COBRAR CHEQUE'}: ${
                    c.beneficiario || 'PROVEEDOR'
                } (${formatArsCurrency(c.monto)})`,
                `DESCRIPTION:Cheque #${c.nro_cheque} - Banco: ${c.banco} - Emisor: ${
                    c.razon_social_emisora
                } - Monto: ${formatArsCurrency(c.monto)}`,
                'BEGIN:VALARM',
                'TRIGGER:-PT24H',
                'ACTION:DISPLAY',
                'DESCRIPTION:Recordatorio de vencimiento de cheque mañana',
                'END:VALARM',
                'END:VEVENT'
            );
        });
        lines.push('END:VCALENDAR');

        const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vencimientos_cheques_vyper.ics';
        a.click();
        URL.revokeObjectURL(url);
        showVyperToast('📅 Calendario .ICS descargado (importalo en Google Calendar)');
    };

    const handleSendWhatsAppReminder = async (chequeId?: string) => {
        setSendingReminderId(chequeId || 'all');
        try {
            const res = await fetch('/api/cheques', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_whatsapp_reminder',
                    id: chequeId,
                    phone: reminderPhone,
                }),
            });
            const data = await res.json();
            if (data.ok) {
                showVyperToast(`🔔 Recordatorio enviado por WhatsApp a ${reminderPhone}`);
                setShowReminderModal(false);
            } else {
                showVyperToast(
                    `Aviso registrado (Meta: ${data.error || 'verificá ventana 24h'})`,
                    'info'
                );
            }
        } catch {
            showVyperToast('Error enviando recordatorio por WhatsApp', 'error');
        } finally {
            setSendingReminderId(null);
        }
    };

    const openNewChequeModal = (prefillDate?: string) => {
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
        setFormFechaVto(prefillDate || '');
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
            .slice(0, 4);
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

    const activeHoverNode =
        hoveredNodeIdx !== null && burnDownData.points[hoveredNodeIdx]
            ? burnDownData.points[hoveredNodeIdx]
            : burnDownData.points.length > 1
            ? burnDownData.points[1]
            : null;

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
                    marginBottom: '1.25rem',
                }}
            >
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                        Cheques, Curva de Deuda y Calendario
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
                        Curva de desendeudamiento (pendiente negativa), recordatorios de pago y calendario mensual de vencimientos
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => openNewChequeModal()}
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

            {/* ═══════════ 1. BANNER DE RECORDATORIOS Y PRÓXIMOS VENCIMIENTOS ═══════════ */}
            {upcomingAlerts.length > 0 && (
                <div
                    style={{
                        marginBottom: '1.25rem',
                        padding: '0.95rem 1.2rem',
                        borderRadius: 14,
                        background: '#111111',
                        color: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#D1D5DB',
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle size={14} color="#FBBF24" /> Recordatorios Activos · Próximos Cheques a Cubrir
                        </span>
                        <span>
                            Deuda Total Pendiente: <strong style={{ color: '#FFFFFF' }}>{formatArsCurrency(kpis.emitidosPendientes)}</strong> · Tiempo hasta Deuda $0:{' '}
                            <strong style={{ color: '#10B981' }}>{burnDownData.totalDaysToZero} días ({burnDownData.finalDate})</strong>
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.6rem' }}>
                        {upcomingAlerts.map(al => {
                            const daysLeft = getDaysUntil(al.fecha_vencimiento);
                            const urgencyLabel =
                                daysLeft < 0
                                    ? `Venció hace ${Math.abs(daysLeft)}d`
                                    : daysLeft === 0
                                    ? '¡VENCE HOY!'
                                    : `Faltan ${daysLeft} días`;

                            return (
                                <div
                                    key={al.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 10,
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: 10,
                                        background: 'rgba(255,255,255,0.08)',
                                        border:
                                            daysLeft <= 3
                                                ? '1px solid #FBBF24'
                                                : '1px solid rgba(255,255,255,0.14)',
                                    }}
                                >
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                            <span style={{ fontWeight: 900, fontSize: '0.925rem' }}>
                                                {formatArsCurrency(al.monto)}
                                            </span>
                                            <span
                                                style={{
                                                    padding: '0.12rem 0.45rem',
                                                    borderRadius: 999,
                                                    fontSize: '0.625rem',
                                                    fontWeight: 900,
                                                    background: daysLeft <= 3 ? '#FBBF24' : 'rgba(255,255,255,0.16)',
                                                    color: daysLeft <= 3 ? '#111111' : '#FFFFFF',
                                                }}
                                            >
                                                ⏰ {urgencyLabel}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.775rem',
                                                fontWeight: 800,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {al.beneficiario || 'PROVEEDOR'} ({al.razon_social_emisora})
                                        </div>
                                        <div style={{ fontSize: '0.675rem', color: '#9CA3AF' }}>
                                            #{al.nro_cheque} · {al.banco} · Vto: {formatShortVtoLabel(al.fecha_vencimiento)}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleEstado(al)}
                                            style={{
                                                padding: '0.25rem 0.55rem',
                                                fontSize: '0.675rem',
                                                fontWeight: 800,
                                                borderRadius: 6,
                                                background: '#FFFFFF',
                                                color: '#111111',
                                                minHeight: 'auto',
                                                boxShadow: 'none',
                                            }}
                                        >
                                            ✓ Pagado
                                        </button>
                                        <a
                                            href={buildGoogleCalendarUrl(al)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                padding: '0.2rem 0.45rem',
                                                fontSize: '0.625rem',
                                                fontWeight: 700,
                                                borderRadius: 6,
                                                border: '1px solid rgba(255,255,255,0.3)',
                                                color: '#FFFFFF',
                                                textAlign: 'center',
                                                textDecoration: 'none',
                                            }}
                                            title="Agendar recordatorio en Google Calendar"
                                        >
                                            📅 GCal
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══════════ 2. GRÁFICO DE LÍNEA CON PENDIENTE NEGATIVA (TOTAL ADEUDADO VS TIEMPO) + CALENDARIO GOOGLE ═══════════ */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.5rem',
                }}
            >
                {/* PANEL IZQUIERDO: CURVA DE DESENDEUDAMIENTO (PENDIENTE NEGATIVA) */}
                <div
                    style={{
                        background: '#FFFFFF',
                        border: '2px solid #111111',
                        borderRadius: 16,
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                                marginBottom: '0.85rem',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: 999,
                                        background: '#111111',
                                        color: '#FFFFFF',
                                        fontSize: '0.675rem',
                                        fontWeight: 800,
                                        marginBottom: 4,
                                    }}
                                >
                                    <TrendingDown size={13} /> CURVA DE DESENDEUDAMIENTO (PENDIENTE NEGATIVA)
                                </div>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0 }}>
                                    Total Adeudado vs. Tiempo Restante hasta Deuda $0
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>
                                    A medida que vence y se paga cada cheque, la deuda cae hasta extinguirse el{' '}
                                    <strong>{burnDownData.finalDate || '—'}</strong>.
                                </p>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.675rem', fontWeight: 800, color: '#6B7280' }}>
                                    SALDO ACTUAL A PAGAR
                                </div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#991B1B' }}>
                                    {formatArsCurrency(burnDownData.initialDebt)}
                                </div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669' }}>
                                    ↘ Baja a $0,00 en {burnDownData.totalDaysToZero} días
                                </div>
                            </div>
                        </div>

                        {/* Interactive Negative-Slope Line Chart SVG */}
                        {burnDownData.points.length <= 1 ? (
                            <div
                                style={{
                                    padding: '3rem 1rem',
                                    textAlign: 'center',
                                    color: '#059669',
                                    fontWeight: 800,
                                    background: '#F8F9FA',
                                    borderRadius: 12,
                                }}
                            >
                                🎉 ¡Sin deuda pendiente en cheques! Todos los cheques fueron pagados ($ 0,00).
                            </div>
                        ) : (
                            (() => {
                                const pts = burnDownData.points;
                                const maxDebt = Math.max(burnDownData.initialDebt, 1);
                                const W = 640;
                                const H = 250;
                                const padL = 62;
                                const padR = 26;
                                const padT = 22;
                                const padB = 46;
                                const innerW = W - padL - padR;
                                const innerH = H - padT - padB;

                                const coords = pts.map((p, idx) => {
                                    const x =
                                        padL +
                                        (pts.length > 1
                                            ? (idx / (pts.length - 1)) * innerW
                                            : innerW / 2);
                                    const y =
                                        padT + innerH - (p.debtRemaining / maxDebt) * innerH;
                                    return { x, y, p, idx };
                                });

                                const polylinePoints = coords
                                    .map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
                                    .join(' ');
                                const areaPoints = `${coords[0].x.toFixed(1)},${padT + innerH} ${polylinePoints} ${coords[
                                    coords.length - 1
                                ].x.toFixed(1)},${padT + innerH}`;

                                return (
                                    <div style={{ width: '100%', overflowX: 'auto' }}>
                                        <svg
                                            viewBox={`0 0 ${W} ${H}`}
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                minHeight: 220,
                                                background: '#FAFAFA',
                                                borderRadius: 12,
                                                border: '1px solid #E5E7EB',
                                            }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="vyperBurnDownGrad"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor="#111111"
                                                        stopOpacity="0.22"
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor="#111111"
                                                        stopOpacity="0.02"
                                                    />
                                                </linearGradient>
                                            </defs>

                                            {/* Horizontal Grid Lines (100%, 75%, 50%, 25%, 0%) */}
                                            {[1, 0.75, 0.5, 0.25, 0].map((ratio, i) => {
                                                const yPos = padT + innerH - ratio * innerH;
                                                const val = maxDebt * ratio;
                                                return (
                                                    <g key={i}>
                                                        <line
                                                            x1={padL}
                                                            y1={yPos}
                                                            x2={W - padR}
                                                            y2={yPos}
                                                            stroke="#E5E7EB"
                                                            strokeDasharray={ratio === 0 ? undefined : '4 4'}
                                                            strokeWidth={ratio === 0 ? 1.5 : 1}
                                                        />
                                                        <text
                                                            x={padL - 8}
                                                            y={yPos + 4}
                                                            textAnchor="end"
                                                            fontSize="10"
                                                            fontWeight="700"
                                                            fill="#6B7280"
                                                        >
                                                            {formatCompactArs(val)}
                                                        </text>
                                                    </g>
                                                );
                                            })}

                                            {/* Shaded Area under Negative-Slope Curve */}
                                            <polygon
                                                points={areaPoints}
                                                fill="url(#vyperBurnDownGrad)"
                                            />

                                            {/* Dashed Ideal Reference Line from Peak to $0 */}
                                            <line
                                                x1={coords[0].x}
                                                y1={coords[0].y}
                                                x2={coords[coords.length - 1].x}
                                                y2={coords[coords.length - 1].y}
                                                stroke="#9CA3AF"
                                                strokeWidth="1.5"
                                                strokeDasharray="5 5"
                                            />

                                            {/* Negative-Slope Debt Line */}
                                            <polyline
                                                fill="none"
                                                stroke="#111111"
                                                strokeWidth="3.2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                points={polylinePoints}
                                            />

                                            {/* Data Nodes & X-Axis Labels */}
                                            {coords.map(({ x, y, p, idx }) => {
                                                const isHovered = hoveredNodeIdx === idx;
                                                const isZero = p.debtRemaining === 0;
                                                return (
                                                    <g
                                                        key={idx}
                                                        style={{ cursor: 'pointer' }}
                                                        onMouseEnter={() => setHoveredNodeIdx(idx)}
                                                        onClick={() => {
                                                            setHoveredNodeIdx(idx);
                                                            if (p.date && idx > 0) {
                                                                const [yy, mm] = p.date
                                                                    .split('-')
                                                                    .map(Number);
                                                                if (yy && mm) {
                                                                    setCalYear(yy);
                                                                    setCalMonth(mm - 1);
                                                                    setSelectedCalDate(p.date);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <circle
                                                            cx={x}
                                                            cy={y}
                                                            r={isHovered ? 7 : 5}
                                                            fill={
                                                                isZero
                                                                    ? '#10B981'
                                                                    : isHovered
                                                                    ? '#991B1B'
                                                                    : '#111111'
                                                            }
                                                            stroke="#FFFFFF"
                                                            strokeWidth="2"
                                                        />
                                                        {/* Value label above node */}
                                                        <text
                                                            x={x}
                                                            y={y - 9}
                                                            textAnchor="middle"
                                                            fontSize="9.5"
                                                            fontWeight="800"
                                                            fill={isZero ? '#059669' : '#111111'}
                                                        >
                                                            {formatCompactArs(p.debtRemaining)}
                                                        </text>
                                                        {/* Date label on X-axis */}
                                                        <text
                                                            x={x}
                                                            y={padT + innerH + 16}
                                                            textAnchor="middle"
                                                            fontSize="9.5"
                                                            fontWeight="800"
                                                            fill="#111111"
                                                        >
                                                            {idx === 0 ? 'Hoy' : p.label}
                                                        </text>
                                                        {/* Days remaining sub-label on X-axis */}
                                                        <text
                                                            x={x}
                                                            y={padT + innerH + 29}
                                                            textAnchor="middle"
                                                            fontSize="8.5"
                                                            fontWeight="600"
                                                            fill="#6B7280"
                                                        >
                                                            {idx === 0
                                                                ? '100%'
                                                                : p.daysLeft >= 0
                                                                ? `${p.daysLeft}d`
                                                                : `${p.daysLeft}d`}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                    </div>
                                );
                            })()
                        )}
                    </div>

                    {/* Interactive Inspector Bar below Chart */}
                    {activeHoverNode && (
                        <div
                            style={{
                                marginTop: '0.85rem',
                                padding: '0.75rem 0.95rem',
                                borderRadius: 10,
                                background: '#F8F9FA',
                                border: '1px solid #E5E7EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                fontSize: '0.78rem',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 900, color: '#111111' }}>
                                    📌 Hito: {activeHoverNode.date} (
                                    {activeHoverNode.daysLeft === 0
                                        ? 'Hoy'
                                        : activeHoverNode.daysLeft > 0
                                        ? `Faltan ${activeHoverNode.daysLeft} días`
                                        : `Hace ${Math.abs(activeHoverNode.daysLeft)} días`}
                                    )
                                </div>
                                <div style={{ color: '#4B5563', fontSize: '0.73rem' }}>
                                    {activeHoverNode.cheques.length > 0 ? (
                                        <>
                                            Se pagan:{' '}
                                            <strong>
                                                {activeHoverNode.cheques
                                                    .map(
                                                        c =>
                                                            `${c.beneficiario || 'Cheque'} (${formatArsCurrency(
                                                                c.monto
                                                            )})`
                                                    )
                                                    .join(' + ')}
                                            </strong>
                                        </>
                                    ) : (
                                        'Inicio de la curva con el 100% de los cheques pendientes'
                                    )}
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 700 }}>
                                    DEUDA REMANENTE TRAS ESTE DÍA
                                </div>
                                <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#111111' }}>
                                    {formatArsCurrency(activeHoverNode.debtRemaining)}{' '}
                                    <span style={{ color: '#059669', fontSize: '0.75rem' }}>
                                        ({activeHoverNode.pctPaid}% cancelado)
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* PANEL DERECHO: CALENDARIO MENSUAL ESTILO GOOGLE CALENDAR */}
                <div
                    style={{
                        background: '#FFFFFF',
                        border: '2px solid #111111',
                        borderRadius: 16,
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    }}
                >
                    {/* Calendar Top Controls */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            marginBottom: '0.65rem',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CalendarIcon size={18} />
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0 }}>
                                {MESES_NOMBRES[calMonth]} {calYear}
                            </h3>
                            <span
                                style={{
                                    padding: '0.15rem 0.55rem',
                                    borderRadius: 999,
                                    background: '#FEF2F2',
                                    color: '#991B1B',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                }}
                            >
                                A pagar este mes: {formatArsCurrency(calendarGrid.monthTotalPending)}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button
                                type="button"
                                onClick={() => {
                                    if (calMonth === 0) {
                                        setCalMonth(11);
                                        setCalYear(y => y - 1);
                                    } else {
                                        setCalMonth(m => m - 1);
                                    }
                                }}
                                className="secondary"
                                style={{ padding: '0.3rem 0.5rem', minHeight: 'auto' }}
                                title="Mes anterior"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (calMonth === 11) {
                                        setCalMonth(0);
                                        setCalYear(y => y + 1);
                                    } else {
                                        setCalMonth(m => m + 1);
                                    }
                                }}
                                className="secondary"
                                style={{ padding: '0.3rem 0.5rem', minHeight: 'auto' }}
                                title="Mes siguiente"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Month Jumpers (Nov 2026, Dic 2026, Ene 2027, Feb 2027) */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 5,
                            overflowX: 'auto',
                            paddingBottom: 6,
                            marginBottom: '0.5rem',
                        }}
                    >
                        {activeMonthsList.map(mItem => {
                            const isCurrent =
                                mItem.year === calYear && mItem.month === calMonth;
                            return (
                                <button
                                    key={`${mItem.year}-${mItem.month}`}
                                    type="button"
                                    onClick={() => {
                                        setCalYear(mItem.year);
                                        setCalMonth(mItem.month);
                                    }}
                                    style={{
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: 999,
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        background: isCurrent ? '#111111' : '#F3F4F6',
                                        color: isCurrent ? '#FFFFFF' : '#374151',
                                        whiteSpace: 'nowrap',
                                        minHeight: 'auto',
                                        boxShadow: 'none',
                                    }}
                                >
                                    {MESES_NOMBRES[mItem.month].slice(0, 3)} {mItem.year} ({mItem.count})
                                </button>
                            );
                        })}
                    </div>

                    {/* 7-Column Google Calendar Grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            borderTop: '1px solid #E5E7EB',
                            borderLeft: '1px solid #E5E7EB',
                            borderRadius: 10,
                            overflow: 'hidden',
                            flex: 1,
                        }}
                    >
                        {DIAS_SEMANA.map(dName => (
                            <div
                                key={dName}
                                style={{
                                    padding: '0.35rem',
                                    textAlign: 'center',
                                    fontSize: '0.65rem',
                                    fontWeight: 900,
                                    background: '#111111',
                                    color: '#FFFFFF',
                                    borderRight: '1px solid #374151',
                                }}
                            >
                                {dName}
                            </div>
                        ))}

                        {calendarGrid.cells.map((cell, idx) => {
                            const isSelected = cell.dateStr && selectedCalDate === cell.dateStr;
                            const hasCheques = cell.items.length > 0;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (cell.dateStr) {
                                            setSelectedCalDate(
                                                selectedCalDate === cell.dateStr ? null : cell.dateStr
                                            );
                                        }
                                    }}
                                    style={{
                                        minHeight: 68,
                                        padding: '0.25rem 0.3rem',
                                        borderRight: '1px solid #E5E7EB',
                                        borderBottom: '1px solid #E5E7EB',
                                        background: !cell.day
                                            ? '#F9FAFB'
                                            : isSelected
                                            ? '#F3F4F6'
                                            : hasCheques
                                            ? '#FFFBEB'
                                            : '#FFFFFF',
                                        cursor: cell.day ? 'pointer' : 'default',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                    }}
                                >
                                    {cell.day && (
                                        <>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: hasCheques ? 900 : 600,
                                                        color: hasCheques ? '#111111' : '#6B7280',
                                                    }}
                                                >
                                                    {cell.day}
                                                </span>
                                                {cell.dayTotalEmitido > 0 && (
                                                    <span
                                                        style={{
                                                            fontSize: '0.58rem',
                                                            fontWeight: 900,
                                                            color: '#991B1B',
                                                        }}
                                                    >
                                                        {formatCompactArs(cell.dayTotalEmitido)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Google Calendar Style Event Chips */}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 2,
                                                }}
                                            >
                                                {cell.items.map(chq => {
                                                    const isPag = chq.estado === 'pagado';
                                                    const isEm = chq.direccion === 'emitido';
                                                    return (
                                                        <div
                                                            key={chq.id}
                                                            title={`${
                                                                chq.beneficiario || 'CHEQUE'
                                                            } - ${formatArsCurrency(chq.monto)} (${
                                                                chq.banco
                                                            } #${chq.nro_cheque})`}
                                                            style={{
                                                                padding: '1px 4px',
                                                                borderRadius: 4,
                                                                fontSize: '0.6rem',
                                                                fontWeight: 800,
                                                                background: isPag
                                                                    ? '#D1FAE5'
                                                                    : isEm
                                                                    ? '#111111'
                                                                    : '#1D4ED8',
                                                                color: isPag ? '#065F46' : '#FFFFFF',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            }}
                                                        >
                                                            {isPag ? '✓ ' : ''}
                                                            {chq.beneficiario || `#${chq.nro_cheque}`}{' '}
                                                            {formatCompactArs(chq.monto)}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Selected Calendar Day Inspector */}
                    {selectedCalDate && (
                        <div
                            style={{
                                marginTop: '0.75rem',
                                padding: '0.75rem 0.95rem',
                                borderRadius: 10,
                                background: '#F8F9FA',
                                border: '1px solid #111111',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 6,
                                }}
                            >
                                <span style={{ fontWeight: 900, fontSize: '0.825rem' }}>
                                    📅 Cheques del día {selectedCalDate}
                                </span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        type="button"
                                        onClick={() => openNewChequeModal(selectedCalDate)}
                                        style={{
                                            padding: '0.2rem 0.55rem',
                                            fontSize: '0.675rem',
                                            background: '#111111',
                                            color: '#FFFFFF',
                                            borderRadius: 6,
                                            minHeight: 'auto',
                                        }}
                                    >
                                        + Agendar cheque este día
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCalDate(null)}
                                        className="btn-ghost"
                                        style={{ padding: 2, minHeight: 'auto' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            {cheques.filter(c => c.fecha_vencimiento === selectedCalDate).length === 0 ? (
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                    No hay cheques programados para esta fecha.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {cheques
                                        .filter(c => c.fecha_vencimiento === selectedCalDate)
                                        .map(c => (
                                            <div
                                                key={c.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 8,
                                                    padding: '0.45rem 0.65rem',
                                                    background: '#FFFFFF',
                                                    borderRadius: 8,
                                                    border: '1px solid #E5E7EB',
                                                    fontSize: '0.775rem',
                                                }}
                                            >
                                                <div>
                                                    <strong>{c.beneficiario || 'CHEQUE'}</strong> ·{' '}
                                                    <span style={{ fontWeight: 900 }}>
                                                        {formatArsCurrency(c.monto)}
                                                    </span>{' '}
                                                    <span style={{ color: '#6B7280', fontSize: '0.7rem' }}>
                                                        (#{c.nro_cheque} · {c.banco} · Emisor:{' '}
                                                        {c.razon_social_emisora})
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 5 }}>
                                                    <a
                                                        href={buildGoogleCalendarUrl(c)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            padding: '0.2rem 0.5rem',
                                                            fontSize: '0.675rem',
                                                            fontWeight: 700,
                                                            borderRadius: 6,
                                                            border: '1px solid #111111',
                                                            color: '#111111',
                                                            textDecoration: 'none',
                                                        }}
                                                    >
                                                        📅 Google Cal
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSendWhatsAppReminder(c.id)}
                                                        disabled={sendingReminderId === c.id}
                                                        style={{
                                                            padding: '0.2rem 0.5rem',
                                                            fontSize: '0.675rem',
                                                            fontWeight: 700,
                                                            borderRadius: 6,
                                                            background: '#F3F4F6',
                                                            color: '#111111',
                                                            minHeight: 'auto',
                                                            boxShadow: 'none',
                                                        }}
                                                    >
                                                        🔔 WA
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleEstado(c)}
                                                        style={{
                                                            padding: '0.2rem 0.55rem',
                                                            fontSize: '0.675rem',
                                                            fontWeight: 800,
                                                            borderRadius: 6,
                                                            background:
                                                                c.estado === 'pagado'
                                                                    ? '#D1FAE5'
                                                                    : '#111111',
                                                            color:
                                                                c.estado === 'pagado'
                                                                    ? '#065F46'
                                                                    : '#FFFFFF',
                                                            minHeight: 'auto',
                                                            boxShadow: 'none',
                                                        }}
                                                    >
                                                        {c.estado === 'pagado' ? '✓ Pagado' : 'Marcar Pagado'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

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
                                <th style={{ padding: '0.85rem 1rem' }}>FECHA VTO / TIEMPO</th>
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
                                    const daysLeft = getDaysUntil(chq.fecha_vencimiento);

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
                                                            fontWeight: 800,
                                                            color:
                                                                daysLeft <= 3
                                                                    ? '#DC2626'
                                                                    : '#D97706',
                                                            fontFamily: 'var(--font-main)',
                                                        }}
                                                    >
                                                        ·{' '}
                                                        {daysLeft === 0
                                                            ? '¡Vence Hoy!'
                                                            : daysLeft > 0
                                                            ? `en ${daysLeft} días`
                                                            : `venció (${Math.abs(daysLeft)}d)`}
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
                                                        gap: 3,
                                                    }}
                                                >
                                                    <a
                                                        href={buildGoogleCalendarUrl(chq)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-ghost"
                                                        style={{
                                                            padding: 5,
                                                            minHeight: 'auto',
                                                            color: '#6B7280',
                                                            display: 'inline-flex',
                                                        }}
                                                        title="Agendar recordatorio de pago en Google Calendar"
                                                    >
                                                        <CalendarIcon size={14} />
                                                    </a>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleSendWhatsAppReminder(chq.id)}
                                                        disabled={sendingReminderId === chq.id}
                                                        className="btn-ghost"
                                                        style={{ padding: 5, minHeight: 'auto', color: '#6B7280' }}
                                                        title="Enviar recordatorio de este cheque por WhatsApp"
                                                    >
                                                        <Bell size={14} />
                                                    </button>

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

            {/* ═══════════ MODAL: RECORDATORIOS DE PAGO POR WHATSAPP & GOOGLE CALENDAR ═══════════ */}
            {showReminderModal && (
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
                    onClick={() => setShowReminderModal(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#FFFFFF',
                            border: '2px solid #111111',
                            borderRadius: 18,
                            maxWidth: 480,
                            width: '100%',
                            padding: '1.5rem',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.85rem',
                            }}
                        >
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>
                                🔔 Recordatorios de Pago de Cheques
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowReminderModal(false)}
                                className="btn-ghost"
                                style={{ padding: 4, minHeight: 'auto' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p style={{ fontSize: '0.825rem', color: '#4B5563', marginBottom: '1rem' }}>
                            Enviá un resumen inmediato a tu WhatsApp con los próximos cheques a cubrir en el banco y el saldo total adeudado, o sincronizalos con Google Calendar.
                        </p>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                Teléfono WhatsApp destino del recordatorio
                            </label>
                            <input
                                type="text"
                                value={reminderPhone}
                                onChange={e => setReminderPhone(e.target.value)}
                                placeholder="Ej: 2645438114"
                                style={{ marginBottom: 0 }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button
                                type="button"
                                onClick={() => handleSendWhatsAppReminder()}
                                disabled={sendingReminderId === 'all'}
                                style={{
                                    width: '100%',
                                    background: '#111111',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.875rem',
                                }}
                            >
                                {sendingReminderId === 'all' ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Send size={15} />
                                )}{' '}
                                Enviar Resumen de Próximos Vencimientos por WhatsApp
                            </button>

                            <button
                                type="button"
                                onClick={handleExportIcsCalendar}
                                className="secondary"
                                style={{
                                    width: '100%',
                                    borderColor: '#111111',
                                    color: '#111111',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                }}
                            >
                                <Download size={15} /> Descargar Todos los Vencimientos (.ICS Google Calendar)
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            {/* Selector Dirección Principal */}
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
