-- ============================================
-- MIGRACIÓN 004: Costos, Compras y Listas de Precios
-- ============================================

-- 1. Agregar precio_costo a productos
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS precio_costo numeric DEFAULT 0.0;

-- 2. COMPRAS (encabezado de compra / ingreso de mercadería)
CREATE TABLE IF NOT EXISTS public.compras (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor text,
  numero_factura text,
  notas text,
  total numeric DEFAULT 0.0,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada')),
  fecha timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. COMPRA ITEMS (detalle de compra)
CREATE TABLE IF NOT EXISTS public.compra_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  compra_id uuid REFERENCES public.compras(id) ON DELETE CASCADE NOT NULL,
  producto_id uuid REFERENCES public.productos(id) ON DELETE SET NULL,
  producto_nombre text NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric NOT NULL DEFAULT 0.0,
  subtotal numeric NOT NULL DEFAULT 0.0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. LISTAS DE PRECIOS
CREATE TABLE IF NOT EXISTS public.listas_precios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  tipo text DEFAULT 'markup' CHECK (tipo IN ('markup', 'escalonada')),
  markup numeric DEFAULT 1.0,
  activo boolean DEFAULT true,
  es_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ESCALONES DE LISTA (para tipo 'escalonada')
CREATE TABLE IF NOT EXISTS public.lista_precio_escalones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lista_id uuid REFERENCES public.listas_precios(id) ON DELETE CASCADE NOT NULL,
  cantidad_minima integer NOT NULL DEFAULT 1,
  multiplicador numeric NOT NULL DEFAULT 1.0,
  orden integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PROMOCIONES POR PRODUCTO (overrides individuales)
CREATE TABLE IF NOT EXISTS public.producto_promociones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id uuid REFERENCES public.productos(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  tipo text DEFAULT 'markup' CHECK (tipo IN ('markup', 'precio_fijo', 'descuento')),
  valor numeric NOT NULL DEFAULT 0.0,
  cantidad_minima integer DEFAULT 1,
  activo boolean DEFAULT true,
  fecha_inicio timestamp with time zone,
  fecha_fin timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_compra_items_compra ON public.compra_items(compra_id);
CREATE INDEX IF NOT EXISTS idx_compras_estado ON public.compras(estado);
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON public.compras(fecha);
CREATE INDEX IF NOT EXISTS idx_listas_precios_activo ON public.listas_precios(activo);
CREATE INDEX IF NOT EXISTS idx_lista_escalones_lista ON public.lista_precio_escalones(lista_id);
CREATE INDEX IF NOT EXISTS idx_producto_promos_producto ON public.producto_promociones(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_promos_activo ON public.producto_promociones(activo);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listas_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_precio_escalones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_promociones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for anon" ON public.compras;
CREATE POLICY "Enable all for anon" ON public.compras FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all for anon" ON public.compra_items;
CREATE POLICY "Enable all for anon" ON public.compra_items FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all for anon" ON public.listas_precios;
CREATE POLICY "Enable all for anon" ON public.listas_precios FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all for anon" ON public.lista_precio_escalones;
CREATE POLICY "Enable all for anon" ON public.lista_precio_escalones FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all for anon" ON public.producto_promociones;
CREATE POLICY "Enable all for anon" ON public.producto_promociones FOR ALL USING (true);
