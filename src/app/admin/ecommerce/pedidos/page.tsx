'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, ChevronDown, ChevronUp, Phone, Mail, User } from 'lucide-react';
import { Pedido } from '@/types/ecommerce';

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          {pedidos.map(pedido => (
            <div key={pedido.id} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
              {/* Header */}
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '1rem', flexWrap: 'wrap' }}
                onClick={() => setExpandedId(expandedId === pedido.id ? null : pedido.id)}
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
                  <span style={{ fontWeight: 800, fontSize: '1.125rem' }}>{formatPrice(pedido.total)}</span>
                  {expandedId === pedido.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedId === pedido.id && (
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
                  {pedido.items && pedido.items.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      {pedido.items.map(item => (
                        <div key={item.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.5rem 0.75rem', borderRadius: 8, background: 'var(--bg-secondary)',
                          marginBottom: '0.375rem',
                        }}>
                          <span style={{ fontSize: '0.875rem' }}>
                            <strong>{item.cantidad}x</strong> {item.producto_nombre}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatPrice(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {pedido.notas && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
                      📝 {pedido.notas}
                    </p>
                  )}

                  {/* Change status */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {estados.map(est => (
                      <button
                        key={est}
                        className={pedido.estado === est ? '' : 'secondary'}
                        onClick={() => handleUpdateEstado(pedido.id, est)}
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                        disabled={pedido.estado === est}
                      >
                        {est.charAt(0).toUpperCase() + est.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
