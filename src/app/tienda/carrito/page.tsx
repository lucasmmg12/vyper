'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart, ArrowRight, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useCart, getItemKey } from '@/lib/cart';

interface IncentivosConfig {
  activo?: boolean;
  envio_gratis_mayorista: number;
  envio_gratis_minorista: number;
  descuento_volumen_minimo: number;
  descuento_volumen_porcentaje: number;
}

const DEFAULT_INCENTIVOS: IncentivosConfig = {
  activo: true,
  envio_gratis_mayorista: 150000,
  envio_gratis_minorista: 45000,
  descuento_volumen_minimo: 250000,
  descuento_volumen_porcentaje: 5,
};

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotal, isLoaded } = useCart();
  const [incentivos, setIncentivos] = useState<IncentivosConfig>(DEFAULT_INCENTIVOS);

  useEffect(() => {
    fetch('/api/ecommerce/configuraciones?clave=tienda_incentivos')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.valor) {
          setIncentivos({ ...DEFAULT_INCENTIVOS, ...data.valor });
        }
      })
      .catch(() => {});
  }, []);

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
          Explorá el catálogo y agregá productos para armar tu pedido mayorista.
        </p>
        <Link href="/tienda">
          <button style={{ padding: '0.875rem 2rem' }}>
            <ArrowLeft size={18} /> Ir al catálogo
          </button>
        </Link>
      </div>
    );
  }

  const subtotal = getTotal();
  const envioMeta = incentivos.envio_gratis_mayorista || 150000;
  const volumenMeta = incentivos.descuento_volumen_minimo || 250000;
  const volumenPct = incentivos.descuento_volumen_porcentaje || 5;

  const envioUnlocked = subtotal >= envioMeta;
  const volumenUnlocked = subtotal >= volumenMeta;
  const envioPctBar = Math.min(100, Math.round((subtotal / envioMeta) * 100));
  const volumenPctBar = Math.min(100, Math.round((subtotal / volumenMeta) * 100));

  const descuentoVolumenMonto = volumenUnlocked ? Math.round(subtotal * (volumenPct / 100)) : 0;
  const totalEstimado = Math.max(0, subtotal - descuentoVolumenMonto);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 1.5rem 6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Mi Pedido Mayorista</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{items.length} producto{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-ghost" onClick={clearCart} style={{ color: 'var(--accent-red)', fontSize: '0.8125rem' }}>
          <Trash2 size={14} /> Vaciar
        </button>
      </div>

      {/* ===== PROGRESS BARS: ENVÍO GRATIS & DESCUENTO POR VOLUMEN ===== */}
      {incentivos.activo !== false && (
        <div
          className="glass-card"
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            background: volumenUnlocked ? '#ecfdf5' : '#f8fafc',
            border: volumenUnlocked ? '1px solid #10b981' : '1px solid #e2e8f0',
          }}
        >
          {/* Free Shipping Progress */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.825rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: envioUnlocked ? '#047857' : '#1e293b' }}>
                <Truck size={16} color={envioUnlocked ? '#10b981' : '#2563eb'} />
                {envioUnlocked ? (
                  '🎉 ¡Desbloqueaste ENVÍO BONIFICADO en tu pedido!'
                ) : (
                  <>
                    Te faltan <strong>{formatPrice(envioMeta - subtotal)}</strong> para <strong>Envío Gratis</strong>
                  </>
                )}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: envioUnlocked ? '#047857' : '#64748b' }}>
                {envioPctBar}%
              </span>
            </div>
            <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 100, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${envioPctBar}%`,
                  height: '100%',
                  background: envioUnlocked ? '#10b981' : '#2563eb',
                  transition: 'width 0.35s ease',
                }}
              />
            </div>
          </div>

          {/* Volume Discount Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.825rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: volumenUnlocked ? '#047857' : '#1e293b' }}>
                <Sparkles size={16} color={volumenUnlocked ? '#10b981' : '#f59e0b'} />
                {volumenUnlocked ? (
                  `🏆 ¡Desbloqueaste ${volumenPct}% OFF extra por Volumen Mayorista! (-${formatPrice(descuentoVolumenMonto)})`
                ) : (
                  <>
                    Sumá <strong>{formatPrice(volumenMeta - subtotal)}</strong> más para destrabar <strong>{volumenPct}% OFF por Volumen</strong>
                  </>
                )}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: volumenUnlocked ? '#047857' : '#64748b' }}>
                {volumenPctBar}%
              </span>
            </div>
            <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 100, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${volumenPctBar}%`,
                  height: '100%',
                  background: volumenUnlocked ? '#10b981' : '#f59e0b',
                  transition: 'width 0.35s ease',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {items.map((item, i) => {
          const itemKey = item.cart_key || getItemKey(item.producto_id, item.variante);
          return (
            <div
              key={itemKey}
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
                  {item.variante && (
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: '#eff6ff',
                      color: '#1e40af',
                      padding: '0.1rem 0.5rem',
                      borderRadius: 6,
                      marginBottom: '0.25rem',
                    }}>
                      Sabor / Variante: {item.variante}
                    </span>
                  )}
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {formatPrice(item.precio)} c/u
                  </p>
                </div>

                {/* Quantity controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    className="btn-ghost"
                    onClick={() => updateQuantity(item.producto_id, item.cantidad - 1, item.variante)}
                    style={{ width: 36, height: 36, padding: 0, borderRadius: 10, border: '1px solid var(--border-color)' }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ width: 32, textAlign: 'center', fontWeight: 700, fontSize: '0.9375rem' }}>
                    {item.cantidad}
                  </span>
                  <button
                    className="btn-ghost"
                    onClick={() => updateQuantity(item.producto_id, item.cantidad + 1, item.variante)}
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
                    onClick={() => removeItem(item.producto_id, item.variante)}
                    style={{ padding: '0.25rem', color: 'var(--accent-red)', marginTop: '0.25rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
          <span style={{ fontWeight: 600 }}>{formatPrice(subtotal)}</span>
        </div>
        {envioUnlocked && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#047857', fontSize: '0.875rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={15} /> Envío Mayorista
            </span>
            <span>BONIFICADO</span>
          </div>
        )}
        {volumenUnlocked && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#047857', fontSize: '0.875rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={15} /> Descuento por Volumen ({volumenPct}% OFF)
            </span>
            <span>-{formatPrice(descuentoVolumenMonto)}</span>
          </div>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)',
        }}>
          <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>Total Estimado</span>
          <span style={{ fontWeight: 800, fontSize: '1.375rem' }}>{formatPrice(totalEstimado)}</span>
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
          <Link href="/tienda" style={{ flex: 0 }}>
            <button className="secondary" style={{ height: '100%' }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <Link href="/tienda/checkout" style={{ flex: 1 }}>
            <button style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700 }}>
              Continuar al Checkout <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
