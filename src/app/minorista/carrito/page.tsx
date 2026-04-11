'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/cart';

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotal, isLoaded } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

  if (!isLoaded) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ height: 24, background: 'var(--bg-tertiary)', borderRadius: 8, width: '40%', marginBottom: '2rem' }} />
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 100, background: 'var(--bg-tertiary)', borderRadius: 16, marginBottom: '1rem' }} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <ShoppingCart size={36} style={{ color: 'var(--text-light)' }} />
        </div>
        <h2 style={{ marginBottom: '0.5rem' }}>Tu pedido está vacío</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Explorá el catálogo y agregá productos para armar tu pedido.
        </p>
        <Link href="/minorista">
          <button style={{ padding: '0.875rem 2rem' }}>
            <ArrowLeft size={18} /> Ir al catálogo
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 1.5rem 6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Mi Pedido</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{items.length} producto{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-ghost" onClick={clearCart} style={{ color: 'var(--accent-red)', fontSize: '0.8125rem' }}>
          <Trash2 size={14} /> Vaciar
        </button>
      </div>

      {/* Cart Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {items.map((item, i) => (
          <div
            key={item.producto_id}
            className="glass-card"
            style={{ padding: '1rem', animation: `fadeIn 0.3s ease-out ${i * 0.05}s both` }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {/* Image */}
              <div style={{
                width: 72, height: 72, flexShrink: 0,
                borderRadius: 12, overflow: 'hidden',
                background: 'var(--bg-tertiary)', position: 'relative',
              }}>
                {item.imagen ? (
                  <Image src={item.imagen} alt={item.nombre} fill style={{ objectFit: 'cover' }} sizes="72px" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingCart size={24} style={{ color: 'var(--text-light)' }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{
                  fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.nombre}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {formatPrice(item.precio)} c/u
                </p>
              </div>

              {/* Quantity controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  className="btn-ghost"
                  onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)}
                  style={{ width: 36, height: 36, padding: 0, borderRadius: 10, border: '1px solid var(--border-color)' }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ width: 32, textAlign: 'center', fontWeight: 700, fontSize: '0.9375rem' }}>
                  {item.cantidad}
                </span>
                <button
                  className="btn-ghost"
                  onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)}
                  style={{ width: 36, height: 36, padding: 0, borderRadius: 10, border: '1px solid var(--border-color)' }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Subtotal + delete */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {formatPrice(item.precio * item.cantidad)}
                </div>
                <button
                  className="btn-ghost"
                  onClick={() => removeItem(item.producto_id)}
                  style={{ padding: '0.25rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
          <span style={{ fontWeight: 600 }}>{formatPrice(getTotal())}</span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)',
        }}>
          <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: '1.375rem' }}>{formatPrice(getTotal())}</span>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '1rem 1.5rem',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-color)',
        zIndex: 40,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '0.75rem' }}>
          <Link href="/minorista" style={{ flex: 0 }}>
            <button className="secondary" style={{ height: '100%' }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <Link href="/minorista/checkout" style={{ flex: 1 }}>
            <button style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700 }}>
              Continuar <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
