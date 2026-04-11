-- Crear tabla de configuraciones globales
CREATE TABLE public.configuraciones (
    clave text PRIMARY KEY,
    valor jsonb NOT NULL,
    descripcion text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Insertar configuración inicial para la marquesina minorista
INSERT INTO public.configuraciones (clave, valor, descripcion)
VALUES (
    'marquesina_minorista',
    '{"activo": true, "mensajes": ["10% Off en pagos en efectivo o transferencia.", "Hasta 3 cuotas sin interés con todas las tarjetas."]}'::jsonb,
    'Configuración de la cinta animada superior de la tienda minorista'
);

-- Insertar configuración inicial para la marquesina mayorista (por si se necesita)
INSERT INTO public.configuraciones (clave, valor, descripcion)
VALUES (
    'marquesina_mayorista',
    '{"activo": false, "mensajes": ["Envíos a todo el país", "Compra mínima $50.000"]}'::jsonb,
    'Configuración de la cinta animada superior de la tienda mayorista'
);

-- RLS
ALTER TABLE public.configuraciones ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Lectura pública de configuraciones" ON public.configuraciones
    FOR SELECT USING (true);

CREATE POLICY "Solo admins pueden modificar configuraciones" ON public.configuraciones
    FOR ALL USING (auth.role() = 'authenticated');
