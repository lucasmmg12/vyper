'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, ArrowLeft, ChevronLeft, ChevronRight, Tag, Sparkles } from 'lucide-react';
import { Producto } from '@/types/ecommerce';
import { useCart } from '@/lib/cart';

export default function ProductoPage() {
  const params = useParams();
  const id = params.id as string;
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const res = await fetch(`/api/ecommerce/productos/${id}`);
        const data = await res.json();
        setProducto(data.producto);
        setCantidad(1);
      } catch {
        console.error('Error fetching producto');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProducto();
  }, [id]);

  const calcPrice = (qty: number) => {
    if (!producto) return 0;
    let fallback = producto.precio_mayorista;
    if (producto.lista_activa && producto.lista_activa.tipo === 'escalonada' && producto.lista_activa.escalones) {
      const validEscalones = producto.lista_activa.escalones
        .filter(e => qty >= e.cantidad_minima)
        .sort((a, b) => b.cantidad_minima - a.cantidad_minima);
      if (validEscalones.length > 0) {
        return Math.round((producto.precio_costo || 0) * validEscalones[0].multiplicador);
      }
    }
    return fallback;
  };

  const handleAddToCart = () => {
    if (!producto) return;
    addItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: calcPrice(cantidad),
      cantidad,
      imagen: producto.imagenes?.[0],
      stock: producto.stock,
      cantidad_minima: producto.cantidad_minima,
      venta_costo: producto.precio_costo,
      venta_lista: producto.lista_activa,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ height: 20, width: 100, background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          <div style={{ aspectRatio: '1', background: 'var(--bg-tertiary)', borderRadius: 16 }} />
          <div>
            <div style={{ height: 24, background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: '1rem', width: '60%' }} />
            <div style={{ height: 32, background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: '1rem', width: '30%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <h2>Producto no encontrado</h2>
        <Link href="/tienda"><button style={{ marginTop: '1rem' }}>Volver al catálogo</button></Link>
      </div>
    );
  }

  const images = producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes : [];
  const discount = producto.precio_unitario > producto.precio_mayorista
    ? Math.round((1 - producto.precio_mayorista / producto.precio_unitario) * 100)
    : 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 1.5rem 3rem' }}>
      {/* Back link */}
      <Link href="/tienda">
        <button className="btn-ghost" style={{ marginBottom: '1rem', fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}>
          <ArrowLeft size={16} /> Volver al catálogo
        </button>
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="product-detail-grid">
        {/* Image Gallery */}
        <div>
          <div style={{
            aspectRatio: '1',
            background: 'var(--bg-tertiary)',
            borderRadius: 16,
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '0.75rem',
          }}>
            {images.length > 0 ? (
              <>
                <Image
                  src={images[selectedImage]}
                  alt={producto.nombre}
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {images.length > 1 && (
                  <>
                    <button
                      className="btn-ghost"
                      onClick={() => setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1)}
                      style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: 40, height: 40, padding: 0 }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1)}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: 40, height: 40, padding: 0 }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
                <ShoppingCart size={64} />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  style={{
                    width: 64, height: 64, flexShrink: 0,
                    borderRadius: 10, overflow: 'hidden', position: 'relative',
                    border: selectedImage === i ? '2px solid var(--accent)' : '2px solid var(--border-color)',
                    padding: 0, background: 'var(--bg-tertiary)',
                  }}
                >
                  <Image src={img} alt="" fill style={{ objectFit: 'cover' }} sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {producto.marca && (
            <span className="badge badge-blue" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
              {producto.marca.nombre}
            </span>
          )}

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.2 }}>
            {producto.nombre}
          </h1>

          {producto.categoria && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {producto.categoria.rubro?.nombre && `${producto.categoria.rubro.nombre} / `}{producto.categoria.nombre}
            </p>
          )}

          {/* Price */}
          <div style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 14,
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {formatPrice(calcPrice(cantidad))}
              </span>
              {discount > 0 && (
                <>
                  <span style={{ fontSize: '1rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                    {formatPrice(producto.precio_unitario)}
                  </span>
                  <span className="badge badge-green">
                    <Tag size={12} style={{ marginRight: 4 }} /> {discount}% OFF
                  </span>
                </>
              )}
            </div>
            
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Precio mayorista (x1 un.)
            </p>

            {/* Tiers/Escalones info */}
            {producto.lista_activa?.tipo === 'escalonada' && producto.lista_activa.escalones && producto.lista_activa.escalones.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <Sparkles size={16} fill="var(--accent-green)" color="var(--accent-green)" /> Llevá más, pagá menos
                </h4>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {/* Unified Tier list */}
                  {(() => {
                    const baseQty = Math.max(1, producto?.cantidad_minima || 1);
                    const basePrice = calcPrice(baseQty);
                    
                    const tiers = [
                      {
                        id: 'base',
                        label: 'Por Menor',
                        qty: baseQty,
                        price: basePrice,
                        isBase: true
                      },
                      ...producto.lista_activa.escalones
                        .filter(e => e.cantidad_minima > baseQty)
                        .map(e => ({
                          id: e.id,
                          label: `${e.cantidad_minima} un. o más`,
                          qty: e.cantidad_minima,
                          price: Math.round((producto.precio_costo || 0) * e.multiplicador),
                          isBase: false
                        }))
                    ].sort((a, b) => a.qty - b.qty);

                    // Determine which is currently selected
                    const activeTierIndex = [...tiers].reverse().findIndex(t => cantidad >= t.qty);
                    const activeTierId = activeTierIndex !== -1 ? [...tiers].reverse()[activeTierIndex].id : tiers[0].id;

                    return tiers.map(tier => {
                      const isMet = tier.id === activeTierId;
                      const savings = tier.isBase ? 0 : Math.round(100 - (tier.price / basePrice * 100));

                      return (
                        <div
                          key={tier.id}
                          onClick={() => setCantidad(tier.qty)}
                          style={{
                            background: isMet ? '#111' : 'transparent',
                            border: isMet ? '2px solid var(--accent-green)' : '1px solid var(--border-color)',
                            borderRadius: 12,
                            padding: '1rem 0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            textAlign: 'center',
                            position: 'relative',
                            boxShadow: isMet ? '0 8px 24px rgba(0, 255, 136, 0.15)' : 'none',
                          }}
                        >
                          {savings > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: -10, left: '50%', transform: 'translateX(-50%)',
                              background: 'var(--accent-green)',
                              color: '#000',
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              padding: '0.125rem 0.5rem',
                              borderRadius: 12,
                              whiteSpace: 'nowrap',
                            }}>
                              Ahorrás {savings}%
                            </div>
                          )}
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isMet ? '#fff' : 'var(--text-secondary)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: savings > 0 ? 4 : 0 }}>
                            {tier.isBase ? tier.label : <><span style={{ fontSize: '0.9rem' }}>{tier.qty}</span> un. o más</>}
                          </div>
                          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: isMet ? 'var(--accent-green)' : 'var(--text-main)' }}>
                            {formatPrice(tier.price)}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Quantity selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ marginBottom: '0.5rem', display: 'block' }}>Cantidad</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                className="secondary"
                onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
                style={{ width: 48, height: 48, padding: 0, borderRadius: 12 }}
              >
                <Minus size={18} />
              </button>
              <input
                type="number"
                value={cantidad}
                onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: 80, textAlign: 'center', margin: 0, fontSize: '1.125rem', fontWeight: 700 }}
                min={1}
              />
              <button
                className="secondary"
                onClick={() => setCantidad(prev => prev + 1)}
                style={{ width: 48, height: 48, padding: 0, borderRadius: 12 }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Subtotal */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 12, marginBottom: '1rem',
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Subtotal</span>
            <span style={{ fontSize: '1.375rem', fontWeight: 800 }}>
              {formatPrice(calcPrice(cantidad) * cantidad)}
            </span>
          </div>

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: 14,
              background: added ? 'var(--accent-green)' : 'var(--accent)',
            }}
          >
            {added ? '✓ Agregado al pedido' : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={20} /> Agregar al pedido
              </span>
            )}
          </button>

          {/* Description */}
          {producto.descripcion && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Descripción</h3>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {producto.descripcion}
              </p>
            </div>
          )}

          {producto.sku && (
            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>
              SKU: {producto.sku}
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .product-detail-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
