'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  X, ChevronLeft, ChevronRight, BookOpen, Rocket, DollarSign, Users,
  CreditCard, Coins, BarChart3, ShoppingBag, Shield, Store, HelpCircle,
  ArrowLeft
} from 'lucide-react';

interface TutorialStep {
  title: string;
  content: string;
}

interface Tutorial {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  steps: TutorialStep[];
}

export default function TutorialPage() {
  const [currentTutorial, setCurrentTutorial] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const tutorials: Record<string, Tutorial> = {
    'primeros-pasos': {
      title: 'Primeros Pasos',
      description: 'Navegá por el sistema y conocé las funcionalidades básicas',
      icon: <Rocket size={22} />,
      color: '#3b82f6',
      steps: [
        {
          title: 'Bienvenido a Vyper Labs',
          content: 'Vyper Labs es tu sistema integral de gestión empresarial. Incluye un panel administrativo completo, tienda mayorista online, sistema de fidelización y Business Intelligence.'
        },
        {
          title: 'Pantalla de Inicio',
          content: 'Al abrir la aplicación verás el acceso al <strong>Panel Administrativo</strong> y la <strong>Tienda Mayorista</strong>. El panel requiere login con email y contraseña.'
        },
        {
          title: 'Panel Administrativo',
          content: 'El sidebar izquierdo te da acceso a todos los módulos: Dashboard, BI Analytics, Clientes, Deudas, Vyper Coins, Competencia, Retención, Tienda Admin, y Ayuda.'
        },
        {
          title: 'Roles de Usuario',
          content: 'Hay 3 roles: <strong>Super Admin</strong> (acceso total + gestión de usuarios), <strong>Administrador</strong> (lectura y escritura) y <strong>Vendedor</strong> (solo lectura). Solo el Super Admin puede crear cuentas.'
        },
        {
          title: '¡Listo para empezar!',
          content: 'Ya conocés la estructura del sistema. Explorá los tutoriales específicos para aprender cada módulo en detalle.'
        }
      ]
    },
    'registrar-ventas': {
      title: 'Registrar Ventas',
      description: 'Guía paso a paso para registrar ventas correctamente',
      icon: <DollarSign size={22} />,
      color: '#10b981',
      steps: [
        {
          title: 'Acceder al formulario',
          content: 'Desde el Dashboard principal, asegurate de estar en la pestaña <strong>VENTAS</strong> (resaltada en verde).'
        },
        {
          title: 'Seleccionar cliente',
          content: 'Escribí el nombre o teléfono en el campo "CLIENTE". El sistema muestra sugerencias automáticas. Seleccioná el cliente correcto.'
        },
        {
          title: 'Ingresar importe',
          content: 'Escribí el monto total en "IMPORTE ($)". Podés usar decimales (ej: 1500.50). El sistema formatea el número automáticamente.'
        },
        {
          title: 'Método de pago',
          content: 'Elegí: 💵 Efectivo, 🏦 Transferencia, 💳 Tarjeta, o 📝 Cuenta Corriente. Si elegís Cuenta Corriente, la deuda se actualiza automáticamente.'
        },
        {
          title: 'Conceptos (opcional)',
          content: 'Detallá los productos vendidos, ej: "2x Proteína Whey, 1x Creatina". Es opcional pero recomendado para mejor control.'
        },
        {
          title: 'Guardar y verificar',
          content: 'Hacé clic en "REGISTRAR VENTA". La venta aparecerá en el historial a la derecha. Podés editarla o eliminarla si cometiste un error.'
        }
      ]
    },
    'gestion-clientes': {
      title: 'Gestión de Clientes',
      description: 'Administrá tu base de datos de clientes',
      icon: <Users size={22} />,
      color: '#8b5cf6',
      steps: [
        {
          title: 'Acceder al módulo',
          content: 'Hacé clic en "Clientes" en el sidebar izquierdo del panel administrativo.'
        },
        {
          title: 'Vista general',
          content: 'Verás una tabla con todos tus clientes: nombre, teléfono, deuda actual y saldo de Vyper Coins.'
        },
        {
          title: 'Buscar clientes',
          content: 'Usá la barra de búsqueda. Podés buscar por nombre o teléfono. Los resultados se filtran automáticamente.'
        },
        {
          title: 'Crear nuevo cliente',
          content: 'Hacé clic en "NUEVO CLIENTE". Completá: Nombre, Teléfono (con código de área, ej: 5492641234567) y Email (opcional).'
        },
        {
          title: 'Editar un cliente',
          content: 'En la tabla, hacé clic en "EDITAR" del cliente. Modificá los datos y guardá los cambios.'
        },
        {
          title: 'Importante',
          content: 'El teléfono es crucial para las notificaciones de WhatsApp. Ingresalo con código de país (54 para Argentina). No se pueden eliminar clientes con transacciones registradas.'
        }
      ]
    },
    'cuenta-corriente': {
      title: 'Cuenta Corriente',
      description: 'Gestioná créditos y pagos de clientes',
      icon: <CreditCard size={22} />,
      color: '#f59e0b',
      steps: [
        {
          title: 'Acceder al módulo',
          content: 'Hacé clic en "Deudas" en el sidebar para ver el módulo de Cuenta Corriente.'
        },
        {
          title: 'Registrar compra a crédito',
          content: 'Seleccioná el cliente, ingresá el monto y hacé clic en "COMPRA EN CUENTA CORRIENTE". El sistema actualizará la deuda automáticamente.'
        },
        {
          title: 'Notificación automática',
          content: 'El cliente recibe un WhatsApp con: monto de compra, saldo total y recordatorio de pago. Es automático si tiene teléfono válido.'
        },
        {
          title: 'Registrar un pago',
          content: 'Seleccioná el cliente, ingresá el monto del pago y hacé clic en "PAGO". Se resta de su deuda.'
        },
        {
          title: 'Pagos parciales',
          content: 'Podés registrar pagos parciales. Si debe $5000 y paga $2000, su nueva deuda será $3000.'
        },
        {
          title: 'Historial',
          content: 'En la tabla inferior verás todos los movimientos del mes: fecha, cliente, tipo (COMPRA/PAGO), importe y balance resultante.'
        }
      ]
    },
    'vyper-coins': {
      title: 'Vyper Coins',
      description: 'Sistema de fidelización y recompensas',
      icon: <Coins size={22} />,
      color: '#eab308',
      steps: [
        {
          title: '¿Qué son los Vyper Coins?',
          content: 'Es un programa de fidelización que premia a tus clientes frecuentes con puntos canjeables por descuentos o productos.'
        },
        {
          title: 'Agregar coins',
          content: 'Seleccioná el cliente, ingresá la cantidad y hacé clic en "AGREGAR COINS". Se suman puntos al saldo del cliente.'
        },
        {
          title: 'Descontar coins (canje)',
          content: 'Para canjes, ingresá la cantidad y hacé clic en "DESCONTAR COINS". El sistema verifica que tenga suficientes puntos.'
        },
        {
          title: 'Notificaciones',
          content: 'Cada movimiento genera un WhatsApp al cliente y queda registrado en el historial para seguimiento.'
        }
      ]
    },
    'analytics': {
      title: 'Business Intelligence',
      description: 'Análisis avanzado de datos y reportes',
      icon: <BarChart3 size={22} />,
      color: '#06b6d4',
      steps: [
        {
          title: 'Acceder a BI',
          content: 'Hacé clic en "BI" en el sidebar. Verás el dashboard de Business Intelligence con métricas y gráficos.'
        },
        {
          title: 'KPIs principales',
          content: 'Las tarjetas superiores muestran: Ingresos Totales, Egresos Totales, Utilidad Neta y Margen de Ganancia.'
        },
        {
          title: 'Gráficos de tendencias',
          content: 'Gráficos de líneas muestran la evolución de ingresos/egresos. Identificá picos de ventas y patrones estacionales.'
        },
        {
          title: 'Comparativa de sucursales',
          content: 'Compará el rendimiento entre diferentes sucursales con gráficos de tendencia mensual.'
        },
        {
          title: 'Top clientes',
          content: 'La tabla de mejores clientes muestra quiénes son los más valiosos. Usala para decidir a quién ofrecer promociones.'
        },
        {
          title: 'Exportar reportes',
          content: 'Descargá datos en PDF (con gráficos), Excel (para análisis) o CSV (compatible con otras herramientas).'
        }
      ]
    },
    'tienda-mayorista': {
      title: 'Tienda Mayorista',
      description: 'Catálogo online, pedidos y secciones comerciales',
      icon: <Store size={22} />,
      color: '#ec4899',
      steps: [
        {
          title: 'La tienda pública',
          content: 'La tienda está en <strong>/tienda</strong> y es pública (no requiere login). Los clientes pueden navegar, armar pedidos y contactarte por WhatsApp.'
        },
        {
          title: 'Secciones de la tienda',
          content: 'La home tiene 3 secciones automáticas: <strong>🔥 Ofertas</strong> (productos con descuento), <strong>⭐ Destacados</strong> (seleccionados manualmente) y <strong>🕐 Últimos Ingresos</strong> (los más nuevos).'
        },
        {
          title: 'Catálogo completo',
          content: 'La pestaña "Catálogo completo" muestra todos los productos con filtros por rubro, categoría y marca. Incluye buscador.'
        },
        {
          title: 'Carrito y checkout',
          content: 'Los clientes agregan productos al carrito, ajustan cantidades y completan el pedido con sus datos. El pedido se envía por WhatsApp.'
        },
        {
          title: 'Administrar productos',
          content: 'Desde el panel admin en "Tienda > Productos" podés crear, editar y gestionar productos. Marcá los que son oferta o destacado.'
        },
        {
          title: 'Gestionar pedidos',
          content: 'En "Tienda > Pedidos" verás los pedidos recibidos. Podés cambiar el estado: pendiente → confirmado → entregado.'
        }
      ]
    },
    'gestion-productos': {
      title: 'Gestión de Productos',
      description: 'Cómo crear, editar y organizar el catálogo',
      icon: <ShoppingBag size={22} />,
      color: '#f97316',
      steps: [
        {
          title: 'Acceder al módulo',
          content: 'Desde el sidebar, andá a "Tienda" y luego a "Productos". Verás la tabla con todos los productos cargados.'
        },
        {
          title: 'Crear un producto',
          content: 'Hacé clic en "Nuevo Producto". Completá: nombre, descripción, SKU, precios (mayorista y unitario), stock y cantidad mínima.'
        },
        {
          title: 'Asignar categoría y marca',
          content: 'Seleccioná la categoría y marca del producto. Si no existen, podés crearlas desde "Tienda > Categorías" o "Tienda > Marcas".'
        },
        {
          title: 'Subir imágenes',
          content: 'Agregá fotos del producto. La primera imagen será la principal visible en el catálogo. Podés subir múltiples imágenes.'
        },
        {
          title: 'Marcar como oferta o destacado',
          content: '<strong>Destacado:</strong> aparece en la sección "Destacados" de la tienda. <strong>En oferta:</strong> aparece en "Ofertas" con el precio promocional y badge de descuento.'
        },
        {
          title: 'Stock y cantidades',
          content: 'Definí el stock disponible y la cantidad mínima por pedido. Los clientes no podrán pedir menos de la cantidad mínima.'
        }
      ]
    },
    'usuarios-roles': {
      title: 'Usuarios y Roles',
      description: 'Sistema de autenticación y permisos',
      icon: <Shield size={22} />,
      color: '#7c3aed',
      steps: [
        {
          title: 'Acceso al panel',
          content: 'El panel administrativo requiere login con email y contraseña. Accedé desde <strong>/admin/login</strong>.'
        },
        {
          title: 'Roles disponibles',
          content: '<strong>Super Admin:</strong> acceso total + crear usuarios. <strong>Administrador:</strong> lectura y escritura, sin gestionar usuarios. <strong>Vendedor:</strong> solo lectura.'
        },
        {
          title: 'Crear usuarios (solo Super Admin)',
          content: 'Desde "Usuarios" en el sidebar, hacé clic en "Nuevo Usuario". Asigná email, contraseña, nombre y rol.'
        },
        {
          title: 'Gestionar usuarios',
          content: 'Podés editar datos, cambiar roles, activar/desactivar o eliminar usuarios. Solo el Super Admin tiene acceso a esta sección.'
        },
        {
          title: 'Seguridad',
          content: 'Las contraseñas se guardan encriptadas con bcrypt. Las sesiones usan JWT con duración de 24 horas. El middleware protege todas las rutas admin.'
        }
      ]
    },
  };

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
    <div className="page-container" style={{ maxWidth: '960px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#f0f9ff', color: '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={22} />
          </div>
          <h1 style={{ margin: 0 }}>Centro de Ayuda</h1>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
          Tutoriales paso a paso para dominar cada módulo del sistema
        </p>
      </div>

      {/* Tutorial Grid */}
      {!currentTutorial && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            {Object.entries(tutorials).map(([id, tut]) => (
              <div
                key={id}
                onClick={() => openTutorial(id)}
                className="glass-card"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  padding: '1.25rem',
                }}
                onMouseEnter={e => {
                  (e.currentTarget).style.transform = 'translateY(-3px)';
                  (e.currentTarget).style.borderColor = tut.color;
                  (e.currentTarget).style.boxShadow = `0 8px 24px ${tut.color}15`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget).style.transform = 'translateY(0)';
                  (e.currentTarget).style.borderColor = '';
                  (e.currentTarget).style.boxShadow = '';
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `${tut.color}10`, color: tut.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '0.875rem',
                }}>
                  {tut.icon}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.375rem', color: '#111' }}>
                  {tut.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  {tut.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '0.6875rem', fontWeight: 600,
                    color: tut.color, background: `${tut.color}10`,
                    padding: '0.2rem 0.5rem', borderRadius: 100,
                  }}>
                    {tut.steps.length} pasos
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    ~{Math.ceil(tut.steps.length * 0.8)} min
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={16} /> Enlaces rápidos
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.75rem',
            }}>
              {[
                { href: '/admin', label: 'Panel Admin', emoji: '📊' },
                { href: '/tienda', label: 'Tienda', emoji: '🛒' },
                { href: '/tienda/como-comprar', label: 'Cómo comprar', emoji: '❓' },
                { href: '/', label: 'Inicio', emoji: '🏠' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    textDecoration: 'none',
                    color: '#111',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget).style.borderColor = '#111';
                    (e.currentTarget).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget).style.borderColor = '#e5e7eb';
                    (e.currentTarget).style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{link.emoji}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tutorial Detail View */}
      {currentTutorial && tutorial && (
        <div>
          {/* Back + Title */}
          <button
            onClick={closeTutorial}
            className="btn-ghost"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              marginBottom: '1.25rem', fontSize: '0.875rem', color: '#6b7280',
            }}
          >
            <ArrowLeft size={16} /> Volver a tutoriales
          </button>

          <div className="glass-card" style={{ position: 'relative' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `${tutorial.color}10`, color: tutorial.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {tutorial.icon}
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{tutorial.title}</h2>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>{tutorial.description}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%', height: 4,
              background: '#f3f4f6', borderRadius: 100,
              overflow: 'hidden', marginBottom: '0.5rem',
            }}>
              <div style={{
                height: '100%',
                background: tutorial.color,
                width: `${progress}%`,
                transition: 'width 0.3s',
                borderRadius: 100,
              }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
              Paso {currentStep + 1} de {tutorial.steps.length}
            </div>

            {/* Current Step */}
            <div style={{
              padding: '1.5rem',
              background: '#f9fafb',
              borderRadius: 12,
              borderLeft: `3px solid ${tutorial.color}`,
              marginBottom: '1.5rem',
            }}>
              <h3 style={{
                fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.625rem',
                color: '#111', display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: tutorial.color, color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {currentStep + 1}
                </span>
                {tutorial.steps[currentStep].title}
              </h3>
              <p
                style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.7, margin: 0 }}
                dangerouslySetInnerHTML={{ __html: tutorial.steps[currentStep].content }}
              />
            </div>

            {/* Steps dots */}
            <div style={{
              display: 'flex', gap: '0.375rem', justifyContent: 'center', marginBottom: '1.5rem',
            }}>
              {tutorial.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  style={{
                    width: i === currentStep ? 24 : 8,
                    height: 8,
                    borderRadius: 100,
                    background: i <= currentStep ? tutorial.color : '#e5e7eb',
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
                  padding: '0.625rem 1rem', borderRadius: 8,
                  background: '#fff', border: '1px solid #d1d5db',
                  color: currentStep === 0 ? '#d1d5db' : '#111',
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem', fontWeight: 500,
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
                  padding: '0.625rem 1rem', borderRadius: 8,
                  background: tutorial.color, border: 'none',
                  color: '#fff', cursor: 'pointer',
                  fontSize: '0.875rem', fontWeight: 600,
                  minHeight: 'auto', boxShadow: 'none', letterSpacing: 'normal',
                  textTransform: 'none' as const,
                }}
              >
                {currentStep === tutorial.steps.length - 1 ? 'Completar ✓' : 'Siguiente'}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
