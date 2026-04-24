'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Send, CheckCircle, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { generateWhatsAppLink } from '@/lib/whatsapp';
import { CheckoutData } from '@/types/ecommerce';

export default function CheckoutPage() {
  const { items, getTotal, clearCart, isLoaded } = useCart();
  const [form, setForm] = useState<CheckoutData>({
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: '',
    notas: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Validate
    if (!form.cliente_nombre.trim()) { setError('Ingresá tu nombre'); return; }
    if (!form.cliente_telefono.trim()) { setError('Ingresá tu teléfono'); return; }

    setLoading(true);
    setError('');

    try {
      // Save order to database
      const res = await fetch('/api/ecommerce/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nombre: form.cliente_nombre,
          cliente_email: form.cliente_email,
          cliente_telefono: form.cliente_telefono,
          notas: form.notas,
          items: items.map(item => ({
            producto_id: item.producto_id,
            producto_nombre: item.nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el pedido');
      }

      const whatsappLink = generateWhatsAppLink(items, form, data.pedido?.numero_pedido, 'minorista');

      // Mark success
      setSuccess(true);
      clearCart();

      // Open WhatsApp
      setTimeout(() => {
        window.open(whatsappLink, '_blank');
      }, 1000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al procesar el pedido. Intenta nuevamente.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  if (success) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--accent-green-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          animation: 'scaleIn 0.4s ease-out',
        }}>
          <CheckCircle size={40} style={{ color: 'var(--accent-green)' }} />
        </div>
        <h2 style={{ marginBottom: '0.5rem' }}>¡Pedido enviado! 🎉</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Tu pedido fue registrado exitosamente. Se está abriendo WhatsApp para que puedas confirmar con nosotros.
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Si WhatsApp no se abrió automáticamente, hacé click en el botón de abajo.
        </p>

        <div style={{ 
          background: 'var(--bg-secondary)', 
          borderRadius: 12, 
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Resumen del pedido</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {items.map(item => (
              <div key={item.producto_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>{item.cantidad}x</strong> <span style={{ color: 'var(--text-secondary)' }}>{item.nombre}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {formatPrice(item.precio * item.cantidad)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/minorista">
            <button className="secondary">
              <ArrowLeft size={16} /> Volver al catálogo
            </button>
          </Link>
          <button
            onClick={() => {
              const link = generateWhatsAppLink(items.length > 0 ? items : [], form, undefined, 'minorista');
              window.open(link, '_blank');
            }}
            className="btn-green"
          >
            <Send size={16} /> Abrir WhatsApp
          </button>
        </div>
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-light)' }}>
            ⚠️ IMPORTANTE: Es obligatorio continuar en WhatsApp y enviar el mensaje para que procesemos tu pedido.
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <ShoppingCart size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>No hay productos en tu pedido</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Agregá productos desde el catálogo para continuar.
        </p>
        <Link href="/minorista"><button><ArrowLeft size={16} /> Ir al catálogo</button></Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 1.5rem 3rem' }}>
      <Link href="/minorista/carrito">
        <button className="btn-ghost" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Volver al pedido
        </button>
      </Link>

      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Confirmar Pedido</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="checkout-grid">
        {/* Form */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Tus Datos</h3>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Nombre completo *</label>
              <input
                type="text"
                placeholder="Juan Pérez"
                value={form.cliente_nombre}
                onChange={e => setForm({ ...form, cliente_nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Teléfono / WhatsApp *</label>
              <input
                type="tel"
                placeholder="264 1234567"
                value={form.cliente_telefono}
                onChange={e => setForm({ ...form, cliente_telefono: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                placeholder="juan@email.com"
                value={form.cliente_email}
                onChange={e => setForm({ ...form, cliente_email: e.target.value })}
              />
            </div>
            <div>
              <label>Notas (opcional)</label>
              <textarea
                placeholder="Indicaciones especiales, dirección de envío, etc."
                value={form.notas}
                onChange={e => setForm({ ...form, notas: e.target.value })}
                rows={3}
              />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: 12,
                background: 'var(--accent-red-light)', color: 'var(--accent-red)',
                fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Loader2 size={20} className="animate-spin" /> Procesando...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Send size={20} /> Enviar pedido por WhatsApp
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Resumen del Pedido</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {items.map(item => (
              <div key={item.producto_id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  overflow: 'hidden', background: 'var(--bg-tertiary)',
                  flexShrink: 0, position: 'relative',
                }}>
                  {item.imagen ? (
                    <Image src={item.imagen} alt={item.nombre} fill style={{ objectFit: 'cover' }} sizes="48px" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart size={16} style={{ color: 'var(--text-light)' }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.875rem', fontWeight: 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.nombre}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.cantidad}x {formatPrice(item.precio)}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', flexShrink: 0 }}>
                  {formatPrice(item.precio * item.cantidad)}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            paddingTop: '1rem', borderTop: '1px solid var(--border-light)',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: '1.375rem' }}>{formatPrice(getTotal())}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr 380px !important;
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
