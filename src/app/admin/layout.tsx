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
} from 'lucide-react';

interface CurrentUser {
    id: string;
    email: string;
    nombre: string;
    rol: 'superadmin' | 'administrador' | 'vendedor';
}

const navItems = [
    { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
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
    const isLoginPage = pathname === '/admin/login';

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
            <aside className="admin-sidebar">
                {/* Brand */}
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">
                        <img src="/logovyper.png" alt="Vyper" width={28} height={28} style={{ borderRadius: '6px' }} />
                    </div>
                    <div>
                        <span className="sidebar-brand-name">Vyper Labs</span>
                        <span className="sidebar-brand-sub">Panel de gestión</span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    <div className="sidebar-nav-group">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-nav-item ${active ? 'active' : ''}`}
                                >
                                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                        {/* Users link - only superadmin */}
                        {user?.rol === 'superadmin' && (
                            <Link
                                href="/admin/usuarios"
                                className={`sidebar-nav-item ${pathname.startsWith('/admin/usuarios') ? 'active' : ''}`}
                            >
                                <UserCog size={18} strokeWidth={pathname.startsWith('/admin/usuarios') ? 2.2 : 1.8} />
                                <span>Usuarios</span>
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
                                className="sidebar-nav-item"
                            >
                                <Icon size={18} strokeWidth={1.8} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* User info */}
                    {user && (
                        <div style={{
                            padding: '0.625rem 0.75rem',
                            borderTop: '1px solid var(--border-light)',
                            marginTop: '0.25rem',
                        }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                {user.nombre}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                {rolLabel[user.rol] || user.rol}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            router.push('/admin/login');
                        }}
                        className="sidebar-nav-item sidebar-exit"
                        style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
                    >
                        <LogOut size={18} strokeWidth={1.8} />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="admin-main">
                {/* Top bar */}
                <header className="admin-topbar">
                    <div>
                        <h1 className="admin-topbar-title">
                            Administración <span style={{ fontWeight: 800 }}>Vyper Labs</span>
                        </h1>
                        <p className="admin-topbar-sub">Sistema de gestión integral</p>
                    </div>
                    <div className="admin-topbar-right">
                        <span className="admin-topbar-date">{formattedDate}</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
