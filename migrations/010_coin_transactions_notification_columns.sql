-- ============================================
-- MIGRACIÓN 010: Agregar columnas de notificación a coin_transactions
-- ============================================

ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS notification_status text;
ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS notification_error text;
