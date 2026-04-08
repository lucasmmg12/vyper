'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Search, Menu, X, ChevronRight, Package, HelpCircle } from 'lucide-react';
import { useCart } from '@/lib/cart';

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  const { getItemCount, isLoaded } = useCart();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoaded) setCartCount(getItemCount());

    const handler = () => {
      const stored = localStorage.getItem('vyper_cart');
      if (stored) {
        const items = JSON.parse(stored);
        setCartCount(items.reduce((s: number, i: { cantidad: number }) => s + i.cantidad, 0));
      }
    };
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, [isLoaded, getItemCount]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* ===== HEADER ===== */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          {/* Left: Logo */}
          <Link href="/tienda" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <Image src="/logovyper.png" alt="Vyper" width={40} height={40} style={{ borderRadius: 8 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.125rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>VYPER</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Mayorista</div>
            </div>
          </Link>

          {/* Center: Desktop Nav */}
          <nav style={{ display: 'none', gap: '0.25rem' }} className="desktop-nav">
            <Link href="/tienda">
              <button className="btn-ghost" style={{ fontSize: '0.875rem' }}>Catálogo</button>
            </Link>
            <Link href="/tienda/carrito">
              <button className="btn-ghost" style={{ fontSize: '0.875rem' }}>Mi Pedido</button>
            </Link>
            <Link href="/tienda/como-comprar">
              <button className="btn-ghost" style={{ fontSize: '0.875rem' }}>¿Cómo comprar?</button>
            </Link>
          </nav>

          {/* Right: Cart + Mobile menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/tienda/carrito">
              <button className="btn-ghost" style={{ position: 'relative', padding: '0.625rem' }}>
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {cartCount}
                  </span>
                )}
              </button>
            </Link>

            {/* Mobile hamburger */}
            <button
              className="btn-ghost mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ padding: '0.625rem' }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div style={{
            padding: '0.5rem 1.5rem 1rem',
            borderTop: '1px solid var(--border-light)',
            background: 'var(--bg-color)',
            animation: 'slideUp 0.2s ease-out',
          }}>
            <Link href="/tienda" onClick={() => setMobileMenuOpen(false)}>
              <div style={{
                padding: '0.875rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-light)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                  <Package size={18} /> Catálogo
                </span>
                <ChevronRight size={16} color="var(--text-light)" />
              </div>
            </Link>
            <Link href="/tienda/carrito" onClick={() => setMobileMenuOpen(false)}>
              <div style={{
                padding: '0.875rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                  <ShoppingCart size={18} /> Mi Pedido
                  {cartCount > 0 && <span className="badge badge-blue">{cartCount}</span>}
                </span>
                <ChevronRight size={16} color="var(--text-light)" />
              </div>
            </Link>
            <Link href="/tienda/como-comprar" onClick={() => setMobileMenuOpen(false)}>
              <div style={{
                padding: '0.875rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                  <HelpCircle size={18} /> ¿Cómo comprar?
                </span>
                <ChevronRight size={16} color="var(--text-light)" />
              </div>
            </Link>
          </div>
        )}
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main>
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      <footer style={{
        background: 'var(--bg-color)',
        borderTop: '1px solid var(--border-color)',
        padding: '2rem 1.5rem',
        marginTop: '3rem',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Image src="/logovyper.png" alt="Vyper" width={32} height={32} style={{ borderRadius: 6 }} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>VYPER SUPLEMENTOS</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            📍 Dr. Ortega 192, Villa Krause, San Juan
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            📱 +54 264 629 8880 &nbsp;·&nbsp; @vyper_suplementos
          </p>
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', fontSize: '0.75rem', color: 'var(--text-light)' }}>
            Desarrollado por Grow Labs · {new Date().getFullYear()}
          </div>
        </div>
      </footer>

      {/* ===== RESPONSIVE STYLES ===== */}
      <style jsx>{`
        .desktop-nav {
          display: none !important;
        }
        .mobile-only {
          display: flex !important;
        }
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
