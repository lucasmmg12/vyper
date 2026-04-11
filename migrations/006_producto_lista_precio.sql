-- Add lista_precio_id to productos
ALTER TABLE public.productos
ADD COLUMN lista_precio_id UUID REFERENCES public.listas_precios(id) ON DELETE SET NULL;
