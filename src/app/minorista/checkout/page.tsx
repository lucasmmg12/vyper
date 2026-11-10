'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  ShoppingCart,
  Loader2,
  Zap,
  RotateCcw,
  Tag,
  Coins,
  MapPin,
  Check,
} from 'lucide-react';
import { useCart, getItemKey } from '@/lib/cart';
import { generateWhatsAppLink } from '@/lib/whatsapp';
import { CartItem, CheckoutData, Pedido, ProductoPromocion } from '@/types/ecommerce';

const BUILTIN_COUPONS: Record<string, { pct: number; label: string }> = {
  VYPER5: { pct: 5, label: '5% OFF Cupón Vyper' },
  VYPER10: { pct: 10, label: '10% OFF Cupón Vyper' },
  BIENVENIDO: { pct: 10, label: '10% OFF Bienvenida' },
};

const COIN_VALUE_ARS = 50; // 1 Vyper Coin = $50 ARS

export default function CheckoutPage() {
  const { items, getTotal, clearCart, replaceCart, isLoaded } = useCart();
  const [form, setForm] = useState<CheckoutData>({
    cliente_nombre: '',
    cliente_email: '',
    cliente_telefono: '',
    notas: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [createdPedido, setCreatedPedido] = useState<{ id: string; numero_pedido: number } | null>(null);
  const [submittedItems, setSubmittedItems] = useState<CartItem[]>([]);
  const [submittedCheckout, setSubmittedCheckout] = useState<CheckoutData | null>(null);

  // Client Lookup & Autofill state
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [clientProfile, setClientProfile] = useState<{
    id: string;
    name: string;
    phone: string;
    email?: string;
    coin_balance: number;
    debt_balance: number;
  } | null>(null);
  const [pastOrders, setPastOrders] = useState<Pedido[]>([]);
  const [promociones, setPromociones] = useState<ProductoPromocion[]>([]);
  const [lookupMessage, setLookupMessage] = useState('');

  // Coupons & Coins state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountMonto: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [useCoins, setUseCoins] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

  const subtotal = getTotal();

  const handleLookupClient = async (phoneToSearch?: string) => {
    const targetPhone = (phoneToSearch ?? lookupPhone ?? form.cliente_telefono).trim();
    if (targetPhone.replace(/\D/g, '').length < 6) {
      setLookupMessage('Ingresá al menos 6 dígitos de tu teléfono.');
      return;
    }
    setLookupLoading(true);
    setLookupMessage('');
    try {
      const res = await fetch(`/api/ecommerce/cliente-portal?telefono=${encodeURIComponent(targetPhone)}`);
      const data = await res.json();
      if (data?.promociones) setPromociones(data.promociones);

      if (data?.client) {
        setClientProfile(data.client);
        setPastOrders(data.pedidos || []);
        setForm(prev => ({
          ...prev,
          cliente_nombre: data.client.name || prev.cliente_nombre,
          cliente_telefono: prev.cliente_telefono || targetPhone,
          cliente_email: data.client.email || prev.cliente_email,
        }));
        setLookupMessage(`✓ ¡Hola ${data.client.name}! Autocompletamos tus datos.`);
      } else {
        setClientProfile(null);
        setPastOrders([]);
        setLookupMessage('No encontramos pedidos previos con ese número, ¡completá tus datos abajo!');
      }
    } catch {
      setLookupMessage('No se pudo verificar el teléfono en este momento.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleRepeatLastOrder = () => {
    if (!pastOrders || pastOrders.length === 0) return;
    const latest = pastOrders[0];
    if (!latest.items || latest.items.length === 0) return;

    const restored: CartItem[] = latest.items.map(it => ({
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
    setLookupMessage(`🔄 Se cargaron ${restored.length} productos de tu pedido #${String(latest.numero_pedido).padStart(4, '0')}.`);
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (BUILTIN_COUPONS[code]) {
      const info = BUILTIN_COUPONS[code];
      const monto = Math.round(subtotal * (info.pct / 100));
      setAppliedCoupon({ code, discountMonto: monto, label: info.label });
      return;
    }

    const matchedPromo = promociones.find(
      p => p.nombre.toUpperCase() === code || p.nombre.toUpperCase().includes(code)
    );
    if (matchedPromo) {
      let monto = 0;
      if (matchedPromo.tipo === 'descuento') {
        monto = Math.round(subtotal * (matchedPromo.valor / 100));
      } else if (matchedPromo.tipo === 'precio_fijo') {
        monto = Math.min(subtotal, matchedPromo.valor);
      }
      if (monto > 0) {
        setAppliedCoupon({ code, discountMonto: monto, label: matchedPromo.nombre });
        return;
      }
    }

    setCouponError('El código ingresado no es válido o expiró.');
  };

  const maxCoinsDiscount = Math.round(subtotal * 0.25);
  const availableCoinsValue = (clientProfile?.coin_balance || 0) * COIN_VALUE_ARS;
  const coinsDiscountMonto = useCoins ? Math.min(maxCoinsDiscount, availableCoinsValue) : 0;
  const coinsUsedCount = useCoins ? Math.ceil(coinsDiscountMonto / COIN_VALUE_ARS) : 0;

  const couponDiscountMonto = appliedCoupon ? appliedCoupon.discountMonto : 0;
  const totalDiscountMonto = couponDiscountMonto + coinsDiscountMonto;
  const finalTotal = Math.max(0, subtotal - totalDiscountMonto);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!form.cliente_nombre.trim()) {
      setError('Ingresá tu nombre');
      return;
    }
    if (!form.cliente_telefono.trim()) {
      setError('Ingresá tu teléfono');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const extraNotes: string[] = [];
      if (form.notas?.trim()) extraNotes.push(form.notas.trim());
      if (appliedCoupon) {
        extraNotes.push(`[Cupón ${appliedCoupon.code}: -${formatPrice(appliedCoupon.discountMonto)}]`);
      }
      if (useCoins && coinsUsedCount > 0) {
        extraNotes.push(`[Canje ${coinsUsedCount} Vyper Coins: -${formatPrice(coinsDiscountMonto)}]`);
      }
      const combinedNotas = extraNotes.join(' | ');

      const checkoutPayload: CheckoutData = {
        ...form,
        notas: combinedNotas,
        cupon_codigo: appliedCoupon?.code,
        descuento_monto: totalDiscountMonto > 0 ? totalDiscountMonto : undefined,
        coins_usados: coinsUsedCount > 0 ? coinsUsedCount : undefined,
      };

      const discountFactor = subtotal > 0 ? finalTotal / subtotal : 1;

      const res = await fetch('/api/ecommerce/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nombre: form.cliente_nombre,
          cliente_email: form.cliente_email,
          cliente_telefono: form.cliente_telefono,
          notas: combinedNotas,
          items: items.map(item => {
            const hasVar = item.variante && !item.nombre.toLowerCase().includes(`(${item.variante.toLowerCase()})`);
            const prodName = item.variante && hasVar ? `${item.nombre} (${item.variante})` : item.nombre;
            return {
              producto_id: item.producto_id,
              producto_nombre: prodName,
              cantidad: item.cantidad,
              precio_unitario: Math.round(item.precio * discountFactor),
            };
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el pedido');
      }

      const pedidoObj = data.pedido;
      if (pedidoObj?.id) {
        setCreatedPedido({ id: pedidoObj.id, numero_pedido: pedidoObj.numero_pedido });
        try {
          const prev = JSON.parse(localStorage.getItem('vyper_last_orders') || '[]');
          const next = [pedidoObj.id, ...prev.filter((x: string) => x !== pedidoObj.id)].slice(0, 10);
          localStorage.setItem('vyper_last_orders', JSON.stringify(next));
        } catch {}
      }

      const snapshot = [...items];
      setSubmittedItems(snapshot);
      setSubmittedCheckout(checkoutPayload);

      const whatsappLink = generateWhatsAppLink(snapshot, checkoutPayload, pedidoObj?.numero_pedido, 'minorista');

      setSuccess(true);
      clearCart();

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
    const displayItems = submittedItems.length > 0 ? submittedItems : items;
    const displayCheckout = submittedCheckout || form;

    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--accent-green-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            animation: 'scaleIn 0.4s ease-out',
          }}
        >
          <CheckCircle size={40} style={{ color: 'var(--accent-green)' }} />
        </div>
        <h2 style={{ marginBottom: '0.5rem' }}>
          ¡Pedido {createdPedido?.numero_pedido ? `#${String(createdPedido.numero_pedido).padStart(4, '0')}` : ''} enviado! 🎉
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Tu pedido fue registrado exitosamente. Se está abriendo WhatsApp para que puedas confirmar con nosotros.
        </p>

        {createdPedido?.id && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Link href={`/pedido/${createdPedido.id}`}>
              <button
                style={{
                  width: '100%',
                  padding: '0.9rem 1.25rem',
                  background: '#1e40af',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <MapPin size={18} /> 📍 Seguir estado de mi pedido en vivo
              </button>
            </Link>
          </div>
        )}

        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'left',
          }}
        >
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Resumen del pedido</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {displayItems.map(item => (
              <div
                key={item.cart_key || item.producto_id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>{item.cantidad}x</strong> <span style={{ color: 'var(--text-secondary)' }}>{item.nombre}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatPrice(item.precio * item.cantidad)}</div>
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
              const link = generateWhatsAppLink(
                displayItems,
                displayCheckout,
                createdPedido?.numero_pedido,
                'minorista'
              );
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
        <Link href="/minorista">
          <button>
            <ArrowLeft size={16} /> Ir al catálogo
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '1rem 1.5rem 3rem' }}>
      <Link href="/minorista/carrito">
        <button className="btn-ghost" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Volver al pedido
        </button>
      </Link>

      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>Confirmar Pedido</h1>

      {/* ===== QUICK AUTOFILL BY PHONE & REPEAT LAST ORDER ===== */}
      <div
        className="glass-card"
        style={{
          marginBottom: '1.5rem',
          padding: '1.1rem 1.25rem',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <Zap size={18} color="#1e40af" />
          <strong style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>
            ⚡ ¿Ya compraste antes? Ingresá tu WhatsApp para autocompletar y usar tus Vyper Coins
          </strong>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="tel"
            placeholder="Ej: 264 1234567"
            value={lookupPhone}
            onChange={e => setLookupPhone(e.target.value)}
            style={{
              flex: 1,
              minWidth: 200,
              margin: 0,
              background: '#ffffff',
              borderRadius: 8,
              padding: '0.55rem 0.85rem',
              fontSize: '0.875rem',
            }}
          />
          <button
            type="button"
            onClick={() => handleLookupClient(lookupPhone)}
            disabled={lookupLoading}
            style={{
              background: '#1e40af',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.55rem 1.1rem',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {lookupLoading ? 'Buscando...' : 'Autocompletar'}
          </button>
          {pastOrders.length > 0 && (
            <button
              type="button"
              onClick={handleRepeatLastOrder}
              style={{
                background: '#ffffff',
                color: '#1e40af',
                border: '1px solid #93c5fd',
                borderRadius: 8,
                padding: '0.55rem 1rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <RotateCcw size={14} /> 🔄 Cargar mi último pedido
            </button>
          )}
        </div>
        {lookupMessage && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#1e40af' }}>
            {lookupMessage}
          </div>
        )}
        {clientProfile && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.65rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
            <span
              style={{
                background: '#fef3c7',
                color: '#92400e',
                padding: '0.2rem 0.6rem',
                borderRadius: 6,
                fontWeight: 700,
              }}
            >
              🪙 Saldo Vyper Coins: {clientProfile.coin_balance}
            </span>
            {clientProfile.debt_balance > 0 && (
              <span
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 6,
                  fontWeight: 700,
                }}
              >
                📋 Saldo Cuenta Corriente: {formatPrice(clientProfile.debt_balance)}
              </span>
            )}
          </div>
        )}
      </div>

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
                onBlur={() => {
                  if (!clientProfile && form.cliente_telefono.replace(/\D/g, '').length >= 7) {
                    handleLookupClient(form.cliente_telefono);
                  }
                }}
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

            {/* Cupón de Descuento & Canje de Vyper Coins */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 12,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                <Tag size={15} color="#2563eb" /> Cupón de Descuento
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Código (ej: VYPER10, BIENVENIDO)"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  style={{ margin: 0, flex: 1, fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                />
                <button
                  type="button"
                  className="secondary"
                  onClick={handleApplyCoupon}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.825rem', fontWeight: 700 }}
                >
                  Aplicar
                </button>
              </div>
              {couponError && (
                <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: 600 }}>
                  {couponError}
                </div>
              )}
              {appliedCoupon && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ecfdf5',
                    color: '#047857',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  <span>
                    <Check size={14} style={{ display: 'inline', marginRight: 4 }} />
                    {appliedCoupon.label} (-{formatPrice(appliedCoupon.discountMonto)})
                  </span>
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(null)}
                    style={{ background: 'none', border: 'none', color: '#047857', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}
                  >
                    Quitar
                  </button>
                </div>
              )}

              {clientProfile && clientProfile.coin_balance > 0 && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      margin: 0,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', fontWeight: 700, color: '#92400e' }}>
                      <Coins size={16} color="#d97706" />
                      Canjear mis Vyper Coins ({clientProfile.coin_balance} disp. = hasta -{formatPrice(Math.min(maxCoinsDiscount, availableCoinsValue))})
                    </span>
                    <input
                      type="checkbox"
                      checked={useCoins}
                      onChange={e => setUseCoins(e.target.checked)}
                      style={{ width: 18, height: 18, margin: 0 }}
                    />
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 12,
                  background: 'var(--accent-red-light)',
                  color: 'var(--accent-red)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Loader2 size={20} className="animate-spin" /> Procesando...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Send size={20} /> Enviar pedido por WhatsApp ({formatPrice(finalTotal)})
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
              <div key={item.cart_key || item.producto_id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'var(--bg-tertiary)',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  {item.imagen ? (
                    <Image src={item.imagen} alt={item.nombre} fill style={{ objectFit: 'cover' }} sizes="48px" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart size={16} style={{ color: 'var(--text-light)' }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
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

          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
            {totalDiscountMonto > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', color: '#047857', fontWeight: 600 }}>
                    <span>Cupón ({appliedCoupon.code})</span>
                    <span>-{formatPrice(appliedCoupon.discountMonto)}</span>
                  </div>
                )}
                {useCoins && coinsDiscountMonto > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', color: '#d97706', fontWeight: 600 }}>
                    <span>Vyper Coins ({coinsUsedCount})</span>
                    <span>-{formatPrice(coinsDiscountMonto)}</span>
                  </div>
                )}
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: '1.375rem' }}>{formatPrice(finalTotal)}</span>
            </div>
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
