'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, ChevronRight, Layers } from 'lucide-react';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { Rubro, Categoria } from '@/types/ecommerce';

export default function CategoriasAdminPage() {
  const [rubros, setRubros] = useState<(Rubro & { categorias?: Categoria[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRubroForm, setShowRubroForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [rubroForm, setRubroForm] = useState({ id: '', nombre: '', descripcion: '', icono: '' });
  const [catForm, setCatForm] = useState({ id: '', nombre: '', descripcion: '', rubro_id: '' });
  
  // Modals state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'rubro' | 'categoria'; id: string; name: string } | null>(null);

  const fetchRubros = async () => {
    const res = await fetch('/api/ecommerce/rubros');
    const data = await res.json();
    setRubros(data.rubros || []);
    setLoading(false);
  };

  useEffect(() => { fetchRubros(); }, []);

  const handleSaveRubro = async () => {
    if (!rubroForm.nombre) return;
    
    if (rubroForm.id) {
      await fetch(`/api/ecommerce/rubros/${rubroForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: rubroForm.nombre, descripcion: rubroForm.descripcion, icono: rubroForm.icono }),
      });
    } else {
      await fetch('/api/ecommerce/rubros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: rubroForm.nombre, descripcion: rubroForm.descripcion, icono: rubroForm.icono }),
      });
    }
    setRubroForm({ id: '', nombre: '', descripcion: '', icono: '' });
    setShowRubroForm(false);
    fetchRubros();
  };

  const handleSaveCat = async () => {
    if (!catForm.nombre || !catForm.rubro_id) return;
    
    if (catForm.id) {
      await fetch(`/api/ecommerce/categorias/${catForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: catForm.nombre, descripcion: catForm.descripcion, rubro_id: catForm.rubro_id }),
      });
    } else {
      await fetch('/api/ecommerce/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: catForm.nombre, descripcion: catForm.descripcion, rubro_id: catForm.rubro_id }),
      });
    }
    setCatForm({ id: '', nombre: '', descripcion: '', rubro_id: '' });
    setShowCatForm(false);
    fetchRubros();
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    if (deleteModal.type === 'rubro') {
      await fetch(`/api/ecommerce/rubros/${deleteModal.id}`, { method: 'DELETE' });
    } else {
      await fetch(`/api/ecommerce/categorias/${deleteModal.id}`, { method: 'DELETE' });
    }
    setDeleteModal(null);
    fetchRubros();
  };

  return (
    <div className="page-container">
      {deleteModal && (
        <ConfirmDeleteModal
          title={`Eliminar ${deleteModal.type === 'rubro' ? 'Rubro' : 'Categoría'}`}
          message={deleteModal.type === 'rubro' ? `¿Seguro que querés eliminar el rubro "${deleteModal.name}"? Se perderán todas sus categorías asociadas.` : `¿Seguro que querés eliminar la categoría "${deleteModal.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      <Link href="/admin/ecommerce">
        <button className="btn-ghost" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Ecommerce
        </button>
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Rubros y Categorías</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="secondary" onClick={() => { setRubroForm({ id: '', nombre: '', descripcion: '', icono: '' }); setShowRubroForm(true); }}>
            <Plus size={16} /> Rubro
          </button>
          <button onClick={() => { setCatForm({ id: '', nombre: '', descripcion: '', rubro_id: rubros[0]?.id || '' }); setShowCatForm(true); }}>
            <Plus size={16} /> Categoría
          </button>
        </div>
      </div>

      {/* Rubro Form */}
      {showRubroForm && (
        <div className="glass-card animate-slideUp" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{rubroForm.id ? 'Editar Rubro' : 'Nuevo Rubro'}</h3>
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
            <button onClick={handleSaveRubro} disabled={!rubroForm.nombre}>{rubroForm.id ? 'Guardar Cambios' : 'Crear Rubro'}</button>
            <button className="secondary" onClick={() => setShowRubroForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Categoria Form */}
      {showCatForm && (
        <div className="glass-card animate-slideUp" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{catForm.id ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
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
            <button onClick={handleSaveCat} disabled={!catForm.nombre || !catForm.rubro_id}>{catForm.id ? 'Guardar Cambios' : 'Crear Categoría'}</button>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="badge badge-blue" style={{ marginRight: '0.75rem' }}>{rubro.categorias?.length || 0} categorías</span>
                  <button 
                    className="btn-ghost" 
                    style={{ padding: '0.375rem', color: 'var(--text-muted)' }}
                    onClick={() => {
                      setRubroForm({ id: rubro.id, nombre: rubro.nombre, descripcion: rubro.descripcion || '', icono: rubro.icono || '' });
                      setShowRubroForm(true);
                    }}
                    title="Editar Rubro"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="btn-ghost" 
                    style={{ padding: '0.375rem', color: 'var(--accent-red)' }}
                    onClick={() => setDeleteModal({ isOpen: true, type: 'rubro', id: rubro.id, name: rubro.nombre })}
                    title="Eliminar Rubro"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {rubro.categorias && rubro.categorias.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {rubro.categorias.map(cat => (
                    <div key={cat.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem', borderRadius: 10, background: 'var(--bg-secondary)',
                    }}>
                      <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{cat.nombre}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button 
                          className="btn-ghost" 
                          style={{ padding: '0.25rem', color: 'var(--text-muted)' }}
                          onClick={() => {
                            setCatForm({ id: cat.id, nombre: cat.nombre, descripcion: cat.descripcion || '', rubro_id: rubro.id });
                            setShowCatForm(true);
                          }}
                          title="Editar Categoría"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn-ghost" 
                          style={{ padding: '0.25rem', color: 'var(--accent-red)' }}
                          onClick={() => setDeleteModal({ isOpen: true, type: 'categoria', id: cat.id, name: cat.nombre })}
                          title="Eliminar Categoría"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
