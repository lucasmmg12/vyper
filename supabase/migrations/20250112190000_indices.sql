
ALTER TABLE public.debt_transactions ADD CONSTRAINT debt_transactions_transaction_type_check CHECK (transaction_type IN ('charge', 'payment'));
CREATE INDEX IF NOT EXISTS idx_debt_transactions_client_id ON public.debt_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_debt_transactions_date ON public.debt_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_debt_transactions_type ON public.debt_transactions(transaction_type);
