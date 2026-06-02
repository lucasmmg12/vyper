-- ============================================
-- MIGRACIÓN 011: Agregar columnas de notificación a debt_transactions
-- (mismo patrón que migración 010 para coin_transactions)
-- ============================================

ALTER TABLE public.debt_transactions ADD COLUMN IF NOT EXISTS notification_status text;
ALTER TABLE public.debt_transactions ADD COLUMN IF NOT EXISTS notification_error text;
