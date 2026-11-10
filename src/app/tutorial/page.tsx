'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, BookOpen, Rocket, DollarSign, Users,
  CreditCard, Coins, BarChart3, ShoppingBag, Shield, Store, HelpCircle,
  ArrowLeft, Sparkles, RefreshCcw, PackagePlus, Paintbrush, CheckCircle2
} from 'lucide-react';

interface TutorialStep {
  title: string;
  content: string;
}

interface Tutorial {
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  steps: TutorialStep[];
}

export default function TutorialPage() {
  const [currentTutorial, setCurrentTutorial] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const tutorials: Record<string, Tutorial> = {
    'primeros-pasos': {
      title: 'Primeros Pasos',
      description: 'Arquitectura general, accesos y navegación por el ecosistema Vyper Labs',
      category: 'General',
      icon: <Rocket size={20} />,
      steps: [
        {
          title: 'Bienvenido a Vyper Labs',
          content: 'Vyper Labs es una plataforma integral que unifica tu <strong>ERP/POS Administrativo</strong>, <strong>Ecommerce Mayorista (/tienda)</strong>, <strong>Ecommerce Minorista (/minorista)</strong>, <strong>Portal de Autogestión (/client)</strong> y herramientas de <strong>Inteligencia Artificial</strong>.'
        },
        {
          title: 'Accesos Principales',
          content: 'Desde la portada principal podés ingresar al <strong>Panel Administrativo (/admin)</strong>, a la <strong>Tienda Mayorista (/tienda)</strong>, a la <strong>Tienda Minorista (/minorista)</strong> o al <strong>Portal de Clientes (/client)</strong> para consultar puntos, cuenta corriente y pedidos.'
        },
        {
          title: 'Navegación del Panel Admin',
          content: 'El menú lateral izquierdo agrupa todos los módulos operativos: <strong>Inicio (POS Ventas/Egresos)</strong>, <strong>Vyper Coins</strong>, <strong>Cta Corriente</strong>, <strong>Clientes</strong>, <strong>Analytics (con Copiloto IA)</strong>, <strong>Retención (con IA)</strong>, <strong>Competencia</strong>, <strong>Ecommerce</strong> y <strong>Configuración</strong>.'
        },
        {
          title: 'Política de Stock Flexible',
          content: 'El sistema está diseñado con una <strong>gestión de stock relajada</strong>: nunca bloquea una venta en mostrador ni un pedido online si un producto figura con stock 0, permitiéndote operar sin fricciones.'
        },
        {
          title: 'Roles y Permisos',
          content: 'Existen 3 niveles de acceso en <strong>/admin/usuarios</strong>: <strong>Super Admin</strong> (acceso total y gestión de usuarios), <strong>Administrador</strong> (gestión operativa completa) y <strong>Vendedor</strong> (operación diaria).'
        }
      ]
    },
    'registrar-ventas': {
      title: 'POS: Ventas, Egresos y Escáner SKU',
      description: 'Cómo registrar ventas en mostrador usando el lector rápido de SKU o catálogo',
      category: 'ERP & Finanzas',
      icon: <DollarSign size={20} />,
      steps: [
        {
          title: 'Acceder al Punto de Venta (POS)',
          content: 'En <strong>/admin</strong> encontrás el panel operativo con las pestañas <strong>Ventas</strong>, <strong>Egresos</strong> e <strong>Importar Excel</strong>.'
        },
        {
          title: 'Escáner Rápido por SKU o Selector de Catálogo',
          content: 'Usá el bloque <strong>"Escáner SKU / Sumar Productos del Catálogo"</strong> para escanear un código de barras o escribir el SKU/nombre del producto y presionar <strong>Enter</strong>. El sistema suma automáticamente los ítems al importe total de la venta y arma el detalle de productos.'
        },
        {
          title: 'Seleccionar Cliente',
          content: 'Buscá al cliente por nombre o teléfono. Al seleccionarlo, la venta quedará vinculada a su historial, sumará <strong>Vyper Coins</strong> automáticamente y enviará la notificación por WhatsApp.'
        },
        {
          title: 'Método de Pago y Cuenta Corriente',
          content: 'Elegí entre <strong>Efectivo</strong>, <strong>Transferencia</strong>, <strong>Tarjeta</strong> o <strong>Cuenta Corriente</strong>. Si seleccionás Cuenta Corriente, el saldo deudor del cliente se actualiza en el acto.'
        },
        {
          title: 'Registro de Egresos y Resumen Diario',
          content: 'En la pestaña <strong>Egresos</strong> podés asentar pagos a proveedores, alquiler o servicios. Desde el botón superior <strong>Resumen Diario</strong> podés enviar el cierre de caja por WhatsApp.'
        }
      ]
    },
    'tienda-mayorista': {
      title: 'Ecommerce Mayorista y Minorista',
      description: 'Modo Planilla Rápida B2B, variantes, catálogo PDF, incentivos y checkout',
      category: 'Ecommerce',
      icon: <Store size={20} />,
      steps: [
        {
          title: 'Doble Tienda: Mayorista (/tienda) y Minorista (/minorista)',
          content: 'Ambas tiendas son públicas, comparten el catálogo sincronizado en tiempo real y muestran los precios correspondientes a cada canal (precio mayorista con escalas por volumen o precio minorista).'
        },
        {
          title: 'Modo Planilla Rápida B2B (/tienda)',
          content: 'En la tienda mayorista los clientes pueden alternar entre <strong>"🔲 Vista Cuadrícula"</strong> y <strong>"📋 Modo Planilla Rápida"</strong>. La vista planilla permite filtrar, elegir sabor/variante y cargar decenas de unidades en segundos.'
        },
        {
          title: 'Selección de Sabores / Variantes y Combos',
          content: 'Cada tarjeta de producto con variantes muestra un selector directo de sabor o talle. El carrito separa automáticamente cada sabor en su propia línea (ej. <em>Whey Vainilla</em> vs <em>Whey Chocolate</em>).'
        },
        {
          title: 'Descarga de Lista de Precios en PDF',
          content: 'Con el botón <strong>"📄 Lista de Precios PDF"</strong> tanto vos como tus clientes pueden generar e imprimir al instante un catálogo PDF en blanco y negro con los precios vigentes del día.'
        },
        {
          title: 'Barra de Progreso de Incentivos en Carrito',
          content: 'Dentro del carrito se muestra una barra dinámica que indica cuánto falta para alcanzar <strong>Envío Gratis</strong> y el <strong>Descuento Extra por Volumen</strong> configurados en el panel.'
        },
        {
          title: 'Checkout con Autocompletado, Cupones y Tracking',
          content: 'En el checkout el cliente puede ingresar su teléfono para <strong>autocompletar sus datos</strong>, ver su saldo de Vyper Coins, <strong>repetir su último pedido</strong> con 1 clic, aplicar cupones y acceder al link en vivo <strong>/pedido/[id]</strong>.'
        }
      ]
    },
    'personal-shopper-ia': {
      title: 'Personal Shopper IA y Portal Cliente',
      description: 'Asistente nutricional IA en tienda y autogestión de pedidos y puntos',
      category: 'Inteligencia Artificial',
      icon: <Sparkles size={20} />,
      steps: [
        {
          title: 'Asistente IA Flotante en Tienda',
          content: 'En <strong>/tienda</strong> y <strong>/minorista</strong> aparece el botón flotante <strong>"Asesor IA"</strong>. Los clientes pueden consultar objetivos (masa muscular, definición, combos para revender en gimnasios) en lenguaje natural.'
        },
        {
          title: 'Compra en 1 Clic desde el Chat',
          content: 'El Personal Shopper IA busca en el catálogo real de Vyper y devuelve tarjetas interactivas dentro del chat con el precio actualizado y un botón <strong>"+ Agregar al pedido"</strong>.'
        },
        {
          title: 'Portal de Autogestión (/client)',
          content: 'Desde el menú superior de la tienda (<strong>Mi Cuenta</strong> o <strong>/client</strong>), cualquier cliente puede ingresar su teléfono o DNI para consultar sus <strong>Vyper Coins</strong>, su nivel VIP y su saldo de <strong>Cuenta Corriente</strong>.'
        },
        {
          title: 'Seguimiento en Vivo y Repetición de Pedido',
          content: 'En <strong>/client</strong> o en <strong>/pedido/[id]</strong> el cliente visualiza la línea de tiempo de su pedido (<em>Recibido → En Preparación → Listo / Entregado</em>), descarga su comprobante y puede tocar <strong>"🔄 Repetir Pedido"</strong>.'
        }
      ]
    },
    'personalizacion-tienda': {
      title: 'Editor de Tienda, Vista Previa e Historial',
      description: 'Personalizá textos, banners, marquesina, colores e incentivos con IA',
      category: 'Ecommerce',
      icon: <Paintbrush size={20} />,
      steps: [
        {
          title: 'Las 12 Secciones del Editor (/admin/ecommerce/personalizacion)',
          content: 'En <strong>Ecommerce → Personalización</strong> controlás: Identidad y Colores, Hero Mayorista y Minorista, Banners Promocionales, Marquesinas superiores, Incentivos de Carrito, Footer, WhatsApp y FAQs.'
        },
        {
          title: 'Subida de Imágenes Drag & Drop',
          content: 'En todos los campos de imagen (Logo, Fondos de Hero y Banners) podés arrastrar y soltar archivos desde tu computadora o pegar una URL externa.'
        },
        {
          title: 'Vista Previa en Vivo (Desktop y Móvil)',
          content: 'Activá el botón superior <strong>"👁️ Vista Previa"</strong> para abrir el panel lateral en vivo. Podés alternar entre vista <strong>Desktop 💻</strong> y <strong>Móvil 📱</strong> y ver cómo quedan tus cambios antes de guardar.'
        },
        {
          title: 'Historial de Versiones y Rollback',
          content: 'Cada vez que guardás una sección, el sistema archiva una copia automática. Con el botón <strong>"🕒 Historial"</strong> podés revisar las últimas 10 modificaciones y restaurar cualquiera con 1 clic.'
        },
        {
          title: 'Asesor IA con Aplicación Directa',
          content: 'Abrí el <strong>Asesor IA</strong> dentro del editor y pedile que redacte títulos, banners o FAQs. Cuando te proponga cambios, hacé clic en <strong>"✨ Aplicar cambios sugeridos en el editor"</strong> para volcarlos directamente al formulario.'
        }
      ]
    },
    'gestion-productos': {
      title: 'Productos, Precios Masivos, Combos e IA',
      description: 'Administración de catálogo, aumentos porcentuales por marca y descripciones IA',
      category: 'Ecommerce',
      icon: <ShoppingBag size={20} />,
      steps: [
        {
          title: 'Catálogo de Productos (/admin/ecommerce/productos)',
          content: 'Administrá precios de costo, mayorista, minorista, ofertas, variantes (sabores/talles) y listas de precios escalonadas.'
        },
        {
          title: 'Actualizador Masivo de Precios (📈)',
          content: 'Hacé clic en <strong>"📈 Actualizar Precios Masivo"</strong> para aplicar aumentos o descuentos porcentuales filtrando por <strong>Marca</strong>, <strong>Categoría</strong> o <strong>Todo el catálogo</strong>, con redondeo automático ($100, $50 o $10) y tabla de vista previa.'
        },
        {
          title: 'Completar Descripciones con IA en Lote (✨)',
          content: 'El botón <strong>"✨ Completar Descripciones con IA"</strong> detecta todos los productos sin descripción y redacta textos comerciales persuasivos en lote usando OpenAI.'
        },
        {
          title: 'Crear Combos / Packs (📦)',
          content: 'Usá el botón <strong>"📦 Nuevo Combo / Pack"</strong> para armar promociones conjuntas (ej. <em>Pack Inicial Gimnasio</em> o <em>Combo Masa Muscular</em>) listas para publicar en la tienda.'
        },
        {
          title: 'Compras e Ingreso con Escáner (/admin/ecommerce/compras)',
          content: 'Al recibir mercadería, usá el campo <strong>"🔫 Escáner / Búsqueda Rápida por SKU"</strong> en Compras para sumar productos rápidamente y actualizar sus costos.'
        }
      ]
    },
    'pedidos-unificados': {
      title: 'Pedidos Web, Sync ERP y WhatsApp',
      description: 'Sincronización de pedidos con ventas, Vyper Coins, Cta. Corriente y avisos Bot',
      category: 'Ecommerce',
      icon: <PackagePlus size={20} />,
      steps: [
        {
          title: 'Gestión de Pedidos (/admin/ecommerce/pedidos)',
          content: 'Buscá pedidos por nombre, teléfono o número `#000X` y filtrá por estado: <strong>Pendiente</strong>, <strong>Procesando</strong>, <strong>Completado</strong> o <strong>Cancelado</strong>.'
        },
        {
          title: 'Notificación Automática de Estado por WhatsApp',
          content: 'Con el check <strong>"📲 Notificar por WhatsApp al cambiar estado"</strong> activo, cuando pasás un pedido a <em>Procesando</em> o <em>Completado</em>, BuilderBot envía un WhatsApp automático al cliente con el link de seguimiento.'
        },
        {
          title: 'Unificación con Ventas y Vyper Coins',
          content: 'Al marcar un pedido como <strong>Completado</strong> con el check <strong>"🪙 Acreditar Venta y Vyper Coins"</strong>, el sistema da de alta al cliente si no existía, registra el ingreso en Ventas y suma sus Vyper Coins automáticamente.'
        },
        {
          title: 'Pasar Pedido a Cuenta Corriente (1 Clic)',
          content: 'Para clientes mayoristas que compran a crédito, abrí el detalle del pedido y tocá <strong>"💳 Pasar a Cta. Corriente"</strong>: el monto se carga directamente en su saldo deudor y envía el aviso correspondiente.'
        }
      ]
    },
    'cuenta-corriente': {
      title: 'Cuenta Corriente y Recordatorios Masivos',
      description: 'Control de saldos deudores, cobros parciales y avisos automáticos por WhatsApp',
      category: 'ERP & Finanzas',
      icon: <CreditCard size={20} />,
      steps: [
        {
          title: 'Panel de Deudores Activos (/admin/debt)',
          content: 'En la parte superior de <strong>Cuenta Corriente</strong> visualizás la tabla de clientes con saldo pendiente, el total en la calle y accesos rápidos de cobro.'
        },
        {
          title: 'Registrar Cargos y Pagos Parciales',
          content: 'Podés cargar nuevas compras a crédito o tocar <strong>"💰 Registrar Pago"</strong> sobre cualquier deudor para autocompletar el formulario y asentar entregas parciales o cancelaciones totales.'
        },
        {
          title: 'Recordatorio Individual y Masivo por WhatsApp',
          content: 'Cada fila cuenta con el botón <strong>"📲 Recordatorio Bot"</strong> y <strong>"Abrir WA"</strong>. Además, podés seleccionar varios clientes y presionar <strong>"📢 Recordatorio Masivo a Deudores"</strong> para enviar avisos cordiales de saldo en 1 clic.'
        }
      ]
    },
    'retencion-ia': {
      title: 'Retención Inteligente con IA',
      description: 'Detección de clientes por ventana de recompra y mensajes personalizados con IA',
      category: 'Inteligencia Artificial',
      icon: <RefreshCcw size={20} />,
      steps: [
        {
          title: 'Ventanas de Recompra (/admin/retention)',
          content: 'Filtrá clientes según los días transcurridos desde su última compra: <strong>15-25 días</strong>, <strong>25-35 días (Ventana Ideal de renovación de suplementos)</strong> o <strong>+35 días inactivos</strong>.'
        },
        {
          title: 'Redacción Personalizada con IA (✨)',
          content: 'Hacé clic en <strong>"✨ Redactar con IA"</strong> en cualquier cliente. OpenAI generará un mensaje cálido en español rioplatense mencionando sus días sin comprar y su saldo de <strong>Vyper Coins</strong>.'
        },
        {
          title: 'Envío por Bot o WhatsApp Directo',
          content: 'Desde el modal podés editar el texto sugerido y elegir entre <strong>"🤖 Enviar automático por Bot"</strong> (vía BuilderBot) o <strong>"📲 Abrir en WhatsApp"</strong>.'
        }
      ]
    },
    'analytics': {
      title: 'Analytics y Copiloto Financiero IA',
      description: 'KPIs financieros, márgenes, reportes PDF/Excel y diagnóstico ejecutivo con IA',
      category: 'Inteligencia Artificial',
      icon: <BarChart3 size={20} />,
      steps: [
        {
          title: 'Métricas Clave (/admin/bi)',
          content: 'Analizá Ingresos, Egresos, Utilidad Neta, Margen de Ganancia, evolución diaria/mensual y ranking de mejores clientes.'
        },
        {
          title: 'Copiloto Financiero IA (🧠)',
          content: 'Presioná el botón <strong>"🧠 ANALIZAR FINANZAS CON COPILOTO IA"</strong>. El sistema evalúa tus ingresos, gastos, deudas por cobrar y clientes top, entregando un diagnóstico con <strong>Resumen Ejecutivo</strong>, <strong>Puntos Fuertes</strong>, <strong>Alertas</strong> y <strong>4 Acciones Recomendadas</strong>.'
        },
        {
          title: 'Exportación de Reportes',
          content: 'Descargá el reporte financiero gerencial en formato <strong>PDF</strong> o exportá la base completa a <strong>Excel / CSV</strong>.'
        }
      ]
    },
    'vyper-coins': {
      title: 'Programa de Fidelización Vyper Coins',
      description: 'Niveles VIP (Bronce, Plata, Oro, Platino), acreditación y canjes',
      category: 'ERP & Finanzas',
      icon: <Coins size={20} />,
      steps: [
        {
          title: 'Acumulación Automática y Manual',
          content: 'Los clientes suman <strong>Vyper Coins</strong> automáticamente en cada venta del POS, al completarse un pedido web o manualmente desde <strong>/admin/vyper-coins</strong>.'
        },
        {
          title: 'Canje en Mostrador y en Checkout Web',
          content: 'Los puntos pueden descontarse en el local desde el módulo Vyper Coins o canjearse directamente durante el checkout de la tienda online para obtener descuentos en pesos.'
        }
      ]
    },
    'gestion-clientes': {
      title: 'Base de Clientes y Usuarios',
      description: 'ABM de clientes, importación Excel y administración de roles',
      category: 'General',
      icon: <Users size={20} />,
      steps: [
        {
          title: 'Directorio de Clientes (/admin/clients)',
          content: 'Consultá y editá nombre, teléfono (en formato `549...` para WhatsApp), deuda actual y balance de Vyper Coins, o importá carteras masivas desde Excel.'
        },
        {
          title: 'Usuarios y Permisos (/admin/usuarios)',
          content: 'Los usuarios con rol <strong>Super Admin</strong> pueden dar de alta nuevas cuentas para administradores y vendedores con contraseñas encriptadas.'
        }
      ]
    },
  };

  const categories = ['Todos', 'General', 'Ecommerce', 'Inteligencia Artificial', 'ERP & Finanzas'];

  const filteredTutorials = Object.entries(tutorials).filter(([, tut]) =>
    selectedCategory === 'Todos' ? true : tut.category === selectedCategory
  );

  const openTutorial = (id: string) => {
    setCurrentTutorial(id);
    setCurrentStep(0);
  };

  const closeTutorial = () => {
    setCurrentTutorial(null);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (!currentTutorial) return;
    const t = tutorials[currentTutorial];
    if (currentStep < t.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const tutorial = currentTutorial ? tutorials[currentTutorial] : null;
  const progress = tutorial ? ((currentStep + 1) / tutorial.steps.length) * 100 : 0;

  return (
    <div className="page-container" style={{ maxWidth: '1040px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Header — Strict Monochrome Black & White */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid #111111',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: '#111111', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>
                DOCUMENTACIÓN OFICIAL · VYPER LABS 3.0
              </span>
              <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: '#111111', letterSpacing: '-0.03em' }}>
                Centro de Ayuda y Manual Interactivo
              </h1>
            </div>
          </div>
          <p style={{ color: '#4b5563', fontSize: '0.9375rem', marginTop: '0.35rem' }}>
            Guías paso a paso actualizadas con todas las herramientas de Ecommerce, ERP, WhatsApp e Inteligencia Artificial.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/admin">
            <button className="secondary" style={{ fontSize: '0.8125rem', borderColor: '#111111', color: '#111111' }}>
              <ArrowLeft size={15} /> Panel Admin
            </button>
          </Link>
          <Link href="/tienda">
            <button style={{ fontSize: '0.8125rem', background: '#111111', color: '#FFFFFF' }}>
              <Store size={15} /> Ir a la Tienda
            </button>
          </Link>
        </div>
      </div>

      {/* Category Filter Pills */}
      {!currentTutorial && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
          {categories.map(cat => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 999,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: active ? '#111111' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#111111',
                  border: '1px solid #111111',
                  transition: 'all 0.15s ease',
                  minHeight: 'auto',
                  boxShadow: 'none',
                  textTransform: 'none',
                  letterSpacing: 'normal',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Tutorial Grid */}
      {!currentTutorial && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.125rem',
            marginBottom: '2.5rem',
          }}>
            {filteredTutorials.map(([id, tut]) => (
              <div
                key={id}
                onClick={() => openTutorial(id)}
                className="glass-card"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: '1.35rem',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={e => {
                  (e.currentTarget).style.transform = 'translateY(-3px)';
                  (e.currentTarget).style.borderColor = '#111111';
                  (e.currentTarget).style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget).style.transform = 'translateY(0)';
                  (e.currentTarget).style.borderColor = '#E5E7EB';
                  (e.currentTarget).style.boxShadow = '';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: '#111111', color: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {tut.icon}
                  </div>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 6,
                    background: '#F3F4F6',
                    color: '#111111',
                    border: '1px solid #E5E7EB',
                  }}>
                    {tut.category}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.375rem', color: '#111111' }}>
                  {tut.title}
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#4B5563', lineHeight: 1.55, marginBottom: '1rem', flex: 1 }}>
                  {tut.description}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #F3F4F6',
                }}>
                  <span style={{
                    fontSize: '0.725rem', fontWeight: 700,
                    color: '#FFFFFF', background: '#111111',
                    padding: '0.2rem 0.6rem', borderRadius: 999,
                  }}>
                    {tut.steps.length} pasos
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#111111', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Iniciar guía <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="glass-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #111111' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111111' }}>
              <HelpCircle size={18} /> Accesos Directos del Sistema
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
              gap: '0.75rem',
            }}>
              {[
                { href: '/admin', label: 'Panel POS & Ventas' },
                { href: '/admin/ecommerce', label: 'Dashboard Ecommerce' },
                { href: '/admin/ecommerce/personalizacion', label: 'Editor de Tienda + IA' },
                { href: '/admin/ecommerce/productos', label: 'Productos y Precios Masivos' },
                { href: '/admin/bi', label: 'Analytics + Copiloto IA' },
                { href: '/admin/retention', label: 'Retención con IA' },
                { href: '/tienda', label: 'Tienda Mayorista' },
                { href: '/minorista', label: 'Tienda Minorista' },
                { href: '/client', label: 'Portal Clientes' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.9rem',
                    background: '#F8F9FA',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: '#111111',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget).style.background = '#111111';
                    (e.currentTarget).style.color = '#FFFFFF';
                    (e.currentTarget).style.borderColor = '#111111';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget).style.background = '#F8F9FA';
                    (e.currentTarget).style.color = '#111111';
                    (e.currentTarget).style.borderColor = '#E5E7EB';
                  }}
                >
                  <span>{link.label}</span>
                  <ChevronRight size={14} />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tutorial Detail View — Monochrome Black & White */}
      {currentTutorial && tutorial && (
        <div>
          <button
            onClick={closeTutorial}
            className="btn-ghost"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              marginBottom: '1.25rem', fontSize: '0.875rem', color: '#111111', fontWeight: 700,
            }}
          >
            <ArrowLeft size={16} /> Volver al índice de manuales
          </button>

          <div className="glass-card" style={{ position: 'relative', border: '2px solid #111111', background: '#FFFFFF', padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 10,
                background: '#111111', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {tutorial.icon}
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280' }}>
                  {tutorial.category}
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: '#111111' }}>{tutorial.title}</h2>
                <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: 0 }}>{tutorial.description}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%', height: 6,
              background: '#E5E7EB', borderRadius: 100,
              overflow: 'hidden', marginBottom: '0.5rem',
            }}>
              <div style={{
                height: '100%',
                background: '#111111',
                width: `${progress}%`,
                transition: 'width 0.3s ease',
                borderRadius: 100,
              }} />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', marginBottom: '1.5rem' }}>
              PASO {currentStep + 1} DE {tutorial.steps.length}
            </div>

            {/* Current Step */}
            <div style={{
              padding: '1.75rem',
              background: '#F8F9FA',
              borderRadius: 12,
              borderLeft: '4px solid #111111',
              borderTop: '1px solid #E5E7EB',
              borderRight: '1px solid #E5E7EB',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '1.75rem',
            }}>
              <h3 style={{
                fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.75rem',
                color: '#111111', display: 'flex', alignItems: 'center', gap: '0.625rem',
              }}>
                <span style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#111111', color: '#FFFFFF',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8125rem', fontWeight: 800, flexShrink: 0,
                }}>
                  {currentStep + 1}
                </span>
                {tutorial.steps[currentStep].title}
              </h3>
              <p
                style={{ fontSize: '0.95rem', color: '#1F2937', lineHeight: 1.75, margin: 0 }}
                dangerouslySetInnerHTML={{ __html: tutorial.steps[currentStep].content }}
              />
            </div>

            {/* Steps dots */}
            <div style={{
              display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '1.5rem',
            }}>
              {tutorial.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  style={{
                    width: i === currentStep ? 28 : 8,
                    height: 8,
                    borderRadius: 100,
                    background: i <= currentStep ? '#111111' : '#D1D5DB',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    padding: 0,
                    minHeight: 'auto',
                    boxShadow: 'none',
                  }}
                />
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.65rem 1.15rem', borderRadius: 8,
                  background: '#FFFFFF', border: '1px solid #111111',
                  color: currentStep === 0 ? '#9CA3AF' : '#111111',
                  borderColor: currentStep === 0 ? '#E5E7EB' : '#111111',
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem', fontWeight: 700,
                  minHeight: 'auto', boxShadow: 'none', letterSpacing: 'normal',
                  textTransform: 'none' as const,
                }}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                onClick={nextStep}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.65rem 1.25rem', borderRadius: 8,
                  background: '#111111', border: '1px solid #111111',
                  color: '#FFFFFF', cursor: 'pointer',
                  fontSize: '0.875rem', fontWeight: 700,
                  minHeight: 'auto', boxShadow: 'none', letterSpacing: 'normal',
                  textTransform: 'none' as const,
                }}
              >
                {currentStep === tutorial.steps.length - 1 ? (
                  <>Finalizar Guía <CheckCircle2 size={16} /></>
                ) : (
                  <>Siguiente <ChevronRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
