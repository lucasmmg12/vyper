'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, X, ShoppingCart, Plus, Star, ChevronDown, Flame, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Producto, Rubro, Categoria, Marca } from '@/types/ecommerce';
import { useCart } from '@/lib/cart';

// ═════ Product Card Component ═════
function ProductCard({ producto, formatPrice, onAdd, addedId }: {
  producto: Producto;
  formatPrice: (n: number) => string;
  onAdd: (p: Producto) => void;
  addedId: string | null;
}) {
  const isOnSale = producto.en_oferta && producto.precio_oferta && producto.precio_oferta > 0;
  const displayPrice = isOnSale ? producto.precio_oferta! : producto.precio_mayorista;
  const discount = isOnSale
    ? Math.round((1 - producto.precio_oferta! / producto.precio_mayorista) * 100)
    : 0;

  return (
    <div
      className="glass-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      {/* Image */}
      <Link href={`/tienda/producto/${producto.id}`}>
        <div style={{
          aspectRatio: '1',
          background: '#f8f9fa',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
        }}>
          {producto.imagenes && producto.imagenes.length > 0 ? (
            <Image
              src={producto.imagenes[0]}
              alt={producto.nombre}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db' }}>
              <ShoppingCart size={40} />
            </div>
          )}
          {/* Badges */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {producto.destacado && (
              <span style={{
                background: '#F59E0B', color: 'white',
                padding: '0.2rem 0.5rem', borderRadius: 100,
                fontSize: '0.65rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <Star size={10} fill="white" /> Destacado
              </span>
            )}
            {isOnSale && (
              <span style={{
                background: '#ef4444', color: 'white',
                padding: '0.2rem 0.5rem', borderRadius: 100,
                fontSize: '0.65rem', fontWeight: 700,
              }}>
                -{discount}%
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div style={{ padding: '0.875rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {producto.marca && (
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
            {producto.marca.nombre}
          </span>
        )}
        <Link href={`/tienda/producto/${producto.id}`}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.35,
            marginBottom: '0.375rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            cursor: 'pointer',
            color: '#111',
          }}>
            {producto.nombre}
          </h4>
        </Link>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '0.625rem' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#111' }}>
              {formatPrice(displayPrice)}
            </span>
            {isOnSale && (
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                {formatPrice(producto.precio_mayorista)}
              </span>
            )}
          </div>
          <button
            onClick={() => onAdd(producto)}
            style={{
              width: '100%',
              fontSize: '0.8125rem',
              padding: '0.5rem',
              background: addedId === producto.id ? '#10b981' : '#111111',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {addedId === producto.id ? (
              <span>✓ Agregado</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                <Plus size={15} /> Agregar
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════ Horizontal Scroll Section ═════
function ProductSection({ title, icon, products, formatPrice, onAdd, addedId, accentColor, seeAllHref }: {
  title: string;
  icon: React.ReactNode;
  products: Producto[];
  formatPrice: (n: number) => string;
  onAdd: (p: Producto) => void;
  addedId: string | null;
  accentColor: string;
  seeAllHref?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${accentColor}12`, color: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </span>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111', margin: 0 }}>{title}</h2>
        </div>
        {seeAllHref && (
          <button
            className="btn-ghost"
            style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            Ver todo <ArrowRight size={14} />
          </button>
        )}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
        gap: '0.875rem',
      }}>
        {products.map(p => (
          <ProductCard
            key={p.id}
            producto={p}
            formatPrice={formatPrice}
            onAdd={onAdd}
            addedId={addedId}
          />
        ))}
      </div>
    </section>
  );
}

// ═════ Main Page Content ═════
function TiendaPageContent() {
  const searchParams = useSearchParams();
  const initRubro = searchParams.get('rubro') || '';
  const initCategoria = searchParams.get('categoria') || '';
  const initMarca = searchParams.get('marca') || '';

  const [productos, setProductos] = useState<Producto[]>([]);
  const [ofertas, setOfertas] = useState<Producto[]>([]);
  const [destacados, setDestacados] = useState<Producto[]>([]);
  const [nuevos, setNuevos] = useState<Producto[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRubro, setSelectedRubro] = useState<string>(initRubro);
  const [selectedCategoria, setSelectedCategoria] = useState<string>(initCategoria);
  const [selectedMarca, setSelectedMarca] = useState<string>(initMarca);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'home' | 'catalog'>(initRubro || initCategoria || initMarca ? 'catalog' : 'home');
  const { addItem, items } = useCart();

  useEffect(() => {
    const r = searchParams.get('rubro') || '';
    const c = searchParams.get('categoria') || '';
    const m = searchParams.get('marca') || '';
    if (r || c || m) {
      setSelectedRubro(r);
      setSelectedCategoria(c);
      setSelectedMarca(m);
      setActiveSection('catalog');
      setPage(1);
    }
  }, [searchParams]);

  // Fetch featured sections (home view)
  const fetchSections = async () => {
    try {
      const [ofertasRes, allRes] = await Promise.all([
        fetch('/api/ecommerce/productos?en_oferta=true&limit=50&tienda=minorista'),
        fetch('/api/ecommerce/productos?limit=50&tienda=minorista'),
      ]);
      const [ofertasData, allData] = await Promise.all([
        ofertasRes.json(),
        allRes.json(),
      ]);

      const allProducts: Producto[] = allData.productos || [];
      
      const filterWithImages = (list: Producto[]) => 
        (list || []).filter(p => p.imagenes && p.imagenes.length > 0 && typeof p.imagenes[0] === 'string' && p.imagenes[0].length > 5);

      setOfertas(filterWithImages(ofertasData.productos));
      setDestacados(filterWithImages(allProducts.filter(p => p.destacado)));

      // New arrivals: sort by created_at desc, take 6
      const sorted = [...filterWithImages(allProducts)].sort((a, b) =>
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
      setNuevos(sorted.slice(0, 6));
    } catch {
      console.error('Error fetching sections');
    }
  };

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCategoria) params.set('categoria_id', selectedCategoria);
    if (selectedRubro) params.set('rubro_id', selectedRubro);
    if (selectedMarca) params.set('marca_id', selectedMarca);
    params.set('page', String(page));
    params.set('limit', '50');
    params.set('tienda', 'minorista');

    try {
      const res = await fetch(`/api/ecommerce/productos?${params}`);
      const data = await res.json();
      
      const filterWithImages = (list: Producto[]) => 
        (list || []).filter(p => p.imagenes && p.imagenes.length > 0 && typeof p.imagenes[0] === 'string' && p.imagenes[0].length > 5);
        
      setProductos(filterWithImages(data.productos));
      setTotalPages(data.totalPages || 1);
    } catch {
      console.error('Error fetching productos');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategoria, selectedRubro, selectedMarca, page]);

  const fetchFilters = async () => {
    const [rubrosRes, categoriasRes, marcasRes] = await Promise.all([
      fetch('/api/ecommerce/rubros'),
      fetch('/api/ecommerce/categorias'),
      fetch('/api/ecommerce/marcas'),
    ]);
    const [rubrosData, categoriasData, marcasData] = await Promise.all([
      rubrosRes.json(),
      categoriasRes.json(),
      marcasRes.json(),
    ]);
    setRubros(rubrosData.rubros || []);
    setCategorias(categoriasData.categorias || []);
    setMarcas(marcasData.marcas || []);
  };

  useEffect(() => { fetchFilters(); fetchSections(); }, []);
  useEffect(() => {
    if (activeSection === 'catalog') fetchProductos();
  }, [fetchProductos, activeSection]);

  const handleAddToCart = (producto: Producto) => {
    const price = (producto.en_oferta && producto.precio_oferta && producto.precio_oferta > 0)
      ? producto.precio_oferta
      : producto.precio_mayorista;

    addItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: price,
      cantidad: 1,
      imagen: producto.imagenes?.[0],
      stock: producto.stock,
      cantidad_minima: producto.cantidad_minima,
    });
    setAddedId(producto.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const clearFilters = () => {
    setSelectedRubro('');
    setSelectedCategoria('');
    setSelectedMarca('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = selectedRubro || selectedCategoria || selectedMarca || search;

  const filteredCategorias = selectedRubro
    ? categorias.filter(c => c.rubro_id === selectedRubro)
    : categorias;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

  const switchToCatalog = () => {
    setActiveSection('catalog');
    setLoading(true);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem 3rem' }}>

      {/* ===== VIDEO DE PORTADA ===== */}
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        marginBottom: '1.5rem',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#000',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
      }}>
        <iframe 
          width="100%" 
          height="100%" 
          src="https://www.youtube.com/embed/XBfY8ZtRqQk?autoplay=1&mute=1&loop=1&playlist=XBfY8ZtRqQk&controls=0&rel=0&showinfo=0" 
          title="Vyper Suplementos" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
          style={{ display: 'block', border: 'none', pointerEvents: 'none' }}
        />
      </div>

      {/* ===== HERO ===== */}
      <div style={{
        borderRadius: 16,
        padding: '2.5rem 2rem',
        marginBottom: '1.5rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '200px',
      }}>
        <Image
          src="/gym.png"
          alt="Gym background"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.25) 100%)',
          zIndex: 1,
        }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 900, letterSpacing: '-0.01em' }}>
            Tienda Oficial 🛒
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9375rem', marginBottom: '0.5rem', maxWidth: '480px', lineHeight: 1.5 }}>
            Suplementos, indumentaria y accesorios deportivos.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
            📦 Solo se muestran productos con stock disponible
          </p>
          <div style={{ position: 'relative', maxWidth: '480px' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
                if (e.target.value) setActiveSection('catalog');
              }}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                paddingLeft: '2.75rem',
                margin: 0,
                borderRadius: '100px',
                backdropFilter: 'blur(8px)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ===== NAV TABS ===== */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.25rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: 0,
      }}>
        {[
          { key: 'home' as const, label: 'Inicio', icon: <Sparkles size={15} /> },
          { key: 'catalog' as const, label: 'Catálogo completo', icon: <ShoppingCart size={15} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              fontWeight: activeSection === tab.key ? 600 : 400,
              color: activeSection === tab.key ? '#111' : '#6b7280',
              background: 'none',
              border: 'none',
              borderBottom: activeSection === tab.key ? '2px solid #111' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderRadius: 0,
              marginBottom: '-1px',
              minHeight: 'auto',
              letterSpacing: 'normal',
              textTransform: 'none',
              boxShadow: 'none',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
        
        {/* Dropdown de Categorías/Rubros posicionado a la derecha de las tabs */}
        <div style={{ marginLeft: 'auto', position: 'relative', alignSelf: 'center' }}>
           <select
             onChange={(e) => {
               const val = e.target.value;
               if (!val) return;
               
               if (val.startsWith('RUB_')) {
                 setSelectedRubro(val.replace('RUB_', ''));
                 setSelectedCategoria('');
               } else if (val.startsWith('CAT_')) {
                 const catId = val.replace('CAT_', '');
                 const cat = categorias.find(c => c.id === catId);
                 if (cat) setSelectedRubro(cat.rubro_id || '');
                 setSelectedCategoria(catId);
               }
               setPage(1);
               setActiveSection('catalog');
               e.target.value = ''; // Reset select text to default
             }}
             style={{
               background: '#f9fafb',
               border: '1px solid #e5e7eb',
               borderRadius: 20,
               padding: '0.375rem 2rem 0.375rem 1rem',
               fontSize: '0.8125rem',
               fontWeight: 600,
               color: '#111',
               cursor: 'pointer',
               outline: 'none',
               appearance: 'none',
               WebkitAppearance: 'none',
             }}
           >
             <option value="">Explorar por Rubro...</option>
             <optgroup label="🏷️ Rubros Generales">
               {rubros.map(r => (
                 <option key={r.id} value={`RUB_${r.id}`}>{r.nombre}</option>
               ))}
             </optgroup>
             <optgroup label="📂 Categorías Específicas">
               {categorias.map(c => (
                 <option key={c.id} value={`CAT_${c.id}`}>{c.nombre}</option>
               ))}
             </optgroup>
           </select>
           <ChevronDown size={14} color="#666" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* ═══════════════════════ HOME VIEW ═══════════════════════ */}
      {activeSection === 'home' && (
        <>
          {/* Ofertas */}
          <ProductSection
            title="Ofertas"
            icon={<Flame size={18} />}
            products={ofertas}
            formatPrice={formatPrice}
            onAdd={handleAddToCart}
            addedId={addedId}
            accentColor="#ef4444"
          />

          {/* Destacados */}
          <ProductSection
            title="Destacados"
            icon={<Star size={18} />}
            products={destacados}
            formatPrice={formatPrice}
            onAdd={handleAddToCart}
            addedId={addedId}
            accentColor="#f59e0b"
          />

          {/* Últimos Ingresos */}
          <ProductSection
            title="Últimos Ingresos"
            icon={<Clock size={18} />}
            products={nuevos}
            formatPrice={formatPrice}
            onAdd={handleAddToCart}
            addedId={addedId}
            accentColor="#3b82f6"
          />

          {/* CTA to full catalog */}
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: '#f9fafb',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
          }}>
            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.9375rem' }}>
              Explorá todos los productos disponibles
            </p>
            <button
              onClick={switchToCatalog}
              style={{
                background: '#111',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: 10,
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Ver catálogo completo <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* ═══════════════════════ CATALOG VIEW ═══════════════════════ */}
      {activeSection === 'catalog' && (
        <>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}>
            <button
              className="secondary"
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1rem',
                fontSize: '0.875rem',
                borderColor: showFilters ? '#111' : undefined,
              }}
            >
              <Filter size={16} />
              Filtrar
              <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>

            {hasActiveFilters && (
              <button className="btn-ghost" onClick={clearFilters} style={{ fontSize: '0.8125rem', color: '#ef4444' }}>
                <X size={14} /> Limpiar filtros
              </button>
            )}

            <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#6b7280' }}>
              {loading ? 'Cargando...' : `${productos.length} productos`}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label>Rubro</label>
                  <select
                    value={selectedRubro}
                    onChange={e => { setSelectedRubro(e.target.value); setSelectedCategoria(''); setPage(1); }}
                  >
                    <option value="">Todos los rubros</option>
                    {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label>Categoría</label>
                  <select
                    value={selectedCategoria}
                    onChange={e => { setSelectedCategoria(e.target.value); setPage(1); }}
                  >
                    <option value="">Todas las categorías</option>
                    {filteredCategorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label>Marca</label>
                  <select
                    value={selectedMarca}
                    onChange={e => { setSelectedMarca(e.target.value); setPage(1); }}
                  >
                    <option value="">Todas las marcas</option>
                    {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '0.875rem' }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass-card" style={{ height: 300 }}>
                  <div style={{ height: 180, background: '#f3f4f6', borderRadius: 12, marginBottom: '0.75rem' }} />
                  <div style={{ height: 14, background: '#f3f4f6', borderRadius: 6, marginBottom: '0.5rem', width: '80%' }} />
                  <div style={{ height: 12, background: '#f3f4f6', borderRadius: 6, width: '50%' }} />
                </div>
              ))}
            </div>
          ) : productos.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <ShoppingCart size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No se encontraron productos</h3>
              <p style={{ color: '#6b7280' }}>Probá ajustando los filtros o el término de búsqueda.</p>
              {hasActiveFilters && (
                <button className="secondary" onClick={clearFilters} style={{ marginTop: '1rem' }}>
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '0.875rem' }}>
                {productos.map(p => (
                  <ProductCard
                    key={p.id}
                    producto={p}
                    formatPrice={formatPrice}
                    onAdd={handleAddToCart}
                    addedId={addedId}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      style={{
                        minWidth: 40,
                        padding: '0.5rem',
                        fontSize: '0.875rem',
                        background: page === i + 1 ? '#111' : '#fff',
                        color: page === i + 1 ? '#fff' : '#111',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ═══ Floating WhatsApp Button ═══ */}
      <a
        href="https://api.whatsapp.com/send/?phone=5492646298880&text=Hola%20Vyper!%20Quiero%20hacer%20un%20pedido%20mayorista%20🛒&type=phone_number&app_absent=0"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          zIndex: 50,
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(37, 211, 102, 0.5)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(37, 211, 102, 0.4)';
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}

export default function TiendaPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <TiendaPageContent />
    </Suspense>
  );
}
