# Vyper Labs System v3.0

Plataforma integral **ERP + POS + CRM + Ecommerce B2B/B2C + Automatización WhatsApp + Inteligencia Artificial** para **Vyper Suplementos**, diseñada bajo una estética limpia monocromática (Blanco y Negro).

## Módulos Principales

- **Ecommerce Mayorista (`/tienda`) y Minorista (`/minorista`)**:
  - **Modo Planilla Rápida B2B**: Tabla de carga rápida de múltiples productos y sabores para gimnasios, dietéticas y distribuidores.
  - **Selector de Variantes y Combos**: Elección directa de sabores/talles en tarjeta y carrito independiente por variante.
  - **Catálogo PDF Dinámico**: Generación instantánea de lista de precios en PDF actualizada al día.
  - **Carrito con Barra de Incentivos**: Progreso visual hacia Envío Gratis y Descuento por Volumen.
  - **Checkout Inteligente**: Autocompletado por teléfono, repetición del último pedido en 1 clic, canje de cupones y Vyper Coins.
  - **Personal Shopper IA**: Asistente nutricional y comercial conectado al catálogo real con compra en 1 clic desde el chat.
  - **Tracking en Vivo (`/pedido/[id]`) y Portal de Autogestión (`/client`)**.

- **Editor de Personalización y CMS (`/admin/ecommerce/personalizacion`)**:
  - 12 secciones editables (Identidad, Colores, Hero, Banners Promocionales, Marquesinas, Incentivos, Footer, WhatsApp y FAQs).
  - Subida de imágenes *Drag & Drop*, **Vista Previa en Vivo (Desktop/Móvil)**, **Historial de Versiones (Rollback)** y **Asesor IA con Acciones Directas**.

- **ERP, POS, Catálogo e IA Administrativa (`/admin`)**:
  - **POS con Escáner SKU** (`/admin`) y **Compras con Escáner SKU** (`/admin/ecommerce/compras`).
  - **Política de Stock Flexible**: Nunca bloquea ventas ni pedidos por stock en cero.
  - **Productos (`/admin/ecommerce/productos`)**: Actualizador Masivo de Precios por marca/categoría con redondeo automático, generación de descripciones con IA en lote y creación de Combos/Packs.
  - **Pedidos Unificados (`/admin/ecommerce/pedidos`)**: Notificaciones automáticas de estado por WhatsApp (BuilderBot), acreditación automática en Ventas y Vyper Coins, y pase en 1 clic a Cuenta Corriente.
  - **Analytics con Copiloto Financiero IA (`/admin/bi`)**.
  - **Retención con IA (`/admin/retention`)** y **Recordatorios Masivos de Cuenta Corriente (`/admin/debt`)**.

## Documentación y Manuales (Estética Blanco y Negro)
- Dentro de la app: `/tutorial` ([`src/app/tutorial/page.tsx`](./src/app/tutorial/page.tsx))
- Manual de Usuario completo: [`MANUAL_DE_USUARIO.html`](./MANUAL_DE_USUARIO.html)
- Tutorial Interactivo paso a paso: [`TUTORIAL_INTERACTIVO.html`](./TUTORIAL_INTERACTIVO.html)
- Índice documental: [`README_DOCUMENTACION.md`](./README_DOCUMENTACION.md)
