// ============================================
// VYPER ECOMMERCE B2B — TYPES
// ============================================

export interface Rubro {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden: number;
  activo: boolean;
  created_at: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  rubro_id: string;
  orden: number;
  activo: boolean;
  created_at: string;
  // Joined
  rubro?: Rubro;
}

export interface Marca {
  id: string;
  nombre: string;
  logo_url?: string;
  activo: boolean;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  sku?: string;
  precio_costo: number;
  precio_mayorista: number;
  precio_unitario: number;
  stock: number;
  cantidad_minima: number;
  categoria_id?: string;
  marca_id?: string;
  imagenes: string[];
  activo: boolean;
  destacado: boolean;
  en_oferta: boolean;
  precio_oferta: number;
  created_at: string;
  updated_at: string;
  // Joined
  categoria?: Categoria;
  marca?: Marca;
  promociones?: ProductoPromocion[];
  lista_precio_id?: string;
  lista_precio_minorista_id?: string;
  lista_precio?: ListaPrecio;
  lista_precio_minorista?: ListaPrecio;
  lista_activa?: ListaPrecio; // Virtual field injected by API
}

export interface Pedido {
  id: string;
  numero_pedido: number;
  cliente_nombre: string;
  cliente_email?: string;
  cliente_telefono: string;
  estado: 'pendiente' | 'procesando' | 'completado' | 'cancelado';
  total: number;
  notas?: string;
  notificado_whatsapp: boolean;
  created_at: string;
  // Joined
  items?: PedidoItem[];
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  producto_id?: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  // Joined
  producto?: Producto;
}

// ============================================
// COMPRAS (Purchases / Stock Entry)
// ============================================

export interface Compra {
  id: string;
  proveedor?: string;
  numero_factura?: string;
  notas?: string;
  total: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  fecha: string;
  created_at: string;
  // Joined
  items?: CompraItem[];
}

export interface CompraItem {
  id: string;
  compra_id: string;
  producto_id?: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
  // Joined
  producto?: Producto;
}

// ============================================
// LISTAS DE PRECIOS (Price Lists)
// ============================================

export interface ListaPrecio {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: 'markup' | 'escalonada';
  markup: number;
  activo: boolean;
  es_default: boolean;
  es_default_minorista: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  escalones?: ListaPrecioEscalon[];
}

export interface ListaPrecioEscalon {
  id: string;
  lista_id: string;
  cantidad_minima: number;
  multiplicador: number;
  orden: number;
  created_at: string;
}

// ============================================
// PROMOCIONES POR PRODUCTO
// ============================================

export interface ProductoPromocion {
  id: string;
  producto_id: string;
  nombre: string;
  tipo: 'markup' | 'precio_fijo' | 'descuento';
  valor: number;
  cantidad_minima: number;
  activo: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
  created_at: string;
  // Joined
  producto?: Producto;
}

// Cart types (client-side only)
export interface CartItem {
  producto_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
  stock: number;
  cantidad_minima: number;
  venta_costo?: number;
  venta_lista?: ListaPrecio;
}

export interface CheckoutData {
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  notas?: string;
}

// API response types
export interface ProductoFilters {
  search?: string;
  categoria_id?: string;
  rubro_id?: string;
  marca_id?: string;
  destacado?: boolean;
  en_oferta?: boolean;
  page?: number;
  limit?: number;
}
