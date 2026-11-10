'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Clock,
  Package,
  Printer,
  RotateCcw,
  Send,
  ShoppingCart,
  ArrowLeft,
  XCircle,
  User,
  Phone,
  Calendar,
} from 'lucide-react';
import { Pedido, CartItem } from '@/types/ecommerce';
import { useCart, getItemKey } from '@/lib/cart';
import { useStoreConfig } from '@/hooks/useStoreConfig';

export default function PedidoTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params.id as string;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const { replaceCart } = useCart();
  const { config: whatsapp } = useStoreConfig('tienda_whatsapp');
  const { config: identidad } = useStoreConfig('tienda_identidad');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const directRes = await fetch(`/api/ecommerce/pedidos/${encodeURIComponent(idParam)}`);
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData?.pedido) {
            setPedido(directData.pedido);
            setLoading(false);
            return;
          }
        }
        const res = await fetch(`/api/ecommerce/pedidos?id=${encodeURIComponent(idParam)}`);
        const data = await res.json();
        const list: Pedido[] = data?.pedidos || [];
        const matched = list.find(
          p => p.id === idParam || String(p.numero_pedido) === idParam.replace('#', '')
        );
        setPedido(matched || null);
      } catch {
        setPedido(null);
      } finally {
        setLoading(false);
      }
    };
    if (idParam) fetchOrder();
  }, [idParam]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price || 0);

  const handleRepeatOrder = () => {
    if (!pedido || !pedido.items) return;
    const restored: CartItem[] = pedido.items.map(it => ({
      producto_id: it.producto_id || it.id,
      nombre: it.producto_nombre,
      precio: it.precio_unitario,
      cantidad: it.cantidad,
      imagen: it.producto?.imagenes?.[0],
      stock: 999,
      cantidad_minima: 1,
      cart_key: getItemKey(it.producto_id || it.id),
    }));
    replaceCart(restored);
    router.push('/tienda/carrito');
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '760px', margin: '3rem auto', padding: '1.5rem' }}>
        <div style={{ height: 32, width: '50%', background: '#f3f4f6', borderRadius: 8, marginBottom: '1.5rem' }} />
        <div style={{ height: 140, background: '#f3f4f6', borderRadius: 16, marginBottom: '1rem' }} />
        <div style={{ height: 220, background: '#f3f4f6', borderRadius: 16 }} />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <Package size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
        <h2>Pedido no encontrado</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Verificá el enlace de seguimiento o consultá tus pedidos desde Mi Cuenta.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link href="/tienda">
            <button className="secondary">Ir a la Tienda</button>
          </Link>
          <Link href="/client">
            <button>Ir a Mi Cuenta</button>
          </Link>
        </div>
      </div>
    );
  }

  const numeroStr = `#${String(pedido.numero_pedido).padStart(4, '0')}`;
  const isCancelado = pedido.estado === 'cancelado';
  const currentStep =
    pedido.estado === 'completado' ? 3 : pedido.estado === 'procesando' ? 2 : 1;

  const steps = [
    { step: 1, label: 'Pedido Recibido', desc: 'Registrado en Vyper', icon: <Clock size={18} /> },
    { step: 2, label: 'En Preparación', desc: 'Armando tu pedido', icon: <Package size={18} /> },
    { step: 3, label: 'Listo / Entregado', desc: 'Pedido finalizado', icon: <CheckCircle2 size={18} /> },
  ];

  const waConsultText = `Hola Vyper! Consulto por el estado de mi pedido ${numeroStr} a nombre de ${pedido.cliente_nombre}.`;
  const waConsultUrl = `https://wa.me/${whatsapp.numero_mayorista}?text=${encodeURIComponent(waConsultText)}`;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link href="/tienda">
          <button className="btn-ghost" style={{ fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Volver a la tienda
          </button>
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="secondary"
            onClick={() => window.print()}
            style={{ fontSize: '0.8125rem', padding: '0.5rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Printer size={15} /> Imprimir / PDF
          </button>
          <button
            type="button"
            onClick={handleRepeatOrder}
            style={{
              fontSize: '0.8125rem',
              padding: '0.5rem 0.9rem',
              background: '#1e40af',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <RotateCcw size={15} /> 🔄 Repetir este pedido
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div
        className="glass-card"
        style={{
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {identidad.nombre_completo} · Seguimiento en vivo
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0.25rem 0' }}>
              Pedido {numeroStr}
            </h1>
            <div style={{ fontSize: '0.825rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} />
              {new Date(pedido.created_at).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          <span
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 100,
              fontSize: '0.825rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              background:
                pedido.estado === 'completado'
                  ? '#dcfce7'
                  : pedido.estado === 'procesando'
                  ? '#dbeafe'
                  : pedido.estado === 'cancelado'
                  ? '#fee2e2'
                  : '#fef3c7',
              color:
                pedido.estado === 'completado'
                  ? '#15803d'
                  : pedido.estado === 'procesando'
                  ? '#1e40af'
                  : pedido.estado === 'cancelado'
                  ? '#b91c1c'
                  : '#b45309',
            }}
          >
            {pedido.estado}
          </span>
        </div>

        {/* Visual Timeline */}
        {isCancelado ? (
          <div
            style={{
              padding: '1rem',
              borderRadius: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontWeight: 700,
            }}
          >
            <XCircle size={22} /> Este pedido se encuentra cancelado.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
            }}
          >
            {steps.map(s => {
              const active = currentStep >= s.step;
              return (
                <div
                  key={s.step}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    opacity: active ? 1 : 0.45,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: active ? '#10b981' : '#e2e8f0',
                      color: active ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.5rem',
                      fontWeight: 800,
                    }}
                  >
                    {s.icon}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.825rem', color: '#0f172a' }}>{s.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.desc}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Client Details */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
        }}
      >
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem' }}>Datos del Cliente</h3>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#374151' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={15} color="#6b7280" /> <strong>{pedido.cliente_nombre}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Phone size={15} color="#6b7280" /> {pedido.cliente_telefono}
          </div>
        </div>
        {pedido.notas && (
          <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', background: '#f9fafb', borderRadius: 8, fontSize: '0.8125rem', color: '#4b5563' }}>
            <strong>Notas / Descuentos:</strong> {pedido.notas}
          </div>
        )}
      </div>

      {/* Items Breakdown */}
      <div
        className="glass-card"
        style={{
          padding: '1.5rem',
          marginBottom: '1.5rem',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>
          Detalle de Productos ({pedido.items?.length || 0})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(pedido.items || []).map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: '#f8fafc',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {item.producto?.imagenes?.[0] ? (
                    <Image
                      src={item.producto.imagenes[0]}
                      alt={item.producto_nombre}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="48px"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart size={18} color="#94a3b8" />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{item.producto_nombre}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    {item.cantidad} x {formatPrice(item.precio_unitario)}
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827', whiteSpace: 'nowrap' }}>
                {formatPrice(item.subtotal || item.precio_unitario * item.cantidad)}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            marginTop: '0.5rem',
            borderTop: '2px solid #111827',
          }}
        >
          <span style={{ fontSize: '1.125rem', fontWeight: 800 }}>Total del Pedido</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>{formatPrice(pedido.total)}</span>
        </div>
      </div>

      {/* WhatsApp Direct CTA */}
      <div className="no-print" style={{ textAlign: 'center' }}>
        <a href={waConsultUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button
            className="btn-green"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 800,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Send size={18} /> Consultar sobre este pedido por WhatsApp
          </button>
        </a>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
