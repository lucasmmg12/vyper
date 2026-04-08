'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, ShoppingCart, Tag, Layers, ArrowLeft, Plus, TrendingUp,
  Clock, Users, BarChart3, DollarSign, Eye, AlertCircle, CheckCircle2,
  ArrowUpRight, ArrowDownRight, ExternalLink, Zap
} from 'lucide-react';
import { Pedido } from '@/types/ecommerce';

interface DashboardStats {
  totalProductos: number;
  productosActivos: number;
  productosSinStock: number;
  pedidosPendientes: number;
  pedidosHoy: number;
  pedidosSemana: number;
  totalVentas: number;
  ventasHoy: number;
  ventasSemana: number;
  clientesUnicos: number;
  ticketPromedio: number;
  totalPedidos: number;
}

export default function EcommerceAdminPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProductos: 0, productosActivos: 0, productosSinStock: 0,
    pedidosPendientes: 0, pedidosHoy: 0, pedidosSemana: 0,
    totalVentas: 0, ventasHoy: 0, ventasSemana: 0,
    clientesUnicos: 0, ticketPromedio: 0, totalPedidos: 0,
  });
  const [recentPedidos, setRecentPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productosRes, pedidosRes] = await Promise.all([
          fetch('/api/ecommerce/productos?all=true&limit=500'),
          fetch('/api/ecommerce/pedidos'),
        ]);
        const productosData = await productosRes.json();
        const pedidosData = await pedidosRes.json();

        const productos = productosData.productos || [];
        const pedidos: Pedido[] = pedidosData.pedidos || [];
        const today = new Date();
        const todayStr = today.toDateString();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const completados = pedidos.filter(p => p.estado === 'completado');
        const pedidosHoyList = pedidos.filter(p => new Date(p.created_at).toDateString() === todayStr);
        const pedidosSemanaList = pedidos.filter(p => new Date(p.created_at) >= weekAgo);
        const ventasCompletadas = completados.reduce((s, p) => s + p.total, 0);
        const ventasHoy = completados.filter(p => new Date(p.created_at).toDateString() === todayStr).reduce((s, p) => s + p.total, 0);
        const ventasSemana = completados.filter(p => new Date(p.created_at) >= weekAgo).reduce((s, p) => s + p.total, 0);
        const clientesUnicos = new Set(pedidos.map(p => p.cliente_email || p.cliente_telefono)).size;

        setStats({
          totalProductos: productos.length,
          productosActivos: productos.filter((p: { activo: boolean }) => p.activo).length,
          productosSinStock: productos.filter((p: { stock: number }) => p.stock === 0).length,
          pedidosPendientes: pedidos.filter(p => p.estado === 'pendiente').length,
          pedidosHoy: pedidosHoyList.length,
          pedidosSemana: pedidosSemanaList.length,
          totalVentas: ventasCompletadas,
          ventasHoy,
          ventasSemana,
          clientesUnicos,
          ticketPromedio: completados.length > 0 ? ventasCompletadas / completados.length : 0,
          totalPedidos: pedidos.length,
        });
        setRecentPedidos(pedidos.slice(0, 8));
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

  const estadoConfig: Record<string, { color: string; bg: string; badge: string; icon: React.ReactNode }> = {
    pendiente: { color: '#f59e0b', bg: '#fef3c7', badge: 'badge-amber', icon: <Clock size={14} /> },
    procesando: { color: '#3b82f6', bg: '#dbeafe', badge: 'badge-blue', icon: <Zap size={14} /> },
    completado: { color: '#10b981', bg: '#d1fae5', badge: 'badge-green', icon: <CheckCircle2 size={14} /> },
    cancelado: { color: '#ef4444', bg: '#fee2e2', badge: 'badge-red', icon: <AlertCircle size={14} /> },
  };

  const modules = [
    { href: '/admin/ecommerce/productos', icon: <Package size={22} />, title: 'Productos', desc: 'Catálogo, precios y stock', color: '#3b82f6', count: stats.totalProductos },
    { href: '/admin/ecommerce/categorias', icon: <Layers size={22} />, title: 'Categorías', desc: 'Rubros y categorías', color: '#10b981', count: null },
    { href: '/admin/ecommerce/marcas', icon: <Tag size={22} />, title: 'Marcas', desc: 'Gestionar marcas', color: '#f59e0b', count: null },
    { href: '/admin/ecommerce/pedidos', icon: <ShoppingCart size={22} />, title: 'Pedidos', desc: 'Gestionar pedidos', color: '#ef4444', count: stats.totalPedidos },
  ];

  const ld = loading;

  return (
    <div className="page-container" style={{ maxWidth: 1100 }}>
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem', fontSize: '1.75rem' }}>Ecommerce Mayorista</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Dashboard de gestión · Vyper Suplementos</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/tienda" target="_blank">
              <button className="secondary" style={{ fontSize: '0.8125rem' }}>
                <ExternalLink size={14} /> Ver Tienda
              </button>
            </Link>
            <Link href="/admin/ecommerce/productos">
              <button style={{ fontSize: '0.8125rem' }}>
                <Plus size={16} /> Nuevo Producto
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════ KPI HERO CARDS ═══════════ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1rem', marginBottom: '1.5rem',
      }}>
        {/* Ventas Totales */}
        <div className="glass-card" style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -15, right: -15, opacity: 0.15 }}>
            <DollarSign size={100} />
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ventas Totales</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, margin: '0.25rem 0' }}>{ld ? '—' : formatPrice(stats.totalVentas)}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowUpRight size={14} /> Hoy: {ld ? '—' : formatPrice(stats.ventasHoy)}
          </div>
        </div>

        {/* Pedidos */}
        <div className="glass-card" style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -15, right: -15, opacity: 0.15 }}>
            <ShoppingCart size={100} />
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Pedidos</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, margin: '0.25rem 0' }}>{ld ? '—' : stats.totalPedidos}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Hoy: {ld ? '—' : stats.pedidosHoy} · Semana: {ld ? '—' : stats.pedidosSemana}
          </div>
        </div>

        {/* Clientes */}
        <div className="glass-card" style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -15, right: -15, opacity: 0.15 }}>
            <Users size={100} />
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Clientes Únicos</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, margin: '0.25rem 0' }}>{ld ? '—' : stats.clientesUnicos}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Ticket prom: {ld ? '—' : formatPrice(stats.ticketPromedio)}
          </div>
        </div>
      </div>

      {/* ═══════════ SECONDARY METRICS ═══════════ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
        gap: '0.75rem', marginBottom: '2rem',
      }}>
        {[
          { label: 'Productos Activos', value: ld ? '—' : `${stats.productosActivos}/${stats.totalProductos}`, icon: <Eye size={18} />, color: '#3b82f6' },
          { label: 'Sin Stock', value: ld ? '—' : stats.productosSinStock, icon: <AlertCircle size={18} />, color: stats.productosSinStock > 0 ? '#ef4444' : '#10b981' },
          { label: 'Pendientes', value: ld ? '—' : stats.pedidosPendientes, icon: <Clock size={18} />, color: stats.pedidosPendientes > 0 ? '#f59e0b' : '#10b981' },
          { label: 'Ventas Semana', value: ld ? '—' : formatPrice(stats.ventasSemana), icon: <BarChart3 size={18} />, color: '#10b981' },
        ].map((m, i) => (
          <div key={i} className="glass-card" style={{
            padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            borderLeft: `3px solid ${m.color}`,
          }}>
            <div style={{ color: m.color, flexShrink: 0 }}>{m.icon}</div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ MODULES + ORDERS SPLIT ═══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>

        {/* Modules */}
        <div>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Gestión</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {modules.map((mod, i) => (
              <Link key={i} href={mod.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="glass-card" style={{
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '1rem 1.25rem',
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: `${mod.color}12`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: mod.color, flexShrink: 0,
                  }}>
                    {mod.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{mod.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mod.desc}</div>
                  </div>
                  {mod.count !== null && (
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, color: mod.color,
                      background: `${mod.color}12`, padding: '0.25rem 0.625rem',
                      borderRadius: 20,
                    }}>
                      {mod.count}
                    </span>
                  )}
                  <ArrowUpRight size={16} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem' }}>Últimos Pedidos</h3>
            <Link href="/admin/ecommerce/pedidos">
              <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Ver todos →</button>
            </Link>
          </div>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Cargando...</p>
            ) : recentPedidos.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <ShoppingCart size={36} style={{ color: 'var(--text-light)', marginBottom: '0.75rem' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aún no hay pedidos</p>
                <p style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>Los pedidos aparecerán acá cuando los clientes compren.</p>
              </div>
            ) : (
              <div>
                {recentPedidos.map((pedido, i) => {
                  const cfg = estadoConfig[pedido.estado] || estadoConfig.pendiente;
                  return (
                    <div key={pedido.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.875rem 1.25rem',
                      borderBottom: i < recentPedidos.length - 1 ? '1px solid var(--border-light)' : 'none',
                      gap: '0.75rem',
                      transition: 'background 0.15s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: cfg.bg, color: cfg.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {cfg.icon}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pedido.cliente_nombre}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            #{String(pedido.numero_pedido).padStart(4, '0')} · {new Date(pedido.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <span className={`badge ${cfg.badge}`} style={{ fontSize: '0.6875rem' }}>
                          {pedido.estado}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.875rem', fontFamily: 'var(--font-mono)', minWidth: 60, textAlign: 'right' }}>
                          {formatPrice(pedido.total)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ TIENDA LINK BANNER ═══════════ */}
      <div style={{
        marginTop: '2rem',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 16, padding: '1.5rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '1rem', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '1.0625rem', marginBottom: '0.25rem' }}>
            🛒 Tienda Mayorista Online
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>
            Compartí el link con tus clientes para que hagan pedidos
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <code style={{
            background: 'rgba(255,255,255,0.1)', color: '#10b981',
            padding: '0.5rem 0.875rem', borderRadius: 8, fontSize: '0.8125rem',
            fontFamily: 'var(--font-mono)',
          }}>
            /tienda
          </code>
          <Link href="/tienda" target="_blank">
            <button style={{
              background: '#10b981', color: 'white', fontSize: '0.8125rem',
              padding: '0.5rem 1rem', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
              minHeight: 'auto', boxShadow: 'none', letterSpacing: 0,
            }}>
              Abrir <ExternalLink size={14} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
