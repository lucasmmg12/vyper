'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Search, Edit, Trash2, Eye, EyeOff, Star, Package, Upload, X, Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Producto, ListaPrecio } from '@/types/ecommerce';

export default function ProductosAdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: '', descripcion: '',
    precio_costo: '',
    lista_precio_id: '',
    lista_precio_minorista_id: '',
    lista_escalonada_id: '',
    lista_escalonada_minorista_id: '',
    stock: '', cantidad_minima: '1',
    categoria_id: '', marca_id: '',
    activo: true, destacado: false, en_oferta: false,
    imagenes: [] as string[],
    precio_oferta: '',
  });
  const [rubros, setRubros] = useState<{ id: string; nombre: string }[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; nombre: string; rubro_id?: string }[]>([]);
  const [marcas, setMarcas] = useState<{ id: string; nombre: string }[]>([]);
  const [saving, setSaving] = useState(false);
  // Inline creation states
  const [creatingCategoria, setCreatingCategoria] = useState(false);
  const [newCategoriaNombre, setNewCategoriaNombre] = useState('');
  const [selectedRubroForCat, setSelectedRubroForCat] = useState('');
  const [creatingRubro, setCreatingRubro] = useState(false);
  const [newRubroNombre, setNewRubroNombre] = useState('');
  const [creatingMarca, setCreatingMarca] = useState(false);
  const [newMarcaNombre, setNewMarcaNombre] = useState('');
  const [filterRubroId, setFilterRubroId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [listas, setListas] = useState<ListaPrecio[]>([]);
  const [selectedListaId, setSelectedListaId] = useState<string>('');
  const [selectedListaMinoristaId, setSelectedListaMinoristaId] = useState<string>('');
  const [selectedListaEscalonadaId, setSelectedListaEscalonadaId] = useState<string>('');
  const [selectedListaEscalonadaMinoristaId, setSelectedListaEscalonadaMinoristaId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const PAGE_SIZE = 50;

  const fetchProductos = async (page = currentPage) => {
    const params = new URLSearchParams({ all: 'true', limit: String(PAGE_SIZE), page: String(page) });
    if (search) params.set('search', search);
    const res = await fetch(`/api/ecommerce/productos?${params}`);
    const data = await res.json();
    setProductos(data.productos || []);
    setTotalPages(data.totalPages || 1);
    setTotalProducts(data.total || 0);
    setLoading(false);
  };

  const fetchFilters = async () => {
    const [rubrosRes, catRes, marcaRes, listasRes] = await Promise.all([
      fetch('/api/ecommerce/rubros'),
      fetch('/api/ecommerce/categorias'),
      fetch('/api/ecommerce/marcas'),
      fetch('/api/ecommerce/listas-precios'),
    ]);
    const [rubrosData, catData, marcaData, listasData] = await Promise.all([rubrosRes.json(), catRes.json(), marcaRes.json(), listasRes.json()]);
    setRubros(rubrosData.rubros || []);
    setCategorias(catData.categorias || []);
    setMarcas(marcaData.marcas || []);
    const fetchedListas: ListaPrecio[] = listasData.listas || [];
    setListas(fetchedListas);
    // Default is empty string => "Por defecto (automático)"
  };

  const handleCreateCategoria = async () => {
    if (!newCategoriaNombre.trim()) return;
    // If creating rubro inline too
    let rubroId = selectedRubroForCat;
    if (creatingRubro && newRubroNombre.trim()) {
      const res = await fetch('/api/ecommerce/rubros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newRubroNombre }),
      });
      const data = await res.json();
      rubroId = data.rubro?.id || '';
      setCreatingRubro(false);
      setNewRubroNombre('');
    }
    if (!rubroId) return;
    const res = await fetch('/api/ecommerce/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: newCategoriaNombre, rubro_id: rubroId }),
    });
    const data = await res.json();
    await fetchFilters();
    setForm(f => ({ ...f, categoria_id: data.categoria?.id || '' }));
    setCreatingCategoria(false);
    setNewCategoriaNombre('');
    setSelectedRubroForCat('');
  };

  const handleCreateMarca = async () => {
    if (!newMarcaNombre.trim()) return;
    const res = await fetch('/api/ecommerce/marcas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: newMarcaNombre }),
    });
    const data = await res.json();
    await fetchFilters();
    setForm(f => ({ ...f, marca_id: data.marca?.id || '' }));
    setCreatingMarca(false);
    setNewMarcaNombre('');
  };

  useEffect(() => { fetchFilters(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => { setCurrentPage(1); fetchProductos(1); }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  useEffect(() => { fetchProductos(currentPage); }, [currentPage]);

  const handleSave = async () => {
    setSaving(true);

    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio_costo: parseFloat(form.precio_costo) || 0,
      stock: parseInt(form.stock) || 0,
      cantidad_minima: parseInt(form.cantidad_minima) || 1,
      categoria_id: form.categoria_id || null,
      marca_id: form.marca_id || null,
      lista_precio_id: selectedListaId || null,
      lista_precio_minorista_id: selectedListaMinoristaId || null,
      lista_escalonada_id: selectedListaEscalonadaId || null,
      lista_escalonada_minorista_id: selectedListaEscalonadaMinoristaId || null,
      activo: form.activo,
      destacado: form.destacado,
      imagenes: form.imagenes,
      en_oferta: form.en_oferta,
      precio_oferta: parseFloat(form.precio_oferta) || 0,
    };

    try {
      if (editingId) {
        await fetch(`/api/ecommerce/productos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/ecommerce/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchProductos();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: Producto) => {
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio_costo: p.precio_costo ? String(p.precio_costo) : '',
      lista_precio_id: p.lista_precio_id || '',
      lista_precio_minorista_id: (p as any).lista_precio_minorista_id || '',
      lista_escalonada_id: (p as any).lista_escalonada_id || '',
      lista_escalonada_minorista_id: (p as any).lista_escalonada_minorista_id || '',

      stock: String(p.stock),
      cantidad_minima: String(p.cantidad_minima),
      categoria_id: p.categoria_id || '',
      marca_id: p.marca_id || '',
      activo: p.activo,
      destacado: p.destacado,
      en_oferta: p.en_oferta || false,
      imagenes: p.imagenes || [],
      precio_oferta: p.precio_oferta ? String(p.precio_oferta) : '',
    });
    setEditingId(p.id);
    setSelectedListaId(p.lista_precio_id || '');
    setSelectedListaMinoristaId((p as any).lista_precio_minorista_id || '');
    setSelectedListaEscalonadaId((p as any).lista_escalonada_id || '');
    setSelectedListaEscalonadaMinoristaId((p as any).lista_escalonada_minorista_id || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await fetch(`/api/ecommerce/productos/${id}`, { method: 'DELETE' });
    fetchProductos();
  };

  const handleToggle = async (p: Producto) => {
    await fetch(`/api/ecommerce/productos/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !p.activo }),
    });
    fetchProductos();
  };

  const resetForm = () => {
    setForm({
      nombre: '', descripcion: '',
      precio_costo: '',
      lista_precio_id: '',
      lista_precio_minorista_id: '',
      lista_escalonada_id: '',
      lista_escalonada_minorista_id: '',
      stock: '', cantidad_minima: '1',
      categoria_id: '', marca_id: '',
      activo: true, destacado: false, en_oferta: false,
      imagenes: [],
      precio_oferta: '',
    });
    setSelectedListaId('');
    setSelectedListaMinoristaId('');
    setSelectedListaEscalonadaId('');
    setSelectedListaEscalonadaMinoristaId('');
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="page-container">
      <Link href="/admin/ecommerce">
        <button className="btn-ghost" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Ecommerce
        </button>
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Productos</h1>
        <button onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '2.75rem', margin: 0 }}
        />
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="glass-card animate-scaleIn" style={{
            width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem', marginBottom: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label>Nombre *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Whey Protein 1kg" />
              </div>
            </div>

            {/* SEGMENTO DE PRECIOS */}
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              marginBottom: '1rem',
            }}>
              <h4 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                <span>💰</span> Configuración de Precios
              </h4>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label>Precio de Costo *</label>
                <input type="number" value={form.precio_costo} onChange={e => setForm({ ...form, precio_costo: e.target.value })} placeholder="0" style={{ borderColor: form.precio_costo ? 'var(--accent-green)' : undefined, maxWidth: '250px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                {/* Mayorista Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0', borderRight: '1px solid var(--border-color)', paddingRight: '1.5rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-green)', marginBottom: '1rem', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>🛒 Canal Mayorista</div>
                  
                  <div>
                    <label>Base Mayorista</label>
                    <select value={selectedListaId} onChange={e => setSelectedListaId(e.target.value)}>
                      <option value="">Por defecto</option>
                      {listas.filter(l => l.activo && l.tipo === 'markup').map(l => (
                        <option key={l.id} value={l.id}>
                          {l.nombre} ({Math.round((l.markup - 1) * 100)}%){l.es_default ? ' [Default]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Escalonada Mayorista (Opcional)</label>
                    <select value={selectedListaEscalonadaId} onChange={e => setSelectedListaEscalonadaId(e.target.value)}>
                      <option value="">Ninguna</option>
                      {listas.filter(l => l.activo && l.tipo === 'escalonada').map(l => (
                        <option key={l.id} value={l.id}>
                          {l.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.precio_costo && (() => {
                    const listaActiva = selectedListaId 
                          ? listas.find(l => l.id === selectedListaId) 
                          : listas.find(l => l.es_default && l.activo);
                    const costo = parseFloat(form.precio_costo) || 0;
                    const calculado = listaActiva ? Math.round(costo * listaActiva.markup) : costo;
                    return (
                      <div style={{ fontSize: '0.875rem', color: 'var(--accent-green)', marginTop: '0.5rem', fontWeight: 700, padding: '0.5rem', background: 'rgba(0, 255, 136, 0.05)', borderRadius: '8px' }}>
                         PRECIO VENTA: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(calculado)}
                      </div>
                    );
                  })()}
                </div>

                {/* Minorista Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-pink)', marginBottom: '1rem', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>🛍️ Canal Minorista</div>
                  
                  <div>
                    <label>Base Minorista</label>
                    <select value={selectedListaMinoristaId} onChange={e => setSelectedListaMinoristaId(e.target.value)}>
                      <option value="">Por defecto (Minorista)</option>
                      {listas.filter(l => l.activo && l.tipo === 'markup').map(l => (
                        <option key={l.id} value={l.id}>
                          {l.nombre} ({Math.round((l.markup - 1) * 100)}%){l.es_default_minorista ? ' [Default]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Escalonada Minorista (Opcional)</label>
                    <select value={selectedListaEscalonadaMinoristaId} onChange={e => setSelectedListaEscalonadaMinoristaId(e.target.value)}>
                      <option value="">Ninguna</option>
                      {listas.filter(l => l.activo && l.tipo === 'escalonada').map(l => (
                        <option key={l.id} value={l.id}>
                          {l.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.precio_costo && (() => {
                    const listaActiva = selectedListaMinoristaId 
                          ? listas.find(l => l.id === selectedListaMinoristaId) 
                          : listas.find(l => l.es_default_minorista && l.activo);
                    const costo = parseFloat(form.precio_costo) || 0;
                    const calculado = listaActiva ? Math.round(costo * listaActiva.markup) : costo;
                    return (
                      <div style={{ fontSize: '0.875rem', color: 'var(--accent-pink)', marginTop: '0.5rem', fontWeight: 700, padding: '0.5rem', background: 'rgba(255, 49, 49, 0.05)', borderRadius: '8px' }}>
                         PRECIO VENTA: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(calculado)}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>

              <div>
                <label>Stock</label>
                <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label>Cantidad Mínima</label>
                <input type="number" value={form.cantidad_minima} onChange={e => setForm({ ...form, cantidad_minima: e.target.value })} placeholder="1" />
              </div>
              {/* CATEGORÍA — Seleccionar o Crear */}
              <div>
                <label>Categoría</label>
                {!creatingCategoria ? (
                  <>
                    {/* Rubro filter */}
                    <select
                      value={filterRubroId}
                      onChange={e => { setFilterRubroId(e.target.value); setForm({ ...form, categoria_id: '' }); }}
                      style={{ marginBottom: '0.25rem', fontSize: '0.8125rem', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)' }}
                    >
                      <option value="">Todos los rubros</option>
                      {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                    <select value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}>
                      <option value="">Sin categoría</option>
                      {(filterRubroId ? categorias.filter(c => c.rubro_id === filterRubroId) : categorias).map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setCreatingCategoria(true)}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--accent-blue)', marginTop: '-0.5rem' }}
                    >
                      <Plus size={12} /> Crear nueva categoría
                    </button>
                  </>
                ) : (
                  <div style={{ background: 'var(--accent-blue-light)', padding: '0.75rem', borderRadius: 10, marginTop: '0.375rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>Nueva Categoría</div>
                    <input
                      value={newCategoriaNombre}
                      onChange={e => setNewCategoriaNombre(e.target.value)}
                      placeholder="Nombre de categoría"
                      style={{ marginBottom: '0.5rem' }}
                      autoFocus
                    />
                    {!creatingRubro ? (
                      <>
                        <select
                          value={selectedRubroForCat}
                          onChange={e => setSelectedRubroForCat(e.target.value)}
                          style={{ marginBottom: '0.25rem' }}
                        >
                          <option value="">Seleccionar rubro</option>
                          {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setCreatingRubro(true)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--accent-blue)' }}
                        >
                          <Plus size={12} /> Crear nuevo rubro
                        </button>
                      </>
                    ) : (
                      <input
                        value={newRubroNombre}
                        onChange={e => setNewRubroNombre(e.target.value)}
                        placeholder="Nombre del nuevo rubro"
                        style={{ marginBottom: '0.25rem' }}
                      />
                    )}
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleCreateCategoria}
                        disabled={!newCategoriaNombre || (!selectedRubroForCat && !newRubroNombre)}
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                      >
                        Crear
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => { setCreatingCategoria(false); setCreatingRubro(false); setNewCategoriaNombre(''); setNewRubroNombre(''); }}
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* MARCA — Seleccionar o Crear */}
              <div>
                <label>Marca</label>
                {!creatingMarca ? (
                  <>
                    <select value={form.marca_id} onChange={e => setForm({ ...form, marca_id: e.target.value })}>
                      <option value="">Sin marca</option>
                      {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setCreatingMarca(true)}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--accent-blue)', marginTop: '-0.5rem' }}
                    >
                      <Plus size={12} /> Crear nueva marca
                    </button>
                  </>
                ) : (
                  <div style={{ background: 'var(--accent-blue-light)', padding: '0.75rem', borderRadius: 10, marginTop: '0.375rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>Nueva Marca</div>
                    <input
                      value={newMarcaNombre}
                      onChange={e => setNewMarcaNombre(e.target.value)}
                      placeholder="Nombre de marca"
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleCreateMarca}
                        disabled={!newMarcaNombre}
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                      >
                        Crear
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => { setCreatingMarca(false); setNewMarcaNombre(''); }}
                        style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} style={{ width: 18, height: 18, minHeight: 'auto' }} />
                  Activo
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.destacado} onChange={e => setForm({ ...form, destacado: e.target.checked })} style={{ width: 18, height: 18, minHeight: 'auto' }} />
                  ⭐ Destacado
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.en_oferta} onChange={e => setForm({ ...form, en_oferta: e.target.checked })} style={{ width: 18, height: 18, minHeight: 'auto' }} />
                  🔥 En Oferta
                </label>
              </div>
              {form.en_oferta && (
                <div>
                  <label>Precio Oferta *</label>
                  <input type="number" value={form.precio_oferta} onChange={e => setForm({ ...form, precio_oferta: e.target.value })} placeholder="Precio con descuento" />
                </div>
              )}
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <label style={{ margin: 0 }}>Descripción</label>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={generatingDesc || !form.nombre}
                    onClick={async () => {
                      setGeneratingDesc(true);
                      try {
                        const catName = categorias.find(c => c.id === form.categoria_id)?.nombre || '';
                        const marcaName = marcas.find(m => m.id === form.marca_id)?.nombre || '';
                        const res = await fetch('/api/ecommerce/generar-descripcion', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ nombre: form.nombre, categoria: catName, marca: marcaName }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Error al generar la descripción');
                        if (data.descripcion) setForm(f => ({ ...f, descripcion: data.descripcion }));
                      } catch (err: any) { 
                        console.error(err);
                        alert(err.message || 'Error de conexión');
                      }
                      setGeneratingDesc(false);
                    }}
                    style={{
                      fontSize: '0.75rem', padding: '0.375rem 0.75rem',
                      color: 'var(--accent-blue)',
                      background: generatingDesc ? 'var(--accent-blue-light)' : 'transparent',
                    }}
                  >
                    {generatingDesc ? (
                      <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Generando...</>
                    ) : (
                      <><Sparkles size={12} /> Generar con IA</>
                    )}
                  </button>
                </div>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del producto (o generá una con IA)" rows={3} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label>Imágenes del producto</label>

                {/* Preview thumbnails - both uploaded and pending */}
                {(form.imagenes.length > 0 || uploading) && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {form.imagenes.map((img, i) => (
                      <div key={`img-${i}`} style={{
                        position: 'relative', width: 80, height: 80,
                        borderRadius: 10, overflow: 'hidden',
                        border: '2px solid var(--accent-green)',
                        background: 'var(--bg-tertiary)',
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, imagenes: form.imagenes.filter((_, idx) => idx !== i) })}
                          style={{
                            position: 'absolute', top: 3, right: 3,
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.7)', color: 'white',
                            border: 'none', cursor: 'pointer', padding: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px',
                          }}
                        >
                          <X size={10} />
                        </button>
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'rgba(0,200,100,0.85)', color: 'white',
                          fontSize: '0.5625rem', textAlign: 'center', padding: '1px 0',
                          fontWeight: 600,
                        }}>
                          ✓
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload zone */}
                <div
                  onClick={() => !uploading && document.getElementById('product-image-input')?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.background = 'var(--accent-blue-light)'; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onDrop={async e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                    if (files.length === 0) return;
                    setUploading(true);
                    const fd = new FormData();
                    files.forEach(f => fd.append('files', f));
                    try {
                      const res = await fetch('/api/ecommerce/upload', { method: 'POST', body: fd });
                      const data = await res.json();
                      if (data.urls) {
                        setForm(f => ({ ...f, imagenes: [...f.imagenes, ...data.urls] }));
                      } else if (data.error) {
                        alert('Error: ' + data.error);
                      }
                    } catch (err) { console.error(err); alert('Error al subir imágenes'); }
                    setUploading(false);
                  }}
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 12, padding: uploading ? '1rem' : '1.5rem',
                    textAlign: 'center', cursor: uploading ? 'wait' : 'pointer',
                    transition: 'all 0.2s',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <input
                    id="product-image-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    style={{ display: 'none' }}
                    onChange={async e => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      setUploading(true);
                      const fd = new FormData();
                      files.forEach(f => fd.append('files', f));
                      try {
                        const res = await fetch('/api/ecommerce/upload', { method: 'POST', body: fd });
                        const data = await res.json();
                        if (data.urls) {
                          setForm(f => ({ ...f, imagenes: [...f.imagenes, ...data.urls] }));
                        } else if (data.error) {
                          alert('Error: ' + data.error);
                        }
                      } catch (err) { console.error(err); alert('Error al subir imágenes'); }
                      setUploading(false);
                      e.target.value = '';
                    }}
                  />
                  {uploading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Subiendo imágenes...</span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>
                      <Upload size={24} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Click o arrastrá imágenes acá</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>JPG, PNG, WebP · Máx 5MB</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={handleSave} disabled={saving || !form.nombre} style={{ flex: 1 }}>
                {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear Producto')}
              </button>
              <button className="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Cargando productos...</p>
        </div>
      ) : productos.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Package size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No hay productos</h3>
          <p style={{ color: 'var(--text-muted)' }}>Creá tu primer producto para empezar.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['', 'Producto', 'Costo', 'Precio May.', 'Stock', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '0.75rem 1rem',
                      fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '1px solid var(--border-light)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem 1rem', width: 48 }}>
                      <div
                        onClick={() => p.imagenes && p.imagenes.length > 0 ? setLightbox({ images: p.imagenes, index: 0 }) : null}
                        style={{
                          width: 40, height: 40, borderRadius: 8,
                          background: 'var(--bg-tertiary)', overflow: 'hidden',
                          position: 'relative',
                          cursor: p.imagenes?.length ? 'pointer' : 'default',
                        }}
                      >
                        {p.imagenes?.[0] ? (
                          <Image src={p.imagenes[0]} alt="" fill style={{ objectFit: 'cover' }} sizes="40px" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={16} style={{ color: 'var(--text-light)' }} />
                          </div>
                        )}
                        {p.imagenes && p.imagenes.length > 1 && (
                          <div style={{
                            position: 'absolute', bottom: 2, right: 2,
                            background: 'rgba(0,0,0,0.7)', color: 'white',
                            fontSize: '0.5625rem', fontWeight: 700,
                            borderRadius: 4, padding: '1px 4px',
                            lineHeight: 1.3,
                          }}>
                            +{p.imagenes.length - 1}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                        {p.nombre}
                        {p.destacado && <Star size={12} fill="var(--accent-amber)" color="var(--accent-amber)" style={{ marginLeft: 6 }} />}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.marca?.nombre} {p.categoria ? `· ${p.categoria.nombre}` : ''}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {formatPrice(p.precio_costo || 0)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                      {formatPrice(p.precio_mayorista)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${p.stock > 0 ? 'badge-green' : 'badge-red'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${p.activo ? 'badge-green' : 'badge-gray'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn-ghost" onClick={() => handleEdit(p)} style={{ padding: '0.375rem' }}>
                          <Edit size={16} />
                        </button>
                        <button className="btn-ghost" onClick={() => handleToggle(p)} style={{ padding: '0.375rem' }}>
                          {p.activo ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button className="btn-ghost" onClick={() => handleDelete(p.id)} style={{ padding: '0.375rem', color: 'var(--accent-red)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem', borderTop: '1px solid var(--border-light)',
            }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {totalProducts.toLocaleString()} productos · Página {currentPage} de {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-ghost"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <button
                  className="btn-ghost"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Image Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
          }}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 210,
              background: 'rgba(255,255,255,0.2)', border: 'none',
              color: 'white', cursor: 'pointer', borderRadius: '50%',
              width: 44, height: 44, minHeight: 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, boxShadow: 'none', fontSize: 0,
              letterSpacing: 0, textTransform: 'none' as const,
            }}
          >
            <X size={24} color="white" />
          </button>

          {/* Counter */}
          <div style={{
            position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600,
          }}>
            {lightbox.index + 1} / {lightbox.images.length}
          </div>

          {/* Prev */}
          {lightbox.images.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length }); }}
              style={{
                position: 'absolute', left: 16, zIndex: 210,
                background: 'rgba(255,255,255,0.2)', border: 'none',
                color: 'white', cursor: 'pointer', borderRadius: '50%',
                width: 48, height: 48, minHeight: 'auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, boxShadow: 'none', fontSize: 0,
                letterSpacing: 0, textTransform: 'none' as const,
              }}
            >
              <ChevronLeft size={28} color="white" />
            </button>
          )}

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            onClick={e => e.stopPropagation()}
            src={lightbox.images[lightbox.index]}
            alt=""
            style={{
              maxWidth: '85vw', maxHeight: '85vh',
              objectFit: 'contain', borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          />

          {/* Next */}
          {lightbox.images.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length }); }}
              style={{
                position: 'absolute', right: 16, zIndex: 210,
                background: 'rgba(255,255,255,0.2)', border: 'none',
                color: 'white', cursor: 'pointer', borderRadius: '50%',
                width: 48, height: 48, minHeight: 'auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, boxShadow: 'none', fontSize: 0,
                letterSpacing: 0, textTransform: 'none' as const,
              }}
            >
              <ChevronRight size={28} color="white" />
            </button>
          )}

          {/* Thumbnails strip */}
          {lightbox.images.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 20,
              display: 'flex', gap: '0.5rem', justifyContent: 'center',
            }}>
              {lightbox.images.map((img, i) => (
                <div
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightbox({ ...lightbox, index: i }); }}
                  style={{
                    width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
                    border: `2px solid ${i === lightbox.index ? 'white' : 'rgba(255,255,255,0.2)'}`,
                    cursor: 'pointer', opacity: i === lightbox.index ? 1 : 0.5,
                    transition: 'all 0.2s',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
