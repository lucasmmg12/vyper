'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    X,
    MessageSquare,
    Users,
    Package,
    CreditCard,
    Coins,
    BarChart3,
    ShoppingCart,
    LayoutDashboard,
    Bot,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

interface ToastItem {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}

export function showVyperToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vyper-toast', { detail: { message, type } }));
    }
}

export default function CommandPalette() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    // Global Toast listener
    useEffect(() => {
        const handleToast = (e: any) => {
            const msg = e?.detail?.message || '';
            const type = e?.detail?.type || 'success';
            if (!msg) return;
            const id = `${Date.now()}_${Math.random()}`;
            setToasts(prev => [...prev, { id, message: msg, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3800);
        };
        window.addEventListener('vyper-toast', handleToast);
        return () => window.removeEventListener('vyper-toast', handleToast);
    }, []);

    // Global Ctrl+K / Cmd+K shortcut & custom event listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            } else if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        const handleOpenEvent = () => setIsOpen(true);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('open-command-palette', handleOpenEvent);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('open-command-palette', handleOpenEvent);
        };
    }, []);

    // Load clients & products when opened
    useEffect(() => {
        if (!isOpen) return;
        Promise.all([
            fetch('/api/clients?limit=200').then(r => r.json()).catch(() => ({})),
            fetch('/api/ecommerce/productos?all=true&limit=100').then(r => r.json()).catch(() => ({})),
        ]).then(([cData, pData]) => {
            if (cData?.clients) setClients(cData.clients);
            if (pData?.productos) setProducts(pData.productos);
        });
    }, [isOpen]);

    const navPages = [
        { label: 'Inicio (Ventas POS & Egresos)', href: '/admin', icon: LayoutDashboard },
        { label: 'Whatsapp CRM (Pantalla Completa)', href: '/admin/crm', icon: MessageSquare },
        { label: 'Cheques y eCheqs (Emitidos y Recibidos)', href: '/admin/cheques', icon: CreditCard },
        { label: 'Vyper Coins (Fidelización)', href: '/admin/vyper-coins', icon: Coins },
        { label: 'Cuenta Corriente (Deudores)', href: '/admin/debt', icon: CreditCard },
        { label: 'Base de Clientes', href: '/admin/clients', icon: Users },
        { label: 'Analytics BI & Finanzas', href: '/admin/bi', icon: BarChart3 },
        { label: 'Ecommerce Mayorista / Minorista', href: '/admin/ecommerce', icon: ShoppingCart },
        { label: 'Catálogo de Productos', href: '/admin/ecommerce/productos', icon: Package },
        { label: 'Pedidos Web', href: '/admin/ecommerce/pedidos', icon: ShoppingCart },
    ];

    const filteredPages = useMemo(() => {
        if (!query.trim()) return navPages.slice(0, 6);
        const q = query.toLowerCase();
        return navPages.filter(p => p.label.toLowerCase().includes(q));
    }, [query]);

    const filteredClients = useMemo(() => {
        if (!query.trim()) return clients.slice(0, 4);
        const q = query.toLowerCase();
        const digits = query.replace(/\D/g, '');
        return clients
            .filter(
                c =>
                    (c.name || '').toLowerCase().includes(q) ||
                    (digits && (c.phone || '').replace(/\D/g, '').includes(digits))
            )
            .slice(0, 6);
    }, [clients, query]);

    const filteredProducts = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return products
            .filter(
                p =>
                    (p.nombre || '').toLowerCase().includes(q) ||
                    (p.codigo_sku || '').toLowerCase().includes(q)
            )
            .slice(0, 5);
    }, [products, query]);

    return (
        <>
            {/* Floating Toast Stack */}
            {toasts.length > 0 && (
                <div
                    style={{
                        position: 'fixed',
                        top: 18,
                        right: 18,
                        zIndex: 10050,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        maxWidth: 380,
                    }}
                >
                    {toasts.map(t => (
                        <div
                            key={t.id}
                            style={{
                                background: '#111111',
                                color: '#FFFFFF',
                                border: '2px solid #FFFFFF',
                                borderRadius: 12,
                                padding: '0.75rem 1rem',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                fontSize: '0.825rem',
                                fontWeight: 700,
                            }}
                        >
                            {t.type === 'error' ? (
                                <AlertCircle size={17} color="#EF4444" />
                            ) : (
                                <CheckCircle2 size={17} color="#10B981" />
                            )}
                            <span style={{ flex: 1 }}>{t.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Command Palette Modal */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 10020,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '10vh',
                        paddingLeft: '1rem',
                        paddingRight: '1rem',
                    }}
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: 620,
                            background: '#FFFFFF',
                            border: '2px solid #111111',
                            borderRadius: 16,
                            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Search Input */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '0.85rem 1rem',
                                borderBottom: '1px solid #E5E7EB',
                                background: '#FAFAFA',
                            }}
                        >
                            <Search size={18} color="#111111" />
                            <input
                                type="text"
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Buscar cliente, abrir su Whatsapp, buscar producto o ir a una sección..."
                                style={{
                                    flex: 1,
                                    margin: 0,
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '0.925rem',
                                    fontWeight: 600,
                                    padding: '0.2rem',
                                    boxShadow: 'none',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="btn-ghost"
                                style={{ padding: 4, minHeight: 'auto' }}
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {/* Results */}
                        <div style={{ maxHeight: '65vh', overflowY: 'auto', padding: '0.75rem' }}>
                            {/* Ask Growy Directly */}
                            {query.trim().length > 2 && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const q = query;
                                            setIsOpen(false);
                                            setQuery('');
                                            window.dispatchEvent(
                                                new CustomEvent('open-growy', { detail: { prompt: q } })
                                            );
                                        }}
                                        style={{
                                            width: '100%',
                                            justifyContent: 'space-between',
                                            background: '#111111',
                                            color: '#FFFFFF',
                                            padding: '0.65rem 0.9rem',
                                            borderRadius: 10,
                                            fontSize: '0.825rem',
                                            minHeight: 'auto',
                                        }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Bot size={16} /> Preguntarle a <strong>Growy IA</strong>: &ldquo;{query}&rdquo;
                                        </span>
                                        <ArrowRight size={15} />
                                    </button>
                                </div>
                            )}

                            {/* Clients Section */}
                            {filteredClients.length > 0 && (
                                <div style={{ marginBottom: '0.85rem' }}>
                                    <div
                                        style={{
                                            fontSize: '0.675rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            color: '#6B7280',
                                            padding: '0.25rem 0.5rem',
                                        }}
                                    >
                                        Clientes (Clic para abrir en Whatsapp CRM)
                                    </div>
                                    {filteredClients.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => {
                                                setIsOpen(false);
                                                setQuery('');
                                                if (c.phone) {
                                                    router.push(`/admin/crm?phone=${encodeURIComponent(c.phone)}`);
                                                } else {
                                                    router.push('/admin/clients');
                                                }
                                            }}
                                            style={{
                                                padding: '0.55rem 0.7rem',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 10,
                                                borderBottom: '1px solid #F3F4F6',
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111111' }}>
                                                    {c.name}
                                                </div>
                                                <div style={{ fontSize: '0.725rem', color: '#6B7280' }}>
                                                    📱 {c.phone || 'Sin teléfono'} · 🪙 {c.coin_balance || 0} Coins · 💳 Deuda: $
                                                    {Number(c.debt_balance || 0).toLocaleString('es-AR')}
                                                </div>
                                            </div>
                                            <span
                                                style={{
                                                    padding: '0.25rem 0.6rem',
                                                    borderRadius: 6,
                                                    background: '#111111',
                                                    color: '#FFFFFF',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}
                                            >
                                                <MessageSquare size={12} /> Abrir Chat
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Products Section */}
                            {filteredProducts.length > 0 && (
                                <div style={{ marginBottom: '0.85rem' }}>
                                    <div
                                        style={{
                                            fontSize: '0.675rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            color: '#6B7280',
                                            padding: '0.25rem 0.5rem',
                                        }}
                                    >
                                        Productos del Catálogo
                                    </div>
                                    {filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setIsOpen(false);
                                                setQuery('');
                                                router.push('/admin/ecommerce/productos');
                                            }}
                                            style={{
                                                padding: '0.55rem 0.7rem',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                borderBottom: '1px solid #F3F4F6',
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.nombre}</div>
                                                <div style={{ fontSize: '0.725rem', color: '#6B7280' }}>
                                                    SKU: {p.codigo_sku || 'N/A'} · Stock: {p.stock ?? 0}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                                                ${Number(p.precio_mayorista || p.precio || 0).toLocaleString('es-AR')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Navigation Pages */}
                            <div>
                                <div
                                    style={{
                                        fontSize: '0.675rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        color: '#6B7280',
                                        padding: '0.25rem 0.5rem',
                                    }}
                                >
                                    Secciones del Sistema
                                </div>
                                {filteredPages.map(page => {
                                    const Icon = page.icon;
                                    return (
                                        <div
                                            key={page.href}
                                            onClick={() => {
                                                setIsOpen(false);
                                                setQuery('');
                                                router.push(page.href);
                                            }}
                                            style={{
                                                padding: '0.55rem 0.7rem',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                                                <Icon size={16} /> {page.label}
                                            </span>
                                            <ArrowRight size={14} color="#6B7280" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
