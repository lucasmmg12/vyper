-- ============================================================
-- 015: Columnas extendidas v3.0 para productos y pedidos
-- ============================================================

ALTER TABLE productos ADD COLUMN IF NOT EXISTS es_combo BOOLEAN DEFAULT FALSE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS combo_items JSONB DEFAULT '[]'::jsonb;

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cupon_codigo TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS descuento_monto NUMERIC(12,2) DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS coins_usados INT DEFAULT 0;
