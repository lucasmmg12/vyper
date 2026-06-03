-- ============================================
-- MIGRACIÓN 012: Configuraciones de personalización de la tienda
-- Todas las claves usan los valores ACTUALES hardcodeados como predeterminados
-- ============================================

-- Identidad de marca
INSERT INTO public.configuraciones (clave, valor, descripcion)
VALUES (
    'tienda_identidad',
    '{
      "nombre_marca": "VYPER",
      "subtitulo_mayorista": "Mayorista",
      "subtitulo_minorista": "Tienda Oficial",
      "nombre_completo": "VYPER SUPLEMENTOS",
      "logo_url": "/logovyper.png"
    }'::jsonb,
    'Identidad visual de la marca: logo, nombre y subtítulos'
) ON CONFLICT (clave) DO NOTHING;

-- Hero mayorista
INSERT INTO public.configuraciones (clave, valor, descripcion)
VALUES (
    'tienda_hero_mayorista',
    '{
      "titulo": "Catálogo Mayorista 🛒",
      "descripcion": "Armá tu pedido con precios exclusivos. Suplementos, indumentaria y accesorios deportivos.",
      "subtexto": "📦 Solo se muestran productos con stock disponible",
      "imagen_fondo_url": "/bg-hero.webp",
      "video_url": "https://www.youtube.com/embed/XBfY8ZtRqQk?autoplay=1&mute=1&loop=1&playlist=XBfY8ZtRqQk&controls=0&rel=0&showinfo=0",
      "video_activo": true
    }'::jsonb,
    'Banner hero de la tienda mayorista'
) ON CONFLICT (clave) DO NOTHING;

-- Hero minorista
INSERT INTO public.configuraciones (clave, valor, descripcion)
VALUES (
    'tienda_hero_minorista',
    '{
      "titulo": "Tienda Oficial 🛒",
      "descripcion": "Suplementos, indumentaria y accesorios deportivos.",
      "subtexto": "📦 Solo se muestran productos con stock disponible",
      "imagen_fondo_url": "/bg-hero.webp",
      "video_url": "https://www.youtube.com/embed/XBfY8ZtRqQk?autoplay=1&mute=1&loop=1&playlist=XBfY8ZtRqQk&controls=0&rel=0&showinfo=0",
      "video_activo": true
    }'::jsonb,
    'Banner hero de la tienda minorista'
) ON CONFLICT (clave) DO NOTHING;

-- Footer
INSERT INTO public.configuraciones (clave, valor, descripcion)
VALUES (
    'tienda_footer',
    '{
      "direccion": "📍 Dr. Ortega 192, Villa Krause, San Juan",
      "telefono": "📱 +54 264 629 8880",
      "instagram": "@vyper_suplementos",
      "texto_creditos": "Desarrollado por Grow Labs",
      "url_creditos": "https://www.growlabs.lat"
    }'::jsonb,
    'Datos del footer de la tienda'
) ON CONFLICT (clave) DO NOTHING;

-- WhatsApp
INSERT INTO public.configuraciones (clave, valor, descripcion)
VALUES (
    'tienda_whatsapp',
    '{
      "numero_mayorista": "5492644193032",
      "numero_minorista": "5492646298880",
      "mensaje_mayorista": "Hola Vyper! Quiero hacer un pedido mayorista 🛒",
      "mensaje_minorista": "Hola Vyper!",
      "mensaje_consulta": "Hola Vyper! Tengo una consulta",
      "boton_flotante_activo": true,
      "url_sucursal": "https://www.google.com/maps/dir//Dr.+Ortega+192,+J5425+Villa+Krause,+San+Juan/@-31.578636,-68.6178966,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x96813f9a5a4f7b97:0x7159753af0ace75a!2m2!1d-68.5354807!2d-31.5786279?entry=ttu&g_ep=EgoyMDI0MTIwMi4wIKXMDSoASAFQAw%3D%3D"
    }'::jsonb,
    'Números de WhatsApp y mensajes predeterminados'
) ON CONFLICT (clave) DO NOTHING;

-- FAQs mayorista
INSERT INTO public.configuraciones (clave, valor, descripcion)
VALUES (
    'tienda_faqs_mayorista',
    '{
      "preguntas": [
        {"pregunta": "¿Cuál es el pedido mínimo?", "respuesta": "Cada producto tiene su cantidad mínima mayorista indicada en la ficha. No hay un monto mínimo total para hacer el pedido."},
        {"pregunta": "¿Los precios incluyen IVA?", "respuesta": "Los precios mostrados son finales. Podemos facturar A o B según lo que necesites."},
        {"pregunta": "¿Hacen envíos?", "respuesta": "Sí, hacemos envíos dentro de San Juan. Para el interior consultanos las opciones de transporte."},
        {"pregunta": "¿Puedo retirar en el local?", "respuesta": "Sí, podés retirar tu pedido en Dr. Ortega 192, Villa Krause. Te avisamos cuando está listo."},
        {"pregunta": "¿Qué formas de pago aceptan?", "respuesta": "Efectivo, transferencia bancaria y tarjetas (débito y crédito). Para pagos en cuotas consultanos."},
        {"pregunta": "¿Cuánto tarda el pedido?", "respuesta": "Si el pedido tiene stock disponible, lo preparamos en el día. Te confirmamos el plazo exacto por WhatsApp."}
      ]
    }'::jsonb,
    'Preguntas frecuentes de la tienda mayorista'
) ON CONFLICT (clave) DO NOTHING;

-- FAQs minorista (mismas por ahora)
INSERT INTO public.configuraciones (clave, valor, descripcion)
VALUES (
    'tienda_faqs_minorista',
    '{
      "preguntas": [
        {"pregunta": "¿Cuál es el pedido mínimo?", "respuesta": "Cada producto tiene su cantidad mínima mayorista indicada en la ficha. No hay un monto mínimo total para hacer el pedido."},
        {"pregunta": "¿Los precios incluyen IVA?", "respuesta": "Los precios mostrados son finales. Podemos facturar A o B según lo que necesites."},
        {"pregunta": "¿Hacen envíos?", "respuesta": "Sí, hacemos envíos dentro de San Juan. Para el interior consultanos las opciones de transporte."},
        {"pregunta": "¿Puedo retirar en el local?", "respuesta": "Sí, podés retirar tu pedido en Dr. Ortega 192, Villa Krause. Te avisamos cuando está listo."},
        {"pregunta": "¿Qué formas de pago aceptan?", "respuesta": "Efectivo, transferencia bancaria y tarjetas (débito y crédito). Para pagos en cuotas consultanos."},
        {"pregunta": "¿Cuánto tarda el pedido?", "respuesta": "Si el pedido tiene stock disponible, lo preparamos en el día. Te confirmamos el plazo exacto por WhatsApp."}
      ]
    }'::jsonb,
    'Preguntas frecuentes de la tienda minorista'
) ON CONFLICT (clave) DO NOTHING;

-- Banners mayorista
INSERT INTO public.configuraciones (clave, valor, descripcion)
VALUES (
    'tienda_banners_mayorista',
    '{
      "activo": false,
      "banners": []
    }'::jsonb,
    'Banners promocionales de la tienda mayorista'
) ON CONFLICT (clave) DO NOTHING;

-- Banners minorista
INSERT INTO public.configuraciones (clave, valor, descripcion)
VALUES (
    'tienda_banners_minorista',
    '{
      "activo": false,
      "banners": []
    }'::jsonb,
    'Banners promocionales de la tienda minorista'
) ON CONFLICT (clave) DO NOTHING;
