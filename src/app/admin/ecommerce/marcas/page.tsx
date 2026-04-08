'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Tag } from 'lucide-react';
import { Marca } from '@/types/ecommerce';

export default function MarcasAdminPage() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', logo_url: '' });

  const fetchMarcas = async () => {
    const res = await fetch('/api/ecommerce/marcas');
    const data = await res.json();
    setMarcas(data.marcas || []);
    setLoading(false);
  };

  useEffect(() => { fetchMarcas(); }, []);

  const handleCreate = async () => {
    if (!form.nombre) return;
    await fetch('/api/ecommerce/marcas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ nombre: '', logo_url: '' });
    setShowForm(false);
    fetchMarcas();
  };

  return (
    <div className="page-container">
      <Link href="/admin/ecommerce">
        <button className="btn-ghost" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Ecommerce
        </button>
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Marcas</h1>
        <button onClick={() => setShowForm(true)}><Plus size={18} /> Nueva Marca</button>
      </div>

      {showForm && (
        <div className="glass-card animate-slideUp" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Nueva Marca</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
            <div>
              <label>Nombre *</label>
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Star Nutrition" />
            </div>
            <div>
              <label>Logo URL</label>
              <input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleCreate} disabled={!form.nombre}>Crear Marca</button>
            <button className="secondary" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Cargando...</p>
      ) : marcas.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Tag size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3>No hay marcas</h3>
          <p style={{ color: 'var(--text-muted)' }}>Creá una marca para asociarla a productos.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {marcas.map(marca => (
            <div key={marca.id} className="glass-card" style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'var(--bg-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.75rem', fontSize: '1.5rem',
              }}>
                <Tag size={24} style={{ color: 'var(--text-muted)' }} />
              </div>
              <h4>{marca.nombre}</h4>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
