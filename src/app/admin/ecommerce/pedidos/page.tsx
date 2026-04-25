'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, ChevronDown, ChevronUp, Phone, Mail, User, Edit2, Check, X, Trash2 } from 'lucide-react';
import { Pedido, PedidoItem } from '@/types/ecommerce';

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<PedidoItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPedidos = async () => {
    const params = new URLSearchParams();
    if (filterEstado) params.set('estado', filterEstado);
    const res = await fetch(`/api/ecommerce/pedidos?${params}`);
    const data = await res.json();
    setPedidos(data.pedidos || []);
    setLoading(false);
  };

  useEffect(() => { fetchPedidos(); }, [filterEstado]);

  const handleUpdateEstado = async (id: string, estado: string) => {
    await fetch(`/api/ecommerce/pedidos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    fetchPedidos();
  };

  const startEditing = (pedido: Pedido) => {
    setEditingId(pedido.id);
    // Clone items
    setEditItems(pedido.items ? JSON.parse(JSON.stringify(pedido.items)) : []);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditItems([]);
  };

  const handleEditQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setEditItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, cantidad: newQuantity, subtotal: item.precio_unitario * newQuantity };
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setEditItems(prev => prev.filter(item => item.id !== itemId));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setIsSaving(true);
    try {
      await fetch(`/api/ecommerce/pedidos/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: editItems }),
      });
      await fetchPedidos();
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert('Error guardando los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

  const estados = ['pendiente', 'procesando', 'completado', 'cancelado'];
  const estadoColors: Record<string, string> = {
    pendiente: 'badge-amber',
    procesando: 'badge-blue',
    completado: 'badge-green',
    cancelado: 'badge-red',
  };

  return (
    <div className="page-container">
      <Link href="/admin/ecommerce">
        <button className="btn-ghost" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Ecommerce
        </button>
      </Link>

      <h1 style={{ marginBottom: '1.5rem' }}>Pedidos</h1>

      {/* Filters */}
      <div className="nav-pill-container" style={{ marginBottom: '1.5rem', width: 'fit-content' }}>
        <button
          className={`nav-pill-button ${!filterEstado ? 'active' : ''}`}
          onClick={() => setFilterEstado('')}
        >
          Todos
        </button>
        {estados.map(est => (
          <button
            key={est}
            className={`nav-pill-button ${filterEstado === est ? 'active' : ''}`}
            onClick={() => setFilterEstado(est)}
          >
            {est.charAt(0).toUpperCase() + est.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <ShoppingCart size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3>No hay pedidos</h3>
          <p style={{ color: 'var(--text-muted)' }}>Los pedidos recibidos aparecerán acá.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {pedidos.map(pedido => {
            const isEditing = editingId === pedido.id;
            const itemsToRender = isEditing ? editItems : (pedido.items || []);
            const currentTotal = itemsToRender.reduce((sum, i) => sum + i.subtotal, 0);

            return (
              <div key={pedido.id} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
                {/* Header */}
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '1rem', flexWrap: 'wrap' }}
                  onClick={() => {
                    if (!isEditing) setExpandedId(expandedId === pedido.id ? null : pedido.id);
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                        #{String(pedido.numero_pedido).padStart(4, '0')}
                      </span>
                      <span className={`badge ${estadoColors[pedido.estado]}`}>{pedido.estado}</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={13} /> {pedido.cliente_nombre}
                      </span>
                      <span>{new Date(pedido.created_at).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.125rem' }}>{formatPrice(isEditing ? currentTotal : pedido.total)}</span>
                    {!isEditing && (
                      expandedId === pedido.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {(expandedId === pedido.id || isEditing) && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', animation: 'slideUp 0.2s ease-out' }}>
                    {/* Client info */}
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)' }}>
                        <Phone size={14} /> {pedido.cliente_telefono}
                      </span>
                      {pedido.cliente_email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)' }}>
                          <Mail size={14} /> {pedido.cliente_email}
                        </span>
                      )}
                    </div>

                    {/* Items */}
                    {itemsToRender.length > 0 ? (
                      <div style={{ marginBottom: '1rem' }}>
                        {itemsToRender.map(item => {
                          const imgUrl = item.producto?.imagenes?.[0];
                          
                          return (
                            <div key={item.id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '0.75rem', borderRadius: 12, background: 'var(--bg-tertiary)',
                              marginBottom: '0.5rem', border: '1px solid var(--border-color)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                {imgUrl ? (
                                  <img src={imgUrl} alt={item.producto_nombre} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                                ) : (
                                  <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShoppingCart size={20} color="var(--text-light)" />
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                    {item.producto_nombre}
                                  </div>
                                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                    {formatPrice(item.precio_unitario)} c/u
                                  </div>
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                {isEditing ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                                      <button 
                                        className="btn-ghost" 
                                        style={{ padding: '0.25rem 0.5rem' }} 
                                        onClick={(e) => { e.stopPropagation(); handleEditQuantity(item.id, item.cantidad - 1); }}
                                      >
                                        -
                                      </button>
                                      <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: '1.5rem', textAlign: 'center' }}>{item.cantidad}</span>
                                      <button 
                                        className="btn-ghost" 
                                        style={{ padding: '0.25rem 0.5rem' }} 
                                        onClick={(e) => { e.stopPropagation(); handleEditQuantity(item.id, item.cantidad + 1); }}
                                      >
                                        +
                                      </button>
                                    </div>
                                    <button 
                                      className="btn-danger" 
                                      style={{ padding: '0.5rem' }}
                                      onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
                                      title="Eliminar artículo"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.125rem' }}>
                                      Cant: {item.cantidad}
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)' }}>
                                      {formatPrice(item.subtotal)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                       <p style={{ fontSize: '0.875rem', color: 'var(--accent-red)', marginBottom: '1rem' }}>No hay artículos en este pedido.</p>
                    )}

                    {pedido.notas && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                        📝 {pedido.notas}
                      </p>
                    )}

                    {/* Actions */}
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <button className="btn-green" onClick={(e) => { e.stopPropagation(); saveEdit(); }} disabled={isSaving}>
                          {isSaving ? 'Guardando...' : <><Check size={16} /> Guardar Cambios</>}
                        </button>
                        <button className="secondary" onClick={(e) => { e.stopPropagation(); cancelEditing(); }} disabled={isSaving}>
                          <X size={16} /> Cancelar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {estados.map(est => (
                            <button
                              key={est}
                              className={pedido.estado === est ? '' : 'secondary'}
                              onClick={(e) => { e.stopPropagation(); handleUpdateEstado(pedido.id, est); }}
                              style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                              disabled={pedido.estado === est}
                            >
                              {est.charAt(0).toUpperCase() + est.slice(1)}
                            </button>
                          ))}
                        </div>
                        <button className="secondary" onClick={(e) => { e.stopPropagation(); startEditing(pedido); }}>
                          <Edit2 size={16} /> Editar Pedido
                        </button>
                      </div>
                    )}
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
