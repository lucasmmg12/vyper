'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ShoppingCart, ChevronDown, ChevronUp, Phone, Mail, User,
  Edit2, Check, X, Trash2, Printer, Search, ExternalLink, CreditCard, MessageCircle, Coins
} from 'lucide-react';
import { Pedido, PedidoItem } from '@/types/ecommerce';

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Automation toggles
  const [notificarWhatsapp, setNotificarWhatsapp] = useState(true);
  const [registrarVentaErp, setRegistrarVentaErp] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<PedidoItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchPedidos = async () => {
    const params = new URLSearchParams();
    if (filterEstado) params.set('estado', filterEstado);
    const res = await fetch(`/api/ecommerce/pedidos?${params}`);
    const data = await res.json();
    setPedidos(data.pedidos || []);
    setLoading(false);
  };

  useEffect(() => { fetchPedidos(); }, [filterEstado]);

  const handleUpdateEstado = async (id: string, estado: string, pasarACtaCte = false) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/ecommerce/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado,
          notificar_whatsapp: notificarWhatsapp,
          registrar_venta_erp: registrarVentaErp,
          pasar_a_cta_cte: pasarACtaCte,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const parts: string[] = [`Estado actualizado a ${estado.toUpperCase()}`];
        if (data.whatsappSent) parts.push('📲 WhatsApp enviado');
        if (data.erpResult?.passedToDebt) {
          parts.push(`💳 Cargado en Cta. Corriente (Saldo: $${Number(data.erpResult.newDebtBalance || 0).toLocaleString('es-AR')})`);
        } else if (data.erpResult?.saleRecorded) {
          parts.push(`🪙 Venta ERP + ${data.erpResult.earnedCoins || 0} Vyper Coins acreditadas`);
        }
        showToast(parts.join(' · '));
      }
      await fetchPedidos();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el pedido');
    } finally {
      setUpdatingId(null);
    }
  };

  const startEditing = (pedido: Pedido) => {
    setEditingId(pedido.id);
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
      showToast('✅ Pedido actualizado');
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

  const filteredPedidos = pedidos.filter(p => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const numStr = String(p.numero_pedido).padStart(4, '0');
    const nameMatch = p.cliente_nombre?.toLowerCase().includes(term);
    const phoneMatch = p.cliente_telefono?.toLowerCase().includes(term);
    const numMatch = numStr.includes(term) || `#${numStr}`.includes(term);
    return nameMatch || phoneMatch || numMatch;
  });

  const totalFilteredAmount = filteredPedidos.reduce((sum, p) => sum + Number(p.total || 0), 0);

  return (
    <div className="page-container">
      <Link
        href="/admin/ecommerce"
        className="btn-ghost"
        style={{ display: 'inline-flex', marginBottom: '1rem', fontSize: '0.875rem', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={16} /> Ecommerce
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Pedidos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {filteredPedidos.length} pedidos en vista · Total acumulado: <strong>{formatPrice(totalFilteredAmount)}</strong>
          </p>
        </div>

        {/* Automation Toggles */}
        <div className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer', margin: 0, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={notificarWhatsapp}
              onChange={e => setNotificarWhatsapp(e.target.checked)}
              style={{ width: 16, height: 16, minHeight: 'auto', margin: 0 }}
            />
            📲 Notificar por WhatsApp al cambiar estado
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer', margin: 0, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={registrarVentaErp}
              onChange={e => setRegistrarVentaErp(e.target.checked)}
              style={{ width: 16, height: 16, minHeight: 'auto', margin: 0 }}
            />
            🪙 Acreditar Venta y Vyper Coins al completar
          </label>
        </div>
      </div>

      {toastMsg && (
        <div style={{
          padding: '0.875rem 1.25rem',
          marginBottom: '1rem',
          borderRadius: 12,
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid #10b981',
          color: '#10b981',
          fontWeight: 700,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>{toastMsg}</span>
          <button className="btn-ghost" onClick={() => setToastMsg(null)} style={{ padding: 4, minHeight: 'auto' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="nav-pill-container" style={{ width: 'fit-content' }}>
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

        <div style={{ position: 'relative', minWidth: 280, flex: '0 1 360px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono o #pedido..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem', margin: 0 }}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando pedidos...</p>
      ) : filteredPedidos.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <ShoppingCart size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3>No hay pedidos</h3>
          <p style={{ color: 'var(--text-muted)' }}>Los pedidos recibidos aparecerán acá.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredPedidos.map(pedido => {
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                        #{String(pedido.numero_pedido).padStart(4, '0')}
                      </span>
                      <span className={`badge ${estadoColors[pedido.estado]}`}>{pedido.estado}</span>
                      {pedido.notificado_whatsapp && (
                        <span className="badge badge-green" style={{ fontSize: '0.6875rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MessageCircle size={11} /> Notificado WA
                        </span>
                      )}
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
                    {/* Client info + Public Tracking Link */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)' }}>
                          <Phone size={14} /> {pedido.cliente_telefono}
                        </span>
                        {pedido.cliente_email && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)' }}>
                            <Mail size={14} /> {pedido.cliente_email}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/pedido/${pedido.id}`}
                        target="_blank"
                        onClick={e => e.stopPropagation()}
                        className="btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--accent-blue)' }}
                      >
                        <ExternalLink size={13} /> 🔗 Ver Tracking Público
                      </Link>
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
                              onClick={(e) => { e.stopPropagation(); handleUpdateEstado(pedido.id, est, false); }}
                              style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                              disabled={pedido.estado === est || updatingId === pedido.id}
                            >
                              {est.charAt(0).toUpperCase() + est.slice(1)}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            className="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`¿Pasar el pedido #${String(pedido.numero_pedido).padStart(4, '0')} (${formatPrice(pedido.total)}) a la Cuenta Corriente de ${pedido.cliente_nombre}?`)) {
                                handleUpdateEstado(pedido.id, 'completado', true);
                              }
                            }}
                            disabled={updatingId === pedido.id}
                            style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem', borderColor: '#f59e0b', color: '#d97706' }}
                            title="Registrar pedido en Cuenta Corriente del cliente y marcar como completado"
                          >
                            <CreditCard size={15} /> 💳 Pasar a Cta. Corriente
                          </button>
                          <button
                            className="secondary"
                            onClick={(e) => { e.stopPropagation(); window.open(`/admin/ecommerce/pedidos/${pedido.id}/print`, '_blank'); }}
                            title="Imprimir Factura"
                            style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}
                          >
                            <Printer size={15} /> Imprimir
                          </button>
                          <button
                            className="secondary"
                            onClick={(e) => { e.stopPropagation(); startEditing(pedido); }}
                            style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}
                          >
                            <Edit2 size={15} /> Editar Pedido
                          </button>
                        </div>
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
