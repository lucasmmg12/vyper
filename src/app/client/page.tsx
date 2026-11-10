'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RotateCcw, ExternalLink, Package, Wallet, Gift, ArrowLeft } from 'lucide-react';
import { TierBadge, TierProgressBar, getTier } from '@/utils/tiers';
import { Pedido, CartItem } from '@/types/ecommerce';
import { useCart, getItemKey } from '@/lib/cart';

export default function ClientPage() {
  const router = useRouter();
  const { replaceCart } = useCart();
  const [whatsapp, setWhatsapp] = useState('');
  const [user, setUser] = useState<any>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'PEDIDOS' | 'WALLET' | 'MARKET'>('PEDIDOS');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price || 0);

  const fetchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const [portalRes, userRes] = await Promise.all([
        fetch(`/api/ecommerce/cliente-portal?telefono=${encodeURIComponent(whatsapp)}`),
        fetch(`/api/user?whatsapp=${encodeURIComponent(whatsapp)}`),
      ]);

      const portalData = portalRes.ok ? await portalRes.json() : null;
      const userData = userRes.ok ? await userRes.json() : null;

      if (userData?.user) {
        setUser(userData.user);
        setPedidos(portalData?.pedidos || []);
        setError('');
      } else if (portalData?.client) {
        setUser({
          id: portalData.client.id,
          name: portalData.client.name,
          whatsapp: portalData.client.phone,
          coinBalance: portalData.client.coin_balance || 0,
          debtBalance: portalData.client.debt_balance || 0,
          transactions: portalData.client.transactions || [],
        });
        setPedidos(portalData.pedidos || []);
        setError('');
      } else {
        setError('No encontramos una cuenta ni pedidos asociados a ese número.');
        setUser(null);
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleRepeatOrder = (pedido: Pedido) => {
    if (!pedido.items || pedido.items.length === 0) return;
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

  if (!user) {
    return (
      <div style={{ maxWidth: '560px', margin: '4rem auto', padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/tienda" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} /> Volver a la tienda
          </Link>
        </div>
        <div className="glass-card" style={{ padding: '2rem', borderRadius: 16 }}>
          <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontWeight: 900, fontSize: '1.75rem' }}>
            Mi Cuenta Vyper
          </h1>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Consultá el estado de tus pedidos, repetí tu última compra y revisá tus Vyper Coins y Cuenta Corriente.
          </p>
          <form onSubmit={fetchUser}>
            <input
              type="text"
              placeholder="Ingresá tu WhatsApp (ej: 264 1234567)"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '1rem' }}
              required
            />
            {error && (
              <div
                style={{
                  color: '#991b1b',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  padding: '0.85rem',
                  marginBottom: '1rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}
            <button type="submit" style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 800 }}>
              {loading ? 'Buscando...' : 'Ingresar a Mi Cuenta'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Hola, {user.name}</h2>
          <TierBadge coins={user.coinBalance || 0} size="lg" />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/tienda">
            <button className="secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem' }}>
              Ir al Catálogo
            </button>
          </Link>
          <button onClick={() => setUser(null)} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
            Salir
          </button>
        </div>
      </header>

      <div className="grid-layout" style={{ gap: '1rem', padding: 0, marginBottom: '1.5rem' }}>
        <div className="brutalist-card">
          <h3>🪙 Saldo Vyper Coins</h3>
          <div className="big-stat">{user.coinBalance || 0}</div>
        </div>

        <div className="brutalist-card">
          <h3>📦 Pedidos Realizados</h3>
          <div className="big-stat">{pedidos.length}</div>
        </div>

        {user.debtBalance > 0 && (
          <div className="brutalist-card" style={{ borderStyle: 'dashed' }}>
            <h3>📋 Saldo Cuenta Corriente</h3>
            <div className="big-stat" style={{ fontSize: '2.25rem' }}>
              {formatPrice(user.debtBalance)}
            </div>
          </div>
        )}
      </div>

      {/* Tier Progress Card */}
      <div
        style={{
          padding: '1.5rem',
          marginBottom: '1.5rem',
          background: getTier(user.coinBalance || 0).bgColor,
          border: `1px solid ${getTier(user.coinBalance || 0).borderColor}`,
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Tu Nivel Vyper</h3>
          <TierBadge coins={user.coinBalance || 0} size="md" />
        </div>
        <TierProgressBar coins={user.coinBalance || 0} />
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          🪙 {user.coinBalance || 0} Vyper Coins acumuladas (Podés canjearlas en el Checkout de la tienda)
        </div>
      </div>

      <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setView('PEDIDOS')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            background: view === 'PEDIDOS' ? '#111827' : '#ffffff',
            color: view === 'PEDIDOS' ? '#ffffff' : '#111827',
            border: '1px solid #d1d5db',
            borderRadius: 10,
            padding: '0.75rem',
            fontWeight: 700,
          }}
        >
          <Package size={16} /> Mis Pedidos ({pedidos.length})
        </button>
        <button
          onClick={() => setView('WALLET')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            background: view === 'WALLET' ? '#111827' : '#ffffff',
            color: view === 'WALLET' ? '#ffffff' : '#111827',
            border: '1px solid #d1d5db',
            borderRadius: 10,
            padding: '0.75rem',
            fontWeight: 700,
          }}
        >
          <Wallet size={16} /> Movimientos
        </button>
        <button
          onClick={() => setView('MARKET')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            background: view === 'MARKET' ? '#111827' : '#ffffff',
            color: view === 'MARKET' ? '#ffffff' : '#111827',
            border: '1px solid #d1d5db',
            borderRadius: 10,
            padding: '0.75rem',
            fontWeight: 700,
          }}
        >
          <Gift size={16} /> Recompensas
        </button>
      </nav>

      {view === 'PEDIDOS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pedidos.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <Package size={40} color="#9ca3af" style={{ marginBottom: '0.75rem' }} />
              <h4>Todavía no tenés pedidos registrados en la tienda</h4>
              <Link href="/tienda">
                <button style={{ marginTop: '1rem' }}>Explorar Catálogo</button>
              </Link>
            </div>
          ) : (
            pedidos.map(p => (
              <div
                key={p.id}
                className="glass-card"
                style={{
                  padding: '1.25rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: 14,
                  background: '#ffffff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 900, fontSize: '1.05rem', marginRight: '0.75rem' }}>
                      Pedido #{String(p.numero_pedido).padStart(4, '0')}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {new Date(p.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: 100,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background:
                          p.estado === 'completado'
                            ? '#dcfce7'
                            : p.estado === 'procesando'
                            ? '#dbeafe'
                            : p.estado === 'cancelado'
                            ? '#fee2e2'
                            : '#fef3c7',
                        color:
                          p.estado === 'completado'
                            ? '#15803d'
                            : p.estado === 'procesando'
                            ? '#1e40af'
                            : p.estado === 'cancelado'
                            ? '#b91c1c'
                            : '#b45309',
                      }}
                    >
                      {p.estado}
                    </span>
                    <strong style={{ fontSize: '1.05rem' }}>{formatPrice(p.total)}</strong>
                  </div>
                </div>

                {p.items && p.items.length > 0 && (
                  <div style={{ fontSize: '0.825rem', color: '#4b5563', marginBottom: '0.9rem' }}>
                    {p.items.map(it => `${it.cantidad}x ${it.producto_nombre}`).join(' · ')}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link href={`/pedido/${p.id}`}>
                    <button
                      className="secondary"
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.45rem 0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <ExternalLink size={14} /> Ver Seguimiento / Comprobante
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRepeatOrder(p)}
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.45rem 0.9rem',
                      background: '#1e40af',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <RotateCcw size={14} /> 🔄 Repetir Pedido
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'WALLET' && (
        <div className="brutalist-card">
          <h3>Últimos movimientos</h3>
          {(user.transactions || []).length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Sin movimientos recientes registrados.</p>
          ) : (
            user.transactions.map((t: any) => (
              <div
                key={t.id}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  padding: '0.85rem 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{t.type}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    {new Date(t.createdAt).toLocaleDateString('es-AR')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700 }}>
                  {t.amountCoins > 0 && <div>+{t.amountCoins} Coins</div>}
                  {t.amountFiat > 0 && <div>{formatPrice(t.amountFiat)}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'MARKET' && (
        <div
          className="grid-layout"
          style={{ padding: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
        >
          {[
            { id: 1, name: 'Descuento 10% en Tienda', cost: 100 },
            { id: 2, name: 'Shaker / Gorra Vyper', cost: 500 },
            { id: 3, name: 'Pack VIP Vyper', cost: 1000 },
          ].map(r => (
            <div key={r.id} className="brutalist-card" style={{ marginBottom: 0, textAlign: 'center' }}>
              <div
                style={{
                  height: '90px',
                  background: '#f3f4f6',
                  borderRadius: 8,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                }}
              >
                🎁
              </div>
              <h4>{r.name}</h4>
              <p style={{ margin: '0.75rem 0', fontSize: '1.35rem', fontWeight: 'bold' }}>{r.cost} COINS</p>
              <Link href="/tienda/checkout">
                <button disabled={(user.coinBalance || 0) < r.cost} style={{ width: '100%', padding: '0.5rem' }}>
                  {(user.coinBalance || 0) >= r.cost ? 'Canjear en Checkout' : 'Saldo insuficiente'}
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
