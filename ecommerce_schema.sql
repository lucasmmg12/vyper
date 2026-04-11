-- ============================================
-- VYPER ECOMMERCE B2B — SCHEMA
-- Tablas nuevas para el módulo ecommerce
-- No modifica tablas existentes
-- ============================================

-- 1. RUBROS (Suplementos, Indumentaria, Accesorios, etc.)
CREATE TABLE IF NOT EXISTS public.rubros (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  icono text, -- emoji or icon name
  orden integer DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CATEGORÍAS (Proteínas, Creatinas, Jersey, etc.)
CREATE TABLE IF NOT EXISTS public.categorias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  imagen_url text,
  rubro_id uuid REFERENCES public.rubros(id) ON DELETE CASCADE,
  orden integer DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MARCAS (Star Nutrition, HTN, ENA, etc.)
CREATE TABLE IF NOT EXISTS public.marcas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  logo_url text,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PRODUCTOS
CREATE TABLE IF NOT EXISTS public.productos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  sku text,
  precio_costo numeric DEFAULT 0.0,
  precio_mayorista numeric DEFAULT 0.0,
  precio_unitario numeric DEFAULT 0.0,
  stock integer DEFAULT 0,
  cantidad_minima integer DEFAULT 1,
  categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  marca_id uuid REFERENCES public.marcas(id) ON DELETE SET NULL,
  imagenes jsonb DEFAULT '[]'::jsonb,
  activo boolean DEFAULT true,
  destacado boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PEDIDOS
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido serial,
  cliente_nombre text NOT NULL,
  cliente_email text,
  cliente_telefono text NOT NULL,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'completado', 'cancelado')),
  total numeric DEFAULT 0.0,
  notas text,
  notificado_whatsapp boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PEDIDO ITEMS
CREATE TABLE IF NOT EXISTS public.pedido_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
  producto_id uuid REFERENCES public.productos(id) ON DELETE SET NULL,
  producto_nombre text NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric NOT NULL DEFAULT 0.0,
  subtotal numeric NOT NULL DEFAULT 0.0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_marca ON public.productos(marca_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON public.productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_destacado ON public.productos(destacado);
CREATE INDEX IF NOT EXISTS idx_categorias_rubro ON public.categorias(rubro_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON public.pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON public.productos USING gin(to_tsvector('spanish', nombre));

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.rubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for anon" ON public.rubros;
CREATE POLICY "Enable all for anon" ON public.rubros FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all for anon" ON public.categorias;
CREATE POLICY "Enable all for anon" ON public.categorias FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all for anon" ON public.marcas;
CREATE POLICY "Enable all for anon" ON public.marcas FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all for anon" ON public.productos;
CREATE POLICY "Enable all for anon" ON public.productos FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all for anon" ON public.pedidos;
CREATE POLICY "Enable all for anon" ON public.pedidos FOR ALL USING (true);
DROP POLICY IF EXISTS "Enable all for anon" ON public.pedido_items;
CREATE POLICY "Enable all for anon" ON public.pedido_items FOR ALL USING (true);

-- ============================================
-- SUPABASE STORAGE - BUCKET "productos"
-- ============================================
-- Crear bucket público para imágenes de productos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'productos',
  'productos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquiera puede VER imágenes (público)
DROP POLICY IF EXISTS "Imagenes productos publicas" ON storage.objects;
CREATE POLICY "Imagenes productos publicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'productos');

-- Política: cualquiera puede SUBIR imágenes
DROP POLICY IF EXISTS "Permitir subir imagenes productos" ON storage.objects;
CREATE POLICY "Permitir subir imagenes productos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'productos');

-- Política: cualquiera puede ACTUALIZAR imágenes
DROP POLICY IF EXISTS "Permitir actualizar imagenes productos" ON storage.objects;
CREATE POLICY "Permitir actualizar imagenes productos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'productos');

-- Política: cualquiera puede ELIMINAR imágenes
DROP POLICY IF EXISTS "Permitir eliminar imagenes productos" ON storage.objects;
CREATE POLICY "Permitir eliminar imagenes productos" ON storage.objects
  FOR DELETE USING (bucket_id = 'productos');
