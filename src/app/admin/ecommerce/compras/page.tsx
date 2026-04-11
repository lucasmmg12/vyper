'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Search, Trash2, PackagePlus, Check, X, Loader2,
  ChevronDown, ChevronUp, FileText, Calendar, Truck, AlertCircle
} from 'lucide-react';
import { Compra, Producto } from '@/types/ecommerce';

interface CompraFormItem {
  producto_id: string;
  producto_nombre: string;
  cantidad: string;
  precio_unitario: string;
}

export default function ComprasAdminPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Form state
  const [proveedor, setProveedor] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<CompraFormItem[]>([{ producto_id: '', producto_nombre: '', cantidad: '1', precio_unitario: '' }]);

  // Product search
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);

  const fetchCompras = useCallback(async () => {
    const res = await fetch('/api/ecommerce/compras');
    const data = await res.json();
    setCompras(data.compras || []);
    setLoading(false);
  }, []);

  const fetchProductos = useCallback(async (search: string) => {
    const res = await fetch(`/api/ecommerce/productos?all=true&limit=50&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setProductos(data.productos || []);
  }, []);

  useEffect(() => { fetchCompras(); }, [fetchCompras]);

  useEffect(() => {
    if (productSearch.length >= 2) {
      const t = setTimeout(() => fetchProductos(productSearch), 300);
      return () => clearTimeout(t);
    } else {
      setProductos([]);
    }
  }, [productSearch, fetchProductos]);

  const addItem = () => {
    setItems([...items, { producto_id: '', producto_nombre: '', cantidad: '1', precio_unitario: '' }]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof CompraFormItem, value: string) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const selectProduct = (idx: number, prod: Producto) => {
    setItems(items.map((item, i) => i === idx ? {
      ...item,
      producto_id: prod.id,
      producto_nombre: prod.nombre,
      precio_unitario: prod.precio_costo ? String(prod.precio_costo) : '',
    } : item));
    setActiveSearchIdx(null);
    setProductSearch('');
    setProductos([]);
  };

  const calcTotal = () => {
    return items.reduce((sum, item) => {
      return sum + (parseInt(item.cantidad) || 0) * (parseFloat(item.precio_unitario) || 0);
    }, 0);
  };

  const handleSave = async (confirmar: boolean) => {
    const validItems = items.filter(i => i.producto_id && i.cantidad && i.precio_unitario);
    if (validItems.length === 0) return;
    setSaving(true);

    try {
      await fetch('/api/ecommerce/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedor,
          numero_factura: numeroFactura,
          notas,
          confirmar,
          items: validItems.map(i => ({
            producto_id: i.producto_id,
            producto_nombre: i.producto_nombre,
            cantidad: parseInt(i.cantidad),
            precio_unitario: parseFloat(i.precio_unitario),
          })),
        }),
      });
      setShowForm(false);
      resetForm();
      fetchCompras();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      await fetch(`/api/ecommerce/compras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmar: true }),
      });
      fetchCompras();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta compra?')) return;
    await fetch(`/api/ecommerce/compras/${id}`, { method: 'DELETE' });
    fetchCompras();
  };

  const resetForm = () => {
    setProveedor('');
    setNumeroFactura('');
    setNotas('');
    setItems([{ producto_id: '', producto_nombre: '', cantidad: '1', precio_unitario: '' }]);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

  const estadoConfig: Record<string, { badge: string; label: string }> = {
    pendiente: { badge: 'badge-amber', label: '⏳ Pendiente' },
    confirmada: { badge: 'badge-green', label: '✅ Confirmada' },
    cancelada: { badge: 'badge-red', label: '❌ Cancelada' },
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
          <h1 style={{ marginBottom: '0.25rem' }}>Compras</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Registrá ingresos de mercadería · Actualizá stock y costos</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={18} /> Nueva Compra
        </button>
      </div>

      {/* ══════ NEW PURCHASE MODAL ══════ */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="glass-card animate-scaleIn" style={{
            width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h3 style={{ marginBottom: '1.5rem' }}>
              <PackagePlus size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Nueva Compra
            </h3>

            {/* Header fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div>
                <label>Proveedor</label>
                <input value={proveedor} onChange={e => setProveedor(e.target.value)} placeholder="Nombre del proveedor" />
              </div>
              <div>
                <label>N° Factura</label>
                <input value={numeroFactura} onChange={e => setNumeroFactura(e.target.value)} placeholder="Ej: FC-00123" />
              </div>
            </div>

            {/* Items */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem' }}>Productos</label>
                <button className="btn-ghost" onClick={addItem} style={{ fontSize: '0.8125rem', color: 'var(--accent-blue)', padding: '0.25rem 0.5rem' }}>
                  <Plus size={14} /> Agregar línea
                </button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 130px 36px',
                  gap: '0.5rem', alignItems: 'end', marginBottom: '0.5rem',
                  padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 12,
                }}>
                  {/* Product selector */}
                  <div style={{ position: 'relative' }}>
                    <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Producto</label>
                    {item.producto_nombre ? (
                      <div style={{
                        padding: '0.75rem 1rem', background: 'var(--bg-color)', border: '1px solid var(--accent-green)',
                        borderRadius: 12, fontSize: '0.875rem', fontWeight: 600, marginTop: '0.375rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span>{item.producto_nombre}</span>
                        <button className="btn-ghost" onClick={() => updateItem(idx, 'producto_id', '')} style={{ padding: 2, fontSize: 0, minHeight: 'auto' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          placeholder="Buscar producto..."
                          value={activeSearchIdx === idx ? productSearch : ''}
                          onFocus={() => setActiveSearchIdx(idx)}
                          onChange={e => { setProductSearch(e.target.value); setActiveSearchIdx(idx); }}
                          style={{ marginBottom: 0 }}
                        />
                        {activeSearchIdx === idx && productos.length > 0 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                            background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                            borderRadius: 10, maxHeight: 200, overflowY: 'auto',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          }}>
                            {productos.map(p => (
                              <div key={p.id}
                                onClick={() => selectProduct(idx, p)}
                                style={{
                                  padding: '0.625rem 0.875rem', cursor: 'pointer',
                                  fontSize: '0.8125rem', borderBottom: '1px solid var(--border-light)',
                                  display: 'flex', justifyContent: 'space-between',
                                }}
                              >
                                <span style={{ fontWeight: 600 }}>{p.nombre}</span>
                                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                                  Stock: {p.stock} · Costo: {formatPrice(p.precio_costo || 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Cant.</label>
                    <input
                      type="number" min="1" value={item.cantidad}
                      onChange={e => updateItem(idx, 'cantidad', e.target.value)}
                      style={{ marginBottom: 0, textAlign: 'center' }}
                    />
                  </div>

                  {/* Unit price */}
                  <div>
                    <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Costo Unit.</label>
                    <input
                      type="number" min="0" step="0.01" value={item.precio_unitario}
                      onChange={e => updateItem(idx, 'precio_unitario', e.target.value)}
                      style={{ marginBottom: 0 }}
                      placeholder="$0"
                    />
                  </div>

                  {/* Remove */}
                  <button className="btn-ghost" onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                    style={{ padding: '0.375rem', color: 'var(--accent-red)', marginBottom: '0.375rem', minHeight: 'auto' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label>Notas</label>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Notas adicionales..." />
            </div>

            {/* Total & Actions */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1rem 1.25rem', background: 'var(--bg-tertiary)', borderRadius: 12,
              marginBottom: '1rem',
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{formatPrice(calcTotal())}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleSave(true)} disabled={saving || !items.some(i => i.producto_id)} style={{ flex: 1 }} className="btn-green">
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</> : <><Check size={16} /> Confirmar y Actualizar Stock</>}
              </button>
              <button onClick={() => handleSave(false)} disabled={saving || !items.some(i => i.producto_id)} className="secondary" style={{ fontSize: '0.8125rem' }}>
                Guardar Pendiente
              </button>
              <button className="secondary" onClick={() => setShowForm(false)} style={{ fontSize: '0.8125rem' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ PURCHASES LIST ══════ */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-light)', marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Cargando compras...</p>
        </div>
      ) : compras.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <PackagePlus size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No hay compras registradas</h3>
          <p style={{ color: 'var(--text-muted)' }}>Registrá tu primera compra para actualizar stock y costos.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {compras.map(compra => {
            const cfg = estadoConfig[compra.estado] || estadoConfig.pendiente;
            const isExpanded = expandedId === compra.id;
            return (
              <div key={compra.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : compra.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem 1.25rem', cursor: 'pointer', gap: '1rem',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: compra.estado === 'confirmada' ? 'var(--accent-green-light)' : 'var(--accent-amber-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: compra.estado === 'confirmada' ? 'var(--accent-green)' : 'var(--accent-amber)',
                      flexShrink: 0,
                    }}>
                      {compra.estado === 'confirmada' ? <Check size={20} /> : <FileText size={20} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                        {compra.proveedor || 'Sin proveedor'}
                        {compra.numero_factura && (
                          <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8125rem', marginLeft: 8 }}>
                            #{compra.numero_factura}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Calendar size={12} />
                        {new Date(compra.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <span>·</span>
                        <span>{(compra.items || []).length} productos</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span className={`badge ${cfg.badge}`} style={{ fontSize: '0.6875rem' }}>{cfg.label}</span>
                    <span style={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
                      {formatPrice(compra.total)}
                    </span>
                    {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border-light)', padding: '1rem 1.25rem' }}>
                    {compra.notas && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                        📝 {compra.notas}
                      </div>
                    )}
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Producto', 'Cantidad', 'Costo Unit.', 'Subtotal'].map(h => (
                            <th key={h} style={{
                              textAlign: 'left', padding: '0.5rem 0.75rem',
                              fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)',
                              textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(compra.items || []).map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.875rem' }}>{item.producto_nombre}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{item.cantidad}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{formatPrice(item.precio_unitario)}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{formatPrice(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                      {compra.estado === 'pendiente' && (
                        <button className="btn-green" onClick={() => handleConfirm(compra.id)}
                          disabled={confirmingId === compra.id}
                          style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
                          {confirmingId === compra.id
                            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Confirmando...</>
                            : <><Check size={14} /> Confirmar · Actualizar Stock</>}
                        </button>
                      )}
                      {compra.estado !== 'confirmada' && (
                        <button className="btn-ghost" onClick={() => handleDelete(compra.id)}
                          style={{ padding: '0.5rem', color: 'var(--accent-red)' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
