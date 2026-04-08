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

// Cart types (client-side only)
export interface CartItem {
  producto_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
  stock: number;
  cantidad_minima: number;
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
