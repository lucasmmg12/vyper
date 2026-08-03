-- ============================================
-- MIGRACIÓN 013: Columnas faltantes en productos
-- Campos usados en el frontend pero nunca creados en la DB.
-- Esta omisión causaba que Supabase rechace toda la operación
-- de UPDATE cuando se incluían estos campos, haciendo que
-- el precio_costo (y todos los demás cambios) no se guarden.
-- ============================================

-- 1. Variantes (array JSON de opciones: sabores, talles, colores)
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS variantes jsonb DEFAULT '[]'::jsonb;

-- 2. Flag de oferta
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS en_oferta boolean DEFAULT false;

-- 3. Precio de oferta (precio manual cuando está en oferta)
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS precio_oferta numeric DEFAULT 0.0;
