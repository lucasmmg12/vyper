
'use client';

import Link from 'next/link';
import { LayoutDashboard, TrendingUp, Settings, BarChart2, ShieldCheck, PieChart, BookOpen, GraduationCap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-center">
      <main className="page-container">

        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="animate-float" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
            <div style={{
              width: '80px', height: '80px',
              background: 'white', borderRadius: '50%',
              boxShadow: '0 0 40px rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <LayoutDashboard size={40} color="black" />
            </div>
          </div>

          <h1 style={{ marginBottom: '1rem', fontSize: '3.5rem' }}>
            GROW LABS SYSTEM
          </h1>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '0.5rem 1rem', borderRadius: '50px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <ShieldCheck size={16} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              ADMINISTRACIÓN CENTRALIZADA
            </span>
          </div>
        </div>

        {/* Main Navigation Grid */}
        <div className="grid-layout" style={{ maxWidth: '1200px', margin: '0 auto', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

          {/* Module 1: Admin Panel */}
          <Link href="/admin">
            <div className="glass-card" style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem' }}>
              <div className="glow-icon-container">
                <TrendingUp size={32} />
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Panel Operativo</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                Gestión diaria de ventas, egresos y control de caja por sucursal.
              </p>
              <button style={{ width: '100%' }}>
                INGRESAR
              </button>
            </div>
          </Link>

          {/* Module 2: BI Analytics */}
          <Link href="/admin/bi">
            <div className="glass-card" style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem' }}>
              <div className="glow-icon-container">
                <BarChart2 size={32} />
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Business Intelligence</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                Análisis avanzado de datos, proyecciones y comparativas de rendimiento.
              </p>
              <button className="secondary" style={{ width: '100%' }}>
                VER ANALÍTICAS <PieChart size={18} style={{ marginLeft: '8px' }} />
              </button>
            </div>
          </Link>

          {/* Module 3: Tutorial Interactivo */}
          <a href="/TUTORIAL_INTERACTIVO.html" target="_blank" rel="noopener noreferrer">
            <div className="glass-card" style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem' }}>
              <div className="glow-icon-container" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                <GraduationCap size={32} />
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Tutorial Interactivo</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                Aprende a usar el sistema paso a paso con guías visuales y tutoriales completos.
              </p>
              <button className="secondary" style={{ width: '100%', borderColor: '#fbbf24', color: '#fbbf24' }}>
                COMENZAR TUTORIAL <BookOpen size={18} style={{ marginLeft: '8px' }} />
              </button>
            </div>
          </a>

        </div>



      </main>
    </div>
  );
}
