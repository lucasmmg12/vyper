'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Edit, Trash2, Check, X, Loader2,
  List, Layers, Tag, Percent, ChevronDown, ChevronUp,
  Zap, DollarSign, Search, ToggleLeft, ToggleRight
} from 'lucide-react';
import { ListaPrecio, ListaPrecioEscalon, ProductoPromocion, Producto } from '@/types/ecommerce';

interface EscalonForm {
  cantidad_minima: string;
  porcentaje: string;
}

export default function ListasPreciosAdminPage() {
  const [listas, setListas] = useState<ListaPrecio[]>([]);
  const [promociones, setPromociones] = useState<ProductoPromocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listas' | 'promociones'>('listas');

  // List form
  const [showListForm, setShowListForm] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [listForm, setListForm] = useState({
    nombre: '', descripcion: '', tipo: 'markup' as 'markup' | 'escalonada',
    markup_pct: '50', activo: true, es_default: false,
  });
  const [escalones, setEscalones] = useState<EscalonForm[]>([
    { cantidad_minima: '1', porcentaje: '100' },
  ]);
  const [savingList, setSavingList] = useState(false);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);

  // Promotion form
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({
    producto_id: '', nombre: '', tipo: 'markup' as 'markup' | 'precio_fijo' | 'descuento',
    valor: '', cantidad_minima: '1', activo: true,
    fecha_inicio: '', fecha_fin: '',
  });
  const [savingPromo, setSavingPromo] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [prodResults, setProdResults] = useState<Producto[]>([]);
  const [selectedProdName, setSelectedProdName] = useState('');

  const fetchListas = useCallback(async () => {
    const res = await fetch('/api/ecommerce/listas-precios');
    const data = await res.json();
    setListas(data.listas || []);
  }, []);

  const fetchPromociones = useCallback(async () => {
    const res = await fetch('/api/ecommerce/promociones');
    const data = await res.json();
    setPromociones(data.promociones || []);
  }, []);

  useEffect(() => {
    Promise.all([fetchListas(), fetchPromociones()]).finally(() => setLoading(false));
  }, [fetchListas, fetchPromociones]);

  useEffect(() => {
    if (prodSearch.length >= 2) {
      const t = setTimeout(async () => {
        const res = await fetch(`/api/ecommerce/productos?all=true&limit=20&search=${encodeURIComponent(prodSearch)}`);
        const data = await res.json();
        setProdResults(data.productos || []);
      }, 300);
      return () => clearTimeout(t);
    } else {
      setProdResults([]);
    }
  }, [prodSearch]);

  // ═══════ LIST HANDLERS ═══════
  const resetListForm = () => {
    setListForm({ nombre: '', descripcion: '', tipo: 'markup', markup_pct: '50', activo: true, es_default: false });
    setEscalones([{ cantidad_minima: '1', porcentaje: '100' }]);
    setEditingListId(null);
  };

  const handleEditList = (lista: ListaPrecio) => {
    setListForm({
      nombre: lista.nombre, descripcion: lista.descripcion || '',
      tipo: lista.tipo, markup_pct: String(Math.round((lista.markup - 1) * 100)),
      activo: lista.activo, es_default: lista.es_default,
    });
    setEscalones(
      (lista.escalones || []).length > 0
        ? lista.escalones!.map(e => ({ cantidad_minima: String(e.cantidad_minima), porcentaje: String(Math.round((e.multiplicador - 1) * 100)) }))
        : [{ cantidad_minima: '1', porcentaje: '100' }]
    );
    setEditingListId(lista.id);
    setShowListForm(true);
  };

  const handleSaveList = async () => {
    if (!listForm.nombre) return;
    setSavingList(true);

    const markupMultiplier = 1 + (parseFloat(listForm.markup_pct) || 0) / 100;
    const payload: Record<string, unknown> = {
      nombre: listForm.nombre,
      descripcion: listForm.descripcion || null,
      tipo: listForm.tipo,
      markup: markupMultiplier,
      activo: listForm.activo,
      es_default: listForm.es_default,
    };

    if (listForm.tipo === 'escalonada') {
      payload.escalones = escalones
        .filter(e => e.cantidad_minima && e.porcentaje)
        .map(e => ({
          cantidad_minima: parseInt(e.cantidad_minima),
          multiplicador: 1 + (parseFloat(e.porcentaje) || 0) / 100,
        }));
    }

    try {
      if (editingListId) {
        await fetch(`/api/ecommerce/listas-precios/${editingListId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/ecommerce/listas-precios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowListForm(false);
      resetListForm();
      fetchListas();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingList(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('¿Eliminar esta lista de precios?')) return;
    await fetch(`/api/ecommerce/listas-precios/${id}`, { method: 'DELETE' });
    fetchListas();
  };

  const handleToggleList = async (lista: ListaPrecio) => {
    await fetch(`/api/ecommerce/listas-precios/${lista.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !lista.activo }),
    });
    fetchListas();
  };

  // ═══════ PROMOTION HANDLERS ═══════
  const resetPromoForm = () => {
    setPromoForm({ producto_id: '', nombre: '', tipo: 'markup', valor: '', cantidad_minima: '1', activo: true, fecha_inicio: '', fecha_fin: '' });
    setSelectedProdName('');
    setProdSearch('');
  };

  const handleSavePromo = async () => {
    if (!promoForm.producto_id || !promoForm.nombre || !promoForm.valor) return;
    setSavingPromo(true);

    try {
      await fetch('/api/ecommerce/promociones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...promoForm,
          valor: promoForm.tipo === 'markup'
            ? 1 + (parseFloat(promoForm.valor) || 0) / 100
            : parseFloat(promoForm.valor),
          cantidad_minima: parseInt(promoForm.cantidad_minima) || 1,
          fecha_inicio: promoForm.fecha_inicio || null,
          fecha_fin: promoForm.fecha_fin || null,
        }),
      });
      setShowPromoForm(false);
      resetPromoForm();
      fetchPromociones();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPromo(false);
    }
  };

  const handleTogglePromo = async (promo: ProductoPromocion) => {
    await fetch(`/api/ecommerce/promociones/${promo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !promo.activo }),
    });
    fetchPromociones();
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    await fetch(`/api/ecommerce/promociones/${id}`, { method: 'DELETE' });
    fetchPromociones();
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

  const formatMultiplier = (m: number) => {
    const markup = Math.round((m - 1) * 100);
    return `×${m} (${markup}% markup)`;
  };

  return (
    <div className="page-container">
      <Link href="/admin/ecommerce">
        <button className="btn-ghost" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Ecommerce
        </button>
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Listas de Precios</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Configurá markups globales, listas escalonadas y promociones por producto
          </p>
        </div>
      </div>

      {/* ═══════ TABS ═══════ */}
      <div className="nav-pill-container" style={{ marginBottom: '1.5rem', maxWidth: 480 }}>
        <button
          className={`nav-pill-button ${activeTab === 'listas' ? 'active' : ''}`}
          onClick={() => setActiveTab('listas')}
        >
          <List size={16} /> Listas Globales
        </button>
        <button
          className={`nav-pill-button ${activeTab === 'promociones' ? 'active' : ''}`}
          onClick={() => setActiveTab('promociones')}
        >
          <Zap size={16} /> Promociones por Producto
        </button>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* LISTAS TAB */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === 'listas' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => { resetListForm(); setShowListForm(true); }}>
              <Plus size={18} /> Nueva Lista
            </button>
          </div>

          {/* List form modal */}
          {showListForm && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}>
              <div className="glass-card animate-scaleIn" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>
                  {editingListId ? 'Editar Lista' : 'Nueva Lista de Precios'}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label>Nombre *</label>
                    <input value={listForm.nombre} onChange={e => setListForm({ ...listForm, nombre: e.target.value })} placeholder="Ej: Mayorista Gold" />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label>Descripción</label>
                    <input value={listForm.descripcion} onChange={e => setListForm({ ...listForm, descripcion: e.target.value })} placeholder="Descripción opcional" />
                  </div>

                  {/* Type selector */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label>Tipo de Lista</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem', marginBottom: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => setListForm({ ...listForm, tipo: 'markup' })}
                        style={{
                          flex: 1, padding: '0.75rem', borderRadius: 12,
                          background: listForm.tipo === 'markup' ? 'var(--accent-blue-light)' : 'var(--bg-secondary)',
                          color: listForm.tipo === 'markup' ? 'var(--accent-blue)' : 'var(--text-muted)',
                          border: `2px solid ${listForm.tipo === 'markup' ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                          fontWeight: 700, fontSize: '0.8125rem',
                          boxShadow: 'none',
                        }}
                      >
                        <Percent size={16} style={{ marginRight: 6 }} />
                        Markup Fijo
                      </button>
                      <button
                        type="button"
                        onClick={() => setListForm({ ...listForm, tipo: 'escalonada' })}
                        style={{
                          flex: 1, padding: '0.75rem', borderRadius: 12,
                          background: listForm.tipo === 'escalonada' ? 'var(--accent-blue-light)' : 'var(--bg-secondary)',
                          color: listForm.tipo === 'escalonada' ? 'var(--accent-blue)' : 'var(--text-muted)',
                          border: `2px solid ${listForm.tipo === 'escalonada' ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                          fontWeight: 700, fontSize: '0.8125rem',
                          boxShadow: 'none',
                        }}
                      >
                        <Layers size={16} style={{ marginRight: 6 }} />
                        Escalonada
                      </button>
                    </div>
                  </div>

                  {/* Markup field (for fixed) */}
                  {listForm.tipo === 'markup' && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <label>Markup (%)</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number" step="1" min="0" value={listForm.markup_pct}
                          onChange={e => setListForm({ ...listForm, markup_pct: e.target.value })}
                          placeholder="50"
                          style={{ paddingRight: '2.5rem' }}
                        />
                        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', marginTop: '-0.375rem' }}>%</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '-0.75rem', marginBottom: '1rem' }}>
                        💡 Ej: 50% = Producto de costo $100 → venta a $150
                      </div>
                    </div>
                  )}

                  {/* Escalones (for tiered) */}
                  {listForm.tipo === 'escalonada' && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ margin: 0 }}>Escalones por Cantidad</label>
                        <button className="btn-ghost" onClick={() => setEscalones([...escalones, { cantidad_minima: '', porcentaje: '' }])}
                          style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', padding: '0.25rem 0.5rem' }}>
                          <Plus size={12} /> Agregar
                        </button>
                      </div>

                      {escalones.map((esc, idx) => (
                        <div key={idx} style={{
                          display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: '0.5rem',
                          alignItems: 'end', marginBottom: '0.5rem',
                          padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 10,
                        }}>
                          <div>
                            <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Cant. Mínima</label>
                            <input type="number" min="1" value={esc.cantidad_minima}
                              onChange={e => {
                                const u = [...escalones]; u[idx].cantidad_minima = e.target.value; setEscalones(u);
                              }}
                              placeholder="1" style={{ marginBottom: 0 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Markup (%)</label>
                            <div style={{ position: 'relative' }}>
                              <input type="number" step="1" min="0" value={esc.porcentaje}
                                onChange={e => {
                                  const u = [...escalones]; u[idx].porcentaje = e.target.value; setEscalones(u);
                                }}
                                placeholder="70" style={{ marginBottom: 0, paddingRight: '2rem' }}
                              />
                              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8125rem' }}>%</span>
                            </div>
                          </div>
                          <button className="btn-ghost" onClick={() => setEscalones(escalones.filter((_, i) => i !== idx))}
                            disabled={escalones.length <= 1}
                            style={{ padding: '0.375rem', color: 'var(--accent-red)', minHeight: 'auto', marginBottom: '0.375rem' }}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginBottom: '1rem' }}>
                        💡 Ej: 1 unidad → 100% (costo $100 → $200) · 3 unidades → 50% (costo $100 → $150)
                      </div>
                    </div>
                  )}

                  {/* Flags */}
                  <div style={{ display: 'flex', gap: '1.5rem', gridColumn: 'span 2', paddingTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={listForm.activo} onChange={e => setListForm({ ...listForm, activo: e.target.checked })} style={{ width: 18, height: 18, minHeight: 'auto' }} />
                      Activa
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={listForm.es_default} onChange={e => setListForm({ ...listForm, es_default: e.target.checked })} style={{ width: 18, height: 18, minHeight: 'auto' }} />
                      ⭐ Default
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button onClick={handleSaveList} disabled={savingList || !listForm.nombre} style={{ flex: 1 }}>
                    {savingList ? 'Guardando...' : (editingListId ? 'Actualizar' : 'Crear Lista')}
                  </button>
                  <button className="secondary" onClick={() => { setShowListForm(false); resetListForm(); }}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Lists grid */}
          {loading ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
            </div>
          ) : listas.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <List size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No hay listas de precios</h3>
              <p style={{ color: 'var(--text-muted)' }}>Creá tu primera lista para definir markups.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {listas.map(lista => {
                const isExpanded = expandedListId === lista.id;
                return (
                  <div key={lista.id} className="glass-card" style={{ padding: 0, overflow: 'hidden', opacity: lista.activo ? 1 : 0.6 }}>
                    <div
                      onClick={() => setExpandedListId(isExpanded ? null : lista.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem 1.25rem', cursor: 'pointer', gap: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 10,
                          background: lista.tipo === 'escalonada' ? 'rgba(139, 92, 246, 0.1)' : 'var(--accent-blue-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: lista.tipo === 'escalonada' ? '#8B5CF6' : 'var(--accent-blue)',
                          flexShrink: 0,
                        }}>
                          {lista.tipo === 'escalonada' ? <Layers size={20} /> : <Percent size={20} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {lista.nombre}
                            {lista.es_default && <span style={{ fontSize: '0.625rem', background: 'var(--accent-amber-light)', color: 'var(--accent-amber)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>DEFAULT</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {lista.tipo === 'markup'
                              ? `Markup fijo: ${Math.round((lista.markup - 1) * 100)}%`
                              : `Escalonada · ${(lista.escalones || []).length} escalones`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <span className={`badge ${lista.activo ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.6875rem' }}>
                          {lista.activo ? 'Activa' : 'Inactiva'}
                        </span>
                        {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--border-light)', padding: '1rem 1.25rem' }}>
                        {lista.descripcion && (
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            {lista.descripcion}
                          </p>
                        )}

                        {/* Escalones detail */}
                        {lista.tipo === 'escalonada' && (lista.escalones || []).length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                              Escalones
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                              {(lista.escalones || []).map((esc, i) => (
                                <div key={esc.id || i} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '0.625rem 1rem', background: 'var(--bg-secondary)', borderRadius: 8,
                                }}>
                                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                                    {esc.cantidad_minima === 1 ? '1 unidad' : `${esc.cantidad_minima}+ unidades`}
                                  </span>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '0.875rem' }}>
                                    {Math.round((esc.multiplicador - 1) * 100)}%
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Example calculation */}
                            <div style={{
                              marginTop: '0.75rem', padding: '0.75rem 1rem',
                              background: 'var(--accent-blue-light)', borderRadius: 8,
                              fontSize: '0.75rem', color: 'var(--accent-blue)',
                            }}>
                              <strong>💡 Ejemplo:</strong> Producto de costo $1.000
                              {(lista.escalones || []).map((esc, i) => (
                                <span key={i}> · {esc.cantidad_minima}u → {formatPrice(1000 * esc.multiplicador)} ({Math.round((esc.multiplicador - 1) * 100)}%)</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Markup example */}
                        {lista.tipo === 'markup' && (
                          <div style={{
                            padding: '0.75rem 1rem', background: 'var(--accent-blue-light)',
                            borderRadius: 8, fontSize: '0.75rem', color: 'var(--accent-blue)', marginBottom: '1rem',
                          }}>
                            <strong>💡 Ejemplo:</strong> Producto de costo $1.000 → Precio venta: {formatPrice(1000 * lista.markup)} ({Math.round((lista.markup - 1) * 100)}% markup)
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn-ghost" onClick={() => handleToggleList(lista)} style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
                            {lista.activo ? <><ToggleRight size={16} /> Desactivar</> : <><ToggleLeft size={16} /> Activar</>}
                          </button>
                          <button className="btn-ghost" onClick={() => handleEditList(lista)} style={{ padding: '0.375rem' }}>
                            <Edit size={16} />
                          </button>
                          <button className="btn-ghost" onClick={() => handleDeleteList(lista.id)} style={{ padding: '0.375rem', color: 'var(--accent-red)' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* PROMOTIONS TAB */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === 'promociones' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => { resetPromoForm(); setShowPromoForm(true); }}>
              <Plus size={18} /> Nueva Promoción
            </button>
          </div>

          {/* Promo form modal */}
          {showPromoForm && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}>
              <div className="glass-card animate-scaleIn" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Nueva Promoción por Producto</h3>

                {/* Product selector */}
                <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                  <label>Producto *</label>
                  {selectedProdName ? (
                    <div style={{
                      padding: '0.75rem 1rem', background: 'var(--bg-color)', border: '1px solid var(--accent-green)',
                      borderRadius: 12, fontSize: '0.875rem', fontWeight: 600, marginTop: '0.375rem', marginBottom: '1rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span>{selectedProdName}</span>
                      <button className="btn-ghost" onClick={() => { setPromoForm({ ...promoForm, producto_id: '' }); setSelectedProdName(''); }}
                        style={{ padding: 2, fontSize: 0, minHeight: 'auto' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        placeholder="Buscar producto..."
                        value={prodSearch}
                        onChange={e => setProdSearch(e.target.value)}
                      />
                      {prodResults.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                          background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                          borderRadius: 10, maxHeight: 200, overflowY: 'auto',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        }}>
                          {prodResults.map(p => (
                            <div key={p.id}
                              onClick={() => {
                                setPromoForm({ ...promoForm, producto_id: p.id });
                                setSelectedProdName(p.nombre);
                                setProdSearch('');
                                setProdResults([]);
                              }}
                              style={{
                                padding: '0.625rem 0.875rem', cursor: 'pointer',
                                fontSize: '0.8125rem', borderBottom: '1px solid var(--border-light)',
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{p.nombre}</span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.75rem' }}>
                                Costo: {formatPrice(p.precio_costo || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <label>Nombre de la promo *</label>
                <input value={promoForm.nombre} onChange={e => setPromoForm({ ...promoForm, nombre: e.target.value })} placeholder="Ej: Promo Proteína x3" />

                {/* Type */}
                <label>Tipo</label>
                <select value={promoForm.tipo} onChange={e => setPromoForm({ ...promoForm, tipo: e.target.value as 'markup' | 'precio_fijo' | 'descuento' })}>
                  <option value="markup">Markup especial (%)</option>
                  <option value="precio_fijo">Precio fijo</option>
                  <option value="descuento">Descuento %</option>
                </select>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                  <div>
                    <label>
                      {promoForm.tipo === 'markup' ? 'Markup (%)' : promoForm.tipo === 'precio_fijo' ? 'Precio ($)' : 'Descuento (%)'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input type="number" step="1" min="0" value={promoForm.valor}
                        onChange={e => setPromoForm({ ...promoForm, valor: e.target.value })}
                        placeholder={promoForm.tipo === 'markup' ? '50' : promoForm.tipo === 'precio_fijo' ? '5000' : '10'}
                        style={promoForm.tipo !== 'precio_fijo' ? { paddingRight: '2.5rem' } : {}}
                      />
                      {promoForm.tipo !== 'precio_fijo' && (
                        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', marginTop: '-0.375rem' }}>%</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label>Cant. Mínima</label>
                    <input type="number" min="1" value={promoForm.cantidad_minima}
                      onChange={e => setPromoForm({ ...promoForm, cantidad_minima: e.target.value })} />
                  </div>
                  <div>
                    <label>Desde (opcional)</label>
                    <input type="date" value={promoForm.fecha_inicio}
                      onChange={e => setPromoForm({ ...promoForm, fecha_inicio: e.target.value })} />
                  </div>
                  <div>
                    <label>Hasta (opcional)</label>
                    <input type="date" value={promoForm.fecha_fin}
                      onChange={e => setPromoForm({ ...promoForm, fecha_fin: e.target.value })} />
                  </div>
                </div>

                {promoForm.tipo === 'markup' && promoForm.valor && (
                  <div style={{
                    padding: '0.75rem 1rem', background: 'var(--accent-blue-light)', borderRadius: 8,
                    fontSize: '0.75rem', color: 'var(--accent-blue)', marginBottom: '1rem',
                  }}>
                    💡 {promoForm.valor}% markup → Producto de costo $1.000 → venta a {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(1000 * (1 + (parseFloat(promoForm.valor) || 0) / 100))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button onClick={handleSavePromo} disabled={savingPromo || !promoForm.producto_id || !promoForm.nombre || !promoForm.valor} style={{ flex: 1 }}>
                    {savingPromo ? 'Guardando...' : 'Crear Promoción'}
                  </button>
                  <button className="secondary" onClick={() => { setShowPromoForm(false); resetPromoForm(); }}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Promotions list */}
          {loading ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
            </div>
          ) : promociones.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Zap size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No hay promociones</h3>
              <p style={{ color: 'var(--text-muted)' }}>Las promociones permiten override de precios para productos específicos.</p>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '0.5rem' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Producto', 'Promoción', 'Tipo', 'Valor', 'Cant. Mín', 'Estado', 'Acciones'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '0.75rem 1rem',
                          fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                          borderBottom: '1px solid var(--border-light)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {promociones.map(promo => (
                      <tr key={promo.id} style={{ borderBottom: '1px solid var(--border-light)', opacity: promo.activo ? 1 : 0.5 }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem' }}>
                          {(promo.producto as unknown as Producto)?.nombre || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{promo.nombre}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${promo.tipo === 'markup' ? 'badge-blue' : promo.tipo === 'precio_fijo' ? 'badge-green' : 'badge-amber'}`}>
                            {promo.tipo === 'markup' ? 'Markup' : promo.tipo === 'precio_fijo' ? 'Precio Fijo' : 'Descuento'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {promo.tipo === 'markup' ? `${Math.round((promo.valor - 1) * 100)}%` : promo.tipo === 'precio_fijo' ? formatPrice(promo.valor) : `${promo.valor}%`}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>{promo.cantidad_minima}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${promo.activo ? 'badge-green' : 'badge-gray'}`}>
                            {promo.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className="btn-ghost" onClick={() => handleTogglePromo(promo)} style={{ padding: '0.375rem' }}>
                              {promo.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                            <button className="btn-ghost" onClick={() => handleDeletePromo(promo.id)} style={{ padding: '0.375rem', color: 'var(--accent-red)' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
