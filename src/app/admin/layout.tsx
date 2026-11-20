'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    Coins,
    CreditCard,
    Users,
    BarChart3,
    RefreshCcw,
    Swords,
    ShoppingCart,
    BookOpen,
    LogOut,
    Send,
    UserCog,
    Settings,
    MessageSquare,
    PanelLeftClose,
    PanelLeftOpen,
    Search,
    Bot,
    FileCheck2,
    KeyRound,
    X,
} from 'lucide-react';
import GrowyAssistant from '@/components/GrowyAssistant';
import CommandPalette, { showVyperToast } from '@/components/CommandPalette';

interface CurrentUser {
    id: string;
    email: string;
    nombre: string;
    rol: 'superadmin' | 'administrador' | 'vendedor';
    restrictedBranch?: string | null;
    hideCrmAndCheques?: boolean;
}

const navItems = [
    { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
    { href: '/admin/crm', label: 'Whatsapp', icon: MessageSquare },
    { href: '/admin/cheques', label: 'Cheques', icon: FileCheck2 },
    { href: '/admin/vyper-coins', label: 'Vyper Coins', icon: Coins },
    { href: '/admin/debt', label: 'Cta Corriente', icon: CreditCard },
    { href: '/admin/clients', label: 'Clientes', icon: Users },
    { href: '/admin/bi', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/retention', label: 'Retención', icon: RefreshCcw },
    { href: '/admin/competitors', label: 'Competencia', icon: Swords },
    { href: '/admin/ecommerce', label: 'Ecommerce', icon: ShoppingCart },
    { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

const bottomItems = [
    { href: '/tutorial', label: 'Ayuda', icon: BookOpen },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [unreadWhatsapp, setUnreadWhatsapp] = useState(0);
    const [showPassModal, setShowPassModal] = useState(false);
    const [newPass, setNewPass] = useState('');
    const [savingPass, setSavingPass] = useState(false);
    const isLoginPage = pathname === '/admin/login';
    const isCrmFullPage = pathname === '/admin/crm';
    const isEzeUser = (user?.email || '').toLowerCase().trim() === 'eze@growlabs.com';

    useEffect(() => {
        try {
            const saved = localStorage.getItem('vyper_sidebar_collapsed');
            if (saved === 'true') setCollapsed(true);
        } catch {
            // ignore
        }
    }, []);

    // Poll unread WhatsApp messages for global sidebar badge (skip if eze@growlabs.com)
    useEffect(() => {
        if (isLoginPage || isEzeUser) return;
        const fetchUnread = () => {
            fetch('/api/crm')
                .then(r => r.json())
                .then(d => {
                    if (typeof d?.totalUnread === 'number') {
                        setUnreadWhatsapp(d.totalUnread);
                    }
                })
                .catch(() => {});
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 10000);
        return () => clearInterval(interval);
    }, [isLoginPage, isEzeUser]);

    const toggleSidebar = () => {
        setCollapsed(prev => {
            const next = !prev;
            try {
                localStorage.setItem('vyper_sidebar_collapsed', String(next));
            } catch {
                // ignore
            }
            return next;
        });
    };

    // Fetch current user (must be before any early return)
    useEffect(() => {
        if (isLoginPage) return;
        fetch('/api/auth/me')
            .then(r => r.json())
            .then(data => {
                if (data.authenticated && data.user) {
                    setUser(data.user);
                }
            })
            .catch(() => {});
    }, [isLoginPage]);

    // Don't render sidebar layout for login page
    if (isLoginPage) {
        return <>{children}</>;
    }

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    const today = new Date().toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Capitalize first letter
    const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

    const rolLabel: Record<string, string> = {
        superadmin: 'Super Admin',
        administrador: 'Administrador',
        vendedor: 'Vendedor',
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
                {/* Brand + Collapse Toggle */}
                <div
                    className="sidebar-brand"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'space-between',
                        gap: '0.5rem',
                    }}
                >
                    {!collapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                            <div className="sidebar-brand-icon">
                                <img src="/logovyper.png" alt="Vyper" width={28} height={28} style={{ borderRadius: '6px' }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <span className="sidebar-brand-name">Vyper Labs</span>
                                <span className="sidebar-brand-sub">Panel de gestión</span>
                            </div>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        title={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 8,
                            width: 34,
                            height: 34,
                            padding: 0,
                            minHeight: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: 'none',
                        }}
                    >
                        {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
                    </button>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    <div className="sidebar-nav-group">
                        {/* Quick Global Search (Ctrl+K) */}
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                            title="Buscador rápido (Ctrl + K)"
                            className="sidebar-nav-item"
                            style={{
                                marginBottom: 6,
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.14)',
                                color: '#E5E7EB',
                                justifyContent: collapsed ? 'center' : 'space-between',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                <Search size={16} style={{ flexShrink: 0 }} />
                                {!collapsed && <span>Buscar...</span>}
                            </span>
                            {!collapsed && (
                                <kbd
                                    style={{
                                        fontSize: '0.65rem',
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: 4,
                                        background: 'rgba(255,255,255,0.15)',
                                        color: '#FFFFFF',
                                    }}
                                >
                                    Ctrl+K
                                </kbd>
                            )}
                        </button>

                        {navItems
                            .filter(item => {
                                if (isEzeUser && (item.href === '/admin/crm' || item.href === '/admin/cheques')) {
                                    return false;
                                }
                                return true;
                            })
                            .map(item => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            const isWa = item.href === '/admin/crm';
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={collapsed ? item.label : undefined}
                                    className={`sidebar-nav-item ${active ? 'active' : ''}`}
                                    style={{ position: 'relative', justifyContent: collapsed ? 'center' : 'space-between' }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                        <Icon size={18} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                                        {!collapsed && <span>{item.label}</span>}
                                    </span>
                                    {isWa && unreadWhatsapp > 0 && (
                                        <span
                                            style={{
                                                background: active ? '#111111' : '#FFFFFF',
                                                color: active ? '#FFFFFF' : '#111111',
                                                borderRadius: 999,
                                                padding: collapsed ? '0.05rem 0.35rem' : '0.1rem 0.45rem',
                                                fontSize: '0.65rem',
                                                fontWeight: 900,
                                                position: collapsed ? 'absolute' : 'static',
                                                top: collapsed ? 4 : undefined,
                                                right: collapsed ? 4 : undefined,
                                            }}
                                        >
                                            {unreadWhatsapp}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                        {/* Users link - only superadmin */}
                        {user?.rol === 'superadmin' && (
                            <Link
                                href="/admin/usuarios"
                                title={collapsed ? 'Usuarios' : undefined}
                                className={`sidebar-nav-item ${pathname.startsWith('/admin/usuarios') ? 'active' : ''}`}
                            >
                                <UserCog size={18} strokeWidth={pathname.startsWith('/admin/usuarios') ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                                {!collapsed && <span>Usuarios</span>}
                            </Link>
                        )}
                    </div>
                </nav>

                {/* Bottom */}
                <div className="sidebar-bottom">
                    {bottomItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.label : undefined}
                                className="sidebar-nav-item"
                            >
                                <Icon size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}

                    {/* User info */}
                    {user && !collapsed && (
                        <div style={{
                            padding: '0.625rem 0.75rem',
                            borderTop: '1px solid var(--border-light)',
                            marginTop: '0.25rem',
                        }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                {user.nombre}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                {isEzeUser ? 'Sucursal Rawson' : rolLabel[user.rol] || user.rol}
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setNewPass('');
                            setShowPassModal(true);
                        }}
                        title={collapsed ? 'Cambiar contraseña' : undefined}
                        className="sidebar-nav-item"
                        style={{
                            background: 'none',
                            border: 'none',
                            width: '100%',
                            cursor: 'pointer',
                            textAlign: 'left',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                        }}
                    >
                        <KeyRound size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                        {!collapsed && <span>Cambiar contraseña</span>}
                    </button>

                    <button
                        onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            router.push('/admin/login');
                        }}
                        title={collapsed ? 'Cerrar sesión' : undefined}
                        className="sidebar-nav-item sidebar-exit"
                        style={{
                            background: 'none',
                            border: 'none',
                            width: '100%',
                            cursor: 'pointer',
                            textAlign: 'left',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                        }}
                    >
                        <LogOut size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                        {!collapsed && <span>Cerrar sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="admin-main" style={{ height: isCrmFullPage ? '100vh' : undefined, overflow: isCrmFullPage ? 'hidden' : undefined }}>
                {/* Top bar (hidden in full-screen CRM page so Whatsapp occupies 100% of screen) */}
                {!isCrmFullPage && (
                    <header className="admin-topbar">
                        <div>
                            <h1 className="admin-topbar-title">
                                Administración <span style={{ fontWeight: 800 }}>Vyper Labs</span>
                            </h1>
                            <p className="admin-topbar-sub">Sistema de gestión integral</p>
                        </div>
                        <div className="admin-topbar-right">
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                                className="secondary"
                                style={{
                                    padding: '0.45rem 0.85rem',
                                    fontSize: '0.775rem',
                                    borderRadius: 999,
                                    minHeight: 'auto',
                                }}
                            >
                                <Search size={14} /> Buscar <kbd style={{ fontSize: '0.675rem', opacity: 0.7 }}>Ctrl+K</kbd>
                            </button>
                            <span className="admin-topbar-date">{formattedDate}</span>
                        </div>
                    </header>
                )}

                {/* Page content */}
                <main className="admin-content" style={{ display: isCrmFullPage ? 'flex' : undefined, flexDirection: isCrmFullPage ? 'column' : undefined, height: isCrmFullPage ? '100vh' : undefined, overflow: isCrmFullPage ? 'hidden' : undefined }}>
                    {children}
                </main>
            </div>

            {/* Global Command Palette (Ctrl+K) + Toast System + Growy Virtual Assistant */}
            <CommandPalette />
            <GrowyAssistant />

            {/* Modal Cambiar Contraseña */}
            {showPassModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        zIndex: 10040,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                    }}
                    onClick={() => setShowPassModal(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#FFFFFF',
                            border: '2px solid #111111',
                            borderRadius: 16,
                            maxWidth: 420,
                            width: '100%',
                            padding: '1.5rem',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>
                                🔑 Cambiar Contraseña ({user?.email})
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowPassModal(false)}
                                className="btn-ghost"
                                style={{ padding: 4, minHeight: 'auto' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form
                            onSubmit={async e => {
                                e.preventDefault();
                                if (!newPass || newPass.trim().length < 4) return;
                                setSavingPass(true);
                                try {
                                    const res = await fetch('/api/auth/me', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ newPassword: newPass.trim() }),
                                    });
                                    const data = await res.json();
                                    if (!res.ok || !data.ok) {
                                        showVyperToast(data.error || 'Error cambiando contraseña', 'error');
                                    } else {
                                        showVyperToast('✅ Contraseña actualizada correctamente');
                                        setShowPassModal(false);
                                        setNewPass('');
                                    }
                                } catch {
                                    showVyperToast('Error de conexión', 'error');
                                } finally {
                                    setSavingPass(false);
                                }
                            }}
                        >
                            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                Nueva Contraseña
                            </label>
                            <input
                                type="password"
                                value={newPass}
                                onChange={e => setNewPass(e.target.value)}
                                placeholder="Ingresá tu nueva contraseña..."
                                autoFocus
                                required
                                minLength={4}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button
                                    type="button"
                                    onClick={() => setShowPassModal(false)}
                                    className="secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPass || newPass.trim().length < 4}
                                    style={{ background: '#111111', color: '#FFFFFF' }}
                                >
                                    {savingPass ? 'Guardando...' : 'Guardar Nueva Contraseña'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
