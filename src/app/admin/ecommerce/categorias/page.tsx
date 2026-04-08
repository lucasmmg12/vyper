'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, ChevronRight, Layers } from 'lucide-react';
import { Rubro, Categoria } from '@/types/ecommerce';

export default function CategoriasAdminPage() {
  const [rubros, setRubros] = useState<(Rubro & { categorias?: Categoria[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRubroForm, setShowRubroForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [selectedRubro, setSelectedRubro] = useState<string>('');
  const [rubroForm, setRubroForm] = useState({ nombre: '', descripcion: '', icono: '' });
  const [catForm, setCatForm] = useState({ nombre: '', descripcion: '', rubro_id: '' });

  const fetchRubros = async () => {
    const res = await fetch('/api/ecommerce/rubros');
    const data = await res.json();
    setRubros(data.rubros || []);
    setLoading(false);
  };

  useEffect(() => { fetchRubros(); }, []);

  const handleCreateRubro = async () => {
    if (!rubroForm.nombre) return;
    await fetch('/api/ecommerce/rubros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rubroForm),
    });
    setRubroForm({ nombre: '', descripcion: '', icono: '' });
    setShowRubroForm(false);
    fetchRubros();
  };

  const handleCreateCat = async () => {
    if (!catForm.nombre || !catForm.rubro_id) return;
    await fetch('/api/ecommerce/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catForm),
    });
    setCatForm({ nombre: '', descripcion: '', rubro_id: '' });
    setShowCatForm(false);
    fetchRubros();
  };

  return (
    <div className="page-container">
      <Link href="/admin/ecommerce">
        <button className="btn-ghost" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Ecommerce
        </button>
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Rubros y Categorías</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="secondary" onClick={() => setShowRubroForm(true)}>
            <Plus size={16} /> Rubro
          </button>
          <button onClick={() => { setShowCatForm(true); setCatForm({ ...catForm, rubro_id: rubros[0]?.id || '' }); }}>
            <Plus size={16} /> Categoría
          </button>
        </div>
      </div>

      {/* Create Rubro Form */}
      {showRubroForm && (
        <div className="glass-card animate-slideUp" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Nuevo Rubro</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
            <div>
              <label>Nombre</label>
              <input value={rubroForm.nombre} onChange={e => setRubroForm({ ...rubroForm, nombre: e.target.value })} placeholder="Ej: Suplementos" />
            </div>
            <div>
              <label>Icono (emoji)</label>
              <input value={rubroForm.icono} onChange={e => setRubroForm({ ...rubroForm, icono: e.target.value })} placeholder="💪" />
            </div>
            <div>
              <label>Descripción</label>
              <input value={rubroForm.descripcion} onChange={e => setRubroForm({ ...rubroForm, descripcion: e.target.value })} placeholder="Opcional" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleCreateRubro} disabled={!rubroForm.nombre}>Crear Rubro</button>
            <button className="secondary" onClick={() => setShowRubroForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Create Categoria Form */}
      {showCatForm && (
        <div className="glass-card animate-slideUp" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Nueva Categoría</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1rem' }}>
            <div>
              <label>Nombre</label>
              <input value={catForm.nombre} onChange={e => setCatForm({ ...catForm, nombre: e.target.value })} placeholder="Ej: Proteínas" />
            </div>
            <div>
              <label>Rubro</label>
              <select value={catForm.rubro_id} onChange={e => setCatForm({ ...catForm, rubro_id: e.target.value })}>
                <option value="">Seleccionar rubro</option>
                {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            <div>
              <label>Descripción</label>
              <input value={catForm.descripcion} onChange={e => setCatForm({ ...catForm, descripcion: e.target.value })} placeholder="Opcional" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleCreateCat} disabled={!catForm.nombre || !catForm.rubro_id}>Crear Categoría</button>
            <button className="secondary" onClick={() => setShowCatForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Rubros List */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
        </div>
      ) : rubros.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Layers size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No hay rubros</h3>
          <p style={{ color: 'var(--text-muted)' }}>Creá un rubro para organizar tus categorías.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rubros.map(rubro => (
            <div key={rubro.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{rubro.icono || '📦'}</span>
                  <div>
                    <h3 style={{ marginBottom: '0.125rem' }}>{rubro.nombre}</h3>
                    {rubro.descripcion && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{rubro.descripcion}</p>}
                  </div>
                </div>
                <span className="badge badge-blue">{rubro.categorias?.length || 0} categorías</span>
              </div>

              {rubro.categorias && rubro.categorias.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {rubro.categorias.map(cat => (
                    <div key={cat.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem', borderRadius: 10, background: 'var(--bg-secondary)',
                    }}>
                      <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{cat.nombre}</span>
                      <ChevronRight size={16} color="var(--text-light)" />
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  Sin categorías. Agregá una nueva.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
