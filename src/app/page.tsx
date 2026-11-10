'use client';

import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, ShoppingCart, BarChart2, ShieldCheck, BookOpen, ArrowRight, Store, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--bg-secondary)', padding: '2rem 0' }}>
      <main className="page-container">

        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="animate-float" style={{ display: 'inline-block', marginBottom: '1.25rem' }}>
            <Image src="/logovyper.png" alt="Vyper" width={72} height={72} style={{ borderRadius: 16 }} />
          </div>

          <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#111111' }}>
            VYPER LABS
          </h1>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '0.45rem 1rem', borderRadius: '50px',
            background: '#FFFFFF', border: '1px solid #111111',
          }}>
            <ShieldCheck size={16} style={{ color: '#111111' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#111111', letterSpacing: '0.06em' }}>
              ECOSISTEMA INTEGRAL v3.0 · ERP, ECOMMERCE &amp; IA
            </span>
          </div>
        </div>

        {/* Main Navigation Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', maxWidth: '1060px', margin: '0 auto', gap: '1.25rem' }}>

          {/* Module 1: Tienda Mayorista */}
          <Link href="/tienda">
            <div className="glass-card" style={{
              height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.25rem 1.75rem',
              background: '#111111',
              color: '#FFFFFF', border: '2px solid #111111',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <ShoppingCart size={26} color="#FFFFFF" />
              </div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: '#FFFFFF', fontWeight: 800 }}>Tienda Mayorista</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '1.5rem', lineHeight: '1.55', fontSize: '0.875rem', flex: 1 }}>
                Catálogo B2B con Modo Planilla Rápida, variantes, lista PDF y Personal Shopper IA.
              </p>
              <button style={{
                width: '100%', background: '#FFFFFF', color: '#111111',
                border: '1px solid #FFFFFF', fontWeight: 800,
              }}>
                CATÁLOGO MAYORISTA <ArrowRight size={16} />
              </button>
            </div>
          </Link>

          {/* Module 2: Tienda Minorista */}
          <Link href="/minorista">
            <div className="glass-card" style={{
              height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.25rem 1.75rem',
              background: '#FFFFFF', border: '2px solid #111111',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: '#111111', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <Store size={26} />
              </div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: '#111111', fontWeight: 800 }}>Tienda Minorista</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.55', fontSize: '0.875rem', flex: 1 }}>
                Tienda oficial al público con asesor nutricional IA, cupones y canje de Vyper Coins.
              </p>
              <button className="secondary" style={{ width: '100%', borderColor: '#111111', color: '#111111', fontWeight: 800 }}>
                TIENDA OFICIAL <ArrowRight size={16} />
              </button>
            </div>
          </Link>

          {/* Module 3: Admin Panel */}
          <Link href="/admin">
            <div className="glass-card" style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.25rem 1.75rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: '#F3F4F6', color: '#111111', border: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <TrendingUp size={26} />
              </div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', fontWeight: 800 }}>Panel Operativo (POS)</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.55', fontSize: '0.875rem', flex: 1 }}>
                Gestión de ventas con escáner SKU, egresos, cuenta corriente, retención IA y ecommerce.
              </p>
              <button className="secondary" style={{ width: '100%' }}>
                INGRESAR AL PANEL
              </button>
            </div>
          </Link>

          {/* Module 4: Portal de Clientes */}
          <Link href="/client">
            <div className="glass-card" style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.25rem 1.75rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: '#F3F4F6', color: '#111111', border: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <Users size={26} />
              </div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', fontWeight: 800 }}>Portal de Clientes</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.55', fontSize: '0.875rem', flex: 1 }}>
                Consultá tu saldo de Vyper Coins, estado de cuenta corriente, seguí tus pedidos y repetí tu compra.
              </p>
              <button className="secondary" style={{ width: '100%' }}>
                CONSULTAR MI CUENTA
              </button>
            </div>
          </Link>

          {/* Module 5: BI Analytics */}
          <Link href="/admin/bi">
            <div className="glass-card" style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.25rem 1.75rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: '#F3F4F6', color: '#111111', border: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <BarChart2 size={26} />
              </div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', fontWeight: 800 }}>Analytics &amp; Copiloto IA</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.55', fontSize: '0.875rem', flex: 1 }}>
                KPIs financieros, proyecciones, reportes ejecutivos y diagnóstico inteligente con IA.
              </p>
              <button className="secondary" style={{ width: '100%' }}>
                VER ANALÍTICAS
              </button>
            </div>
          </Link>

          {/* Module 6: Centro de Ayuda y Manuales */}
          <Link href="/tutorial">
            <div className="glass-card" style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.25rem 1.75rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: '#F3F4F6', color: '#111111', border: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem',
              }}>
                <BookOpen size={26} />
              </div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', fontWeight: 800 }}>Manuales y Tutoriales</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.55', fontSize: '0.875rem', flex: 1 }}>
                Centro de ayuda paso a paso con todas las guías operativas en estética Blanco y Negro.
              </p>
              <button className="secondary" style={{ width: '100%' }}>
                ABRIR MANUALES
              </button>
            </div>
          </Link>

        </div>

      </main>
    </div>
  );
}
