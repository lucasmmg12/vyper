-- ═══════════════════════════════════════════════════════
-- MIGRATION 005: Add external_id to productos
-- For CSV catalog import matching (re-upload support)
-- ═══════════════════════════════════════════════════════

ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS external_id text;
CREATE INDEX IF NOT EXISTS idx_productos_external_id ON public.productos(external_id);
