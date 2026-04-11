-- ============================================
-- MIGRACIÓN 009: Soporte Dual de Listas (Base + Escalonadas)
-- ============================================

-- Agregar columnas para vincular específicamente las listas de tipo "escalonada"
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS lista_escalonada_id uuid REFERENCES public.listas_precios(id) ON DELETE SET NULL;
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS lista_escalonada_minorista_id uuid REFERENCES public.listas_precios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_productos_lista_escalonada_id ON public.productos(lista_escalonada_id);
CREATE INDEX IF NOT EXISTS idx_productos_lista_escalonada_minorista_id ON public.productos(lista_escalonada_minorista_id);
