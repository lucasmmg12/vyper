
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, TrendingUp, ShoppingCart, BarChart2, ShieldCheck, GraduationCap, BookOpen, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
      <main className="page-container">

        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="animate-float" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
            <Image src="/logovyper.png" alt="Vyper" width={72} height={72} style={{ borderRadius: 16 }} />
          </div>

          <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            VYPER LABS
          </h1>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '0.5rem 1rem', borderRadius: '50px',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
          }}>
            <ShieldCheck size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
              ADMINISTRACIÓN CENTRALIZADA
            </span>
          </div>
        </div>

        {/* Main Navigation Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', maxWidth: '1000px', margin: '0 auto', gap: '1.5rem' }}>

          {/* Module 1: Tienda Mayorista */}
          <Link href="/tienda">
            <div className="glass-card" style={{
              height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 2rem',
              background: 'linear-gradient(135deg, #111111, #1a1a2e)',
              color: 'white', border: 'none',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <ShoppingCart size={28} color="white" />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'white' }}>Tienda Mayorista</h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.9375rem' }}>
                Catálogo de productos con precios mayoristas. Armá tu pedido online.
              </p>
              <button style={{
                width: '100%', background: 'rgba(255,255,255,0.15)', color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                VER CATÁLOGO <ArrowRight size={16} />
              </button>
            </div>
          </Link>

          {/* Module 2: Admin Panel */}
          <Link href="/admin">
            <div className="glass-card" style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 2rem' }}>
              <div className="glow-icon-container">
                <TrendingUp size={28} />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Panel Operativo</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.9375rem' }}>
                Gestión diaria de ventas, egresos y control de caja por sucursal.
              </p>
              <button className="secondary" style={{ width: '100%' }}>
                INGRESAR
              </button>
            </div>
          </Link>

          {/* Module 3: BI Analytics */}
          <Link href="/admin/bi">
            <div className="glass-card" style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 2rem' }}>
              <div className="glow-icon-container" style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)' }}>
                <BarChart2 size={28} />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Business Intelligence</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.9375rem' }}>
                Análisis avanzado de datos, proyecciones y comparativas de rendimiento.
              </p>
              <button className="secondary" style={{ width: '100%' }}>
                VER ANALÍTICAS
              </button>
            </div>
          </Link>

        </div>

      </main>
    </div>
  );
}
