# Documentación Oficial — Vyper Labs System v3.0

Bienvenido a la documentación completa del ecosistema **Vyper Labs System v3.0** (estética monocromática Blanco & Negro).

## Recursos de Documentación Disponibles

### 1. Centro de Ayuda Integrado en la Aplicación (`/tutorial`)
- **Ubicación:** `src/app/tutorial/page.tsx` (accesible desde el menú lateral **Ayuda** o en `/tutorial`).
- **Estética:** Blanco y Negro (`#FFFFFF` / `#111111`), alineada con todo el sistema.
- **Contenido:** 12 guías interactivas filtrables por categoría (*General*, *Ecommerce*, *Inteligencia Artificial*, *ERP & Finanzas*).

### 2. Manual de Usuario Completo (`MANUAL_DE_USUARIO.html`)
Manual exhaustivo en formato web e imprimible con estética Blanco & Negro que documenta los 9 pilares del sistema:
1. **Arquitectura General y Política de Stock Flexible** (nunca bloquea ventas ni pedidos cuando el stock es `0`).
2. **Punto de Venta (POS), Egresos y Escáner Rápido SKU** (`/admin`).
3. **Ecommerce Mayorista (`/tienda`) y Minorista (`/minorista`)**:
   - Modo Planilla Rápida B2B para pedidos mayoristas de alta velocidad.
   - Selección de Variantes (sabores/talles) y Combos/Packs.
   - Descarga instantánea de **Lista de Precios en PDF**.
   - Barra de progreso de incentivos en Carrito (Envío Gratis y Descuento por Volumen).
   - Checkout con autocompletado por teléfono, botón **Repetir último pedido**, canje de cupones y Vyper Coins.
4. **Editor de Personalización de Tienda (`/admin/ecommerce/personalizacion`)**:
   - 12 secciones configurables, subida de imágenes *Drag & Drop*, **Vista Previa en Vivo (Desktop/Móvil)**, **Historial de Versiones (Rollback)** y **Asesor IA** con aplicación de cambios en 1 clic.
5. **Gestión de Productos, Precios Masivos e IA (`/admin/ecommerce/productos`)**:
   - Actualizador Masivo de Precios por Marca/Categoría con redondeo automático (`$100`, `$50`, `$10`) y vista previa.
   - Redacción masiva de descripciones comerciales con IA.
   - Compras (`/admin/ecommerce/compras`) con lector rápido de SKU.
6. **Pedidos Web Unificados con ERP y WhatsApp (`/admin/ecommerce/pedidos`)**:
   - Notificación automática por WhatsApp (BuilderBot) al pasar a `procesando` o `completado`.
   - Sincronización automática con Ventas (`sales`), alta de clientes, acreditación de **Vyper Coins** y botón **Pasar a Cta. Corriente**.
7. **Cuenta Corriente y Recordatorios Masivos (`/admin/debt`) + Vyper Coins (`/admin/vyper-coins`)**.
8. **Inteligencia Artificial en Gestión**:
   - **Copiloto Financiero IA** en Analytics (`/admin/bi`).
   - **Motor de Retención con IA** (`/admin/retention`) con envío directo por Bot o WhatsApp.
   - **Personal Shopper IA** flotante en Tienda Mayorista y Minorista.
9. **Portal de Autogestión del Cliente (`/client`) y Tracking Público en Vivo (`/pedido/[id]`)**.

### 3. Tutorial Interactivo Standalone (`TUTORIAL_INTERACTIVO.html`)
Aplicación HTML interactiva paso a paso en estética Blanco & Negro con soporte de teclado (`←`, `→`, `ESC`) y filtros por módulo para entrenar al equipo operativo y comercial.
