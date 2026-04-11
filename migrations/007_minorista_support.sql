-- ============================================
-- MIGRACIÓN 007: Soporte para Tienda Minorista
-- ============================================

-- 1. Flags de visibilidad por tienda en productos
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS activo_mayorista boolean DEFAULT true;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS activo_minorista boolean DEFAULT true;

-- 2. Lista de precios individual para minorista
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS lista_precio_minorista_id uuid REFERENCES public.listas_precios(id) ON DELETE SET NULL;

-- 3. Lista de precios global (Default) para minorista
ALTER TABLE public.listas_precios ADD COLUMN IF NOT EXISTS es_default_minorista boolean DEFAULT false;

-- (Opcional) Renombrar conceptualmente en comentarios: 
-- productos.lista_precio_id -> Se usará para Mayorista
-- listas_precios.es_default -> Se usará para Mayorista

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_productos_activo_mayorista ON public.productos(activo_mayorista);
CREATE INDEX IF NOT EXISTS idx_productos_activo_minorista ON public.productos(activo_minorista);
