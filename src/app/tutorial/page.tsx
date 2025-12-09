'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TutorialPage() {
    const [currentTutorial, setCurrentTutorial] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    const tutorials = {
        'primeros-pasos': {
            title: '🚀 Primeros Pasos en Vyper Labs',
            description: 'Aprende a navegar por el sistema y conoce las funcionalidades básicas',
            steps: [
                {
                    title: 'Bienvenido a Vyper Labs',
                    content: 'Vyper Labs es tu sistema integral de gestión empresarial. En este tutorial aprenderás a navegar por la interfaz principal y acceder a todas las funcionalidades.'
                },
                {
                    title: 'Pantalla de Inicio',
                    content: 'Al abrir la aplicación, verás dos opciones principales: <strong>Panel Operativo</strong> para operaciones diarias y <strong>Business Intelligence</strong> para análisis avanzado. Haz clic en "INGRESAR" bajo Panel Operativo.'
                },
                {
                    title: 'Dashboard Principal',
                    content: 'El dashboard es el centro de operaciones. Aquí encontrarás pestañas para <strong>VENTAS</strong> y <strong>EGRESOS</strong>, un formulario de registro a la izquierda y el historial de transacciones a la derecha.'
                },
                {
                    title: 'Barra de Navegación',
                    content: 'En la parte superior verás botones para acceder a: 🪙 Vyper Coins, 💳 Cuenta Corriente, 👥 Clientes, y 📊 Analytics. Puedes navegar entre módulos en cualquier momento.'
                },
                {
                    title: 'Pestañas Ventas/Egresos',
                    content: 'Usa las pestañas para alternar entre registro de ventas y egresos. El formulario cambiará automáticamente según la pestaña seleccionada.'
                },
                {
                    title: '¡Listo para Empezar!',
                    content: 'Ya conoces la estructura básica del sistema. En los siguientes tutoriales aprenderás a usar cada funcionalidad en detalle. ¡Comencemos!'
                }
            ]
        },
        'registrar-ventas': {
            title: '💰 Cómo Registrar Ventas',
            description: 'Guía paso a paso para registrar ventas correctamente',
            steps: [
                {
                    title: 'Acceder al Formulario de Ventas',
                    content: 'En el dashboard principal, asegúrate de estar en la pestaña <strong>VENTAS</strong> (debe estar resaltada en verde).'
                },
                {
                    title: 'Verificar la Fecha',
                    content: 'El campo de fecha se completa automáticamente con la fecha actual. Si necesitas registrar una venta de otro día, puedes modificarla haciendo clic en el campo.'
                },
                {
                    title: 'Seleccionar Cliente',
                    content: 'Haz clic en el campo "CLIENTE" y comienza a escribir el nombre o teléfono. El sistema mostrará sugerencias automáticamente. Selecciona el cliente correcto de la lista desplegable.'
                },
                {
                    title: 'Ingresar el Importe',
                    content: 'En el campo "IMPORTE ($)", escribe el monto total de la venta. Puedes usar decimales (ej: 1500.50). El sistema formateará el número automáticamente.'
                },
                {
                    title: 'Seleccionar Método de Pago',
                    content: 'Elige el método de pago: 💵 Efectivo, 🏦 Transferencia, 💳 Tarjeta Débito/Crédito, o 📝 Cuenta Corriente. Si eliges Cuenta Corriente, la deuda del cliente se actualizará automáticamente.'
                },
                {
                    title: 'Agregar Conceptos (Opcional)',
                    content: 'En el campo "CONCEPTOS", puedes detallar los productos o servicios vendidos. Por ejemplo: "2x Proteína Whey, 1x Creatina". Este campo es opcional pero recomendado para mejor control.'
                },
                {
                    title: 'Guardar la Venta',
                    content: 'Revisa que todos los datos sean correctos y haz clic en el botón verde "💰 REGISTRAR VENTA". Verás un mensaje de confirmación.'
                },
                {
                    title: 'Verificar en el Historial',
                    content: '¡Listo! La venta aparecerá inmediatamente en el panel de historial a la derecha. Puedes editarla o eliminarla si cometiste un error.'
                }
            ]
        },
        'gestion-clientes': {
            title: '👥 Gestión de Clientes',
            description: 'Aprende a administrar tu base de datos de clientes',
            steps: [
                {
                    title: 'Acceder al Módulo de Clientes',
                    content: 'Haz clic en el botón "👥 CLIENTES" en la barra de navegación superior del dashboard.'
                },
                {
                    title: 'Vista General de Clientes',
                    content: 'Verás una cuadrícula con todos tus clientes. Cada tarjeta muestra: nombre, teléfono, deuda actual (en rojo si tiene deuda) y saldo de Vyper Coins.'
                },
                {
                    title: 'Buscar un Cliente',
                    content: 'Usa la barra de búsqueda en la parte superior. Puedes buscar por nombre o por número de teléfono. Los resultados se filtran automáticamente mientras escribes.'
                },
                {
                    title: 'Crear Nuevo Cliente',
                    content: 'Haz clic en el botón "NUEVO CLIENTE". Se abrirá un formulario modal donde debes completar: Nombre completo, Teléfono (con código de área, ej: 5491112345678), y Email (opcional).'
                },
                {
                    title: 'Guardar el Nuevo Cliente',
                    content: 'Después de completar los datos, haz clic en "GUARDAR CLIENTE". El nuevo cliente aparecerá inmediatamente en la lista con deuda $0 y 0 Vyper Coins.'
                },
                {
                    title: 'Editar un Cliente Existente',
                    content: 'En la tarjeta del cliente, haz clic en el botón "EDITAR". Se abrirá el mismo formulario con los datos actuales. Modifica lo que necesites y guarda los cambios.'
                },
                {
                    title: 'Información Importante',
                    content: 'No puedes eliminar clientes que tengan transacciones registradas. El número de teléfono es crucial para las notificaciones de WhatsApp, asegúrate de ingresarlo correctamente con el código de país (54 para Argentina).'
                }
            ]
        },
        'cuenta-corriente': {
            title: '💳 Sistema de Cuenta Corriente',
            description: 'Gestiona créditos y pagos de clientes',
            steps: [
                {
                    title: 'Acceder a Cuenta Corriente',
                    content: 'Haz clic en "💳 CTA CTE" en la barra de navegación superior.'
                },
                {
                    title: 'Vista del Módulo',
                    content: 'Verás un formulario para registrar transacciones en la parte superior y el historial de movimientos del mes actual en la parte inferior.'
                },
                {
                    title: 'Buscar Cliente',
                    content: 'En el campo "CLIENTE", comienza a escribir el nombre o teléfono. Selecciona el cliente de la lista. Verás su deuda actual destacada en rojo.'
                },
                {
                    title: 'Registrar una Compra a Crédito',
                    content: 'Ingresa el monto de la compra en "IMPORTE ($)". Haz clic en el botón rojo "COMPRA EN CUENTA CORRIENTE". Verás una vista previa del balance actual y el nuevo balance después de la compra.'
                },
                {
                    title: 'Confirmar la Compra',
                    content: 'Verifica que los montos sean correctos y haz clic en "📝 REGISTRAR COMPRA". El sistema actualizará la deuda del cliente automáticamente.'
                },
                {
                    title: 'Notificación Automática',
                    content: 'El cliente recibirá un mensaje de WhatsApp con el detalle: monto de la compra, nuevo saldo total, y un recordatorio de pago. Esto sucede automáticamente si el cliente tiene un teléfono válido registrado.'
                },
                {
                    title: 'Registrar un Pago',
                    content: 'Para registrar un pago, selecciona el cliente, ingresa el monto que está pagando, y haz clic en el botón verde "PAGO". El sistema restará el monto de su deuda.'
                },
                {
                    title: 'Pagos Parciales',
                    content: 'Puedes registrar pagos parciales. Por ejemplo, si un cliente debe $5000 y paga $2000, su nueva deuda será $3000. El sistema calcula todo automáticamente.'
                },
                {
                    title: 'Historial de Movimientos',
                    content: 'En la tabla inferior verás todos los movimientos del mes: fecha, cliente, tipo (COMPRA en rojo o PAGO en verde), importe y balance resultante. Esto te permite hacer seguimiento detallado de cada cuenta.'
                }
            ]
        },
        'vyper-coins': {
            title: '🪙 Programa Vyper Coins',
            description: 'Sistema de fidelización y recompensas',
            steps: [
                {
                    title: '¿Qué son los Vyper Coins?',
                    content: 'Vyper Coins es un programa de fidelización que te permite premiar a tus clientes frecuentes con puntos canjeables por descuentos o productos.'
                },
                {
                    title: 'Acceder al Módulo',
                    content: 'Haz clic en "🪙 VYPER COINS" en la barra de navegación superior.'
                },
                {
                    title: 'Seleccionar Cliente',
                    content: 'Usa el buscador para encontrar al cliente. Al seleccionarlo, verás su saldo actual de Vyper Coins destacado.'
                },
                {
                    title: 'Agregar Coins',
                    content: 'Ingresa la cantidad de coins a agregar en el campo "CANTIDAD DE COINS". Haz clic en el botón verde "AGREGAR COINS". Esto suma puntos al cliente (por ejemplo, por una compra o promoción).'
                },
                {
                    title: 'Descontar Coins (Canje)',
                    content: 'Para cuando un cliente canjea sus puntos, ingresa la cantidad y haz clic en el botón rojo "DESCONTAR COINS". El sistema verificará que el cliente tenga suficientes coins antes de permitir el canje.'
                },
                {
                    title: 'Notificaciones y Registro',
                    content: 'Cada movimiento de coins genera una notificación de WhatsApp al cliente y queda registrado en el historial. Así tanto tú como el cliente pueden hacer seguimiento de los puntos acumulados y canjeados.'
                }
            ]
        },
        'analytics': {
            title: '📊 Business Intelligence',
            description: 'Análisis avanzado de datos y reportes',
            steps: [
                {
                    title: 'Acceder a Analytics',
                    content: 'Haz clic en "📊 ANALYTICS" en la barra de navegación superior para acceder al módulo de Business Intelligence.'
                },
                {
                    title: 'Vista General del Dashboard',
                    content: 'Verás múltiples secciones: KPIs principales en la parte superior (Ingresos, Egresos, Utilidad), gráficos de tendencias, y tablas de datos detallados.'
                },
                {
                    title: 'Métricas Principales (KPIs)',
                    content: 'Las tarjetas superiores muestran: 💰 Ingresos Totales, 💸 Egresos Totales, 📊 Utilidad Neta, y 📈 Margen de Ganancia. Estos números se actualizan según el período seleccionado.'
                },
                {
                    title: 'Gráfico de Tendencias',
                    content: 'El gráfico de líneas muestra la evolución de ingresos y egresos en el tiempo. Puedes identificar picos de ventas, tendencias alcistas o bajistas, y patrones estacionales.'
                },
                {
                    title: 'Distribución de Egresos',
                    content: 'El gráfico de torta muestra cómo se distribuyen tus gastos por categoría (Salarios, Alquiler, Servicios, etc.). Esto te ayuda a identificar dónde se va la mayor parte del dinero.'
                },
                {
                    title: 'Filtros de Período',
                    content: 'Usa los filtros superiores para cambiar el período de análisis: Hoy, Esta Semana, Este Mes, Este Año, o un Rango Personalizado. Los gráficos se actualizan automáticamente.'
                },
                {
                    title: 'Análisis por Método de Pago',
                    content: 'Puedes ver la distribución de ventas por método de pago. Esto te ayuda a entender las preferencias de tus clientes y optimizar tus opciones de pago.'
                },
                {
                    title: 'Top Clientes',
                    content: 'La tabla de mejores clientes muestra quiénes son tus clientes más valiosos por volumen de compras. Úsala para identificar a quién ofrecer promociones especiales o más Vyper Coins.'
                },
                {
                    title: 'Exportar Reportes',
                    content: 'Haz clic en los botones de exportación para descargar los datos en PDF (con gráficos), Excel (para análisis adicional), o CSV (compatible con otras herramientas).'
                },
                {
                    title: 'Tomar Decisiones Informadas',
                    content: '¡Felicidades! Ahora sabes usar Analytics. Revisa este dashboard semanalmente para identificar oportunidades de mejora, controlar gastos y maximizar ganancias.'
                }
            ]
        }
    };

    const openTutorial = (tutorialId: string) => {
        setCurrentTutorial(tutorialId);
        setCurrentStep(0);
    };

    const closeTutorial = () => {
        setCurrentTutorial(null);
        setCurrentStep(0);
    };

    const nextStep = () => {
        if (currentTutorial && currentStep < tutorials[currentTutorial as keyof typeof tutorials].steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else if (currentTutorial && currentStep === tutorials[currentTutorial as keyof typeof tutorials].steps.length - 1) {
            // Tutorial completado
            closeTutorial();
        }
    };

    const previousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const tutorial = currentTutorial ? tutorials[currentTutorial as keyof typeof tutorials] : null;
    const progress = tutorial ? ((currentStep + 1) / tutorial.steps.length) * 100 : 0;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
            color: '#ffffff',
            padding: '2rem'
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    padding: '3rem 0',
                    background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.1), rgba(165, 180, 252, 0.1))',
                    borderRadius: '20px',
                    marginBottom: '3rem',
                    border: '2px solid rgba(74, 222, 128, 0.3)'
                }}>
                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #4ade80, #a5b4fc)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '1rem'
                    }}>
                        🎓 Tutorial Interactivo Vyper Labs
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#a0a0a0' }}>
                        Aprende a usar el sistema paso a paso con guías visuales
                    </p>
                </div>

                {/* Tutorial Grid */}
                {!currentTutorial && (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2rem',
                            marginBottom: '3rem'
                        }}>
                            {Object.entries(tutorials).map(([id, tut]) => (
                                <div
                                    key={id}
                                    onClick={() => openTutorial(id)}
                                    style={{
                                        background: 'rgba(26, 26, 26, 0.8)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '16px',
                                        padding: '2rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-10px)';
                                        e.currentTarget.style.borderColor = '#4ade80';
                                        e.currentTarget.style.boxShadow = '0 10px 40px rgba(74, 222, 128, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                                        {tut.title.split(' ')[0]}
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#4ade80' }}>
                                        {tut.title.substring(2)}
                                    </h3>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        background: 'rgba(74, 222, 128, 0.2)',
                                        borderRadius: '50px',
                                        fontSize: '0.85rem',
                                        color: '#4ade80',
                                        marginBottom: '1rem'
                                    }}>
                                        ⏱️ {Math.ceil(tut.steps.length * 0.8)} minutos
                                    </span>
                                    <p style={{ color: '#a0a0a0', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                        {tut.description}
                                    </p>
                                    <div style={{ fontSize: '0.9rem', color: '#a5b4fc' }}>
                                        📋 {tut.steps.length} pasos
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Links */}
                        <div style={{
                            background: 'rgba(26, 26, 26, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            padding: '2rem',
                            marginTop: '3rem'
                        }}>
                            <h3 style={{ color: '#4ade80', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                                🔗 Enlaces Rápidos
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem'
                            }}>
                                <Link href="/" style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    textAlign: 'center',
                                    textDecoration: 'none',
                                    color: '#fff',
                                    display: 'block',
                                    transition: 'all 0.3s ease'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#4ade80';
                                        e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏠</div>
                                    <div>Volver al Inicio</div>
                                </Link>
                                <Link href="/admin" style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    textAlign: 'center',
                                    textDecoration: 'none',
                                    color: '#fff',
                                    display: 'block',
                                    transition: 'all 0.3s ease'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#4ade80';
                                        e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                                    <div>Dashboard</div>
                                </Link>
                            </div>
                        </div>
                    </>
                )}

                {/* Tutorial Modal */}
                {currentTutorial && tutorial && (
                    <div style={{
                        background: '#1a1a1a',
                        borderRadius: '20px',
                        padding: '3rem',
                        maxWidth: '900px',
                        margin: '0 auto',
                        border: '2px solid rgba(74, 222, 128, 0.3)'
                    }}>
                        <button
                            onClick={closeTutorial}
                            style={{
                                position: 'absolute',
                                top: '1.5rem',
                                right: '1.5rem',
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <h2 style={{ color: '#4ade80', marginBottom: '0.5rem' }}>{tutorial.title}</h2>
                        <p style={{ color: '#a0a0a0', marginBottom: '1rem' }}>{tutorial.description}</p>

                        {/* Progress Bar */}
                        <div style={{
                            width: '100%',
                            height: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '50px',
                            overflow: 'hidden',
                            marginBottom: '2rem'
                        }}>
                            <div style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #4ade80, #a5b4fc)',
                                width: `${progress}%`,
                                transition: 'width 0.3s ease',
                                borderRadius: '50px'
                            }} />
                        </div>

                        {/* Steps */}
                        <div style={{ marginTop: '2rem' }}>
                            {tutorial.steps.map((step, index) => (
                                <div
                                    key={index}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: `1px solid ${index === currentStep ? '#4ade80' : 'rgba(255, 255, 255, 0.1)'}`,
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        marginBottom: '1.5rem',
                                        opacity: index === currentStep ? 1 : 0.3,
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        paddingLeft: '4rem',
                                        transform: index === currentStep ? 'scale(1.02)' : 'scale(1)'
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        left: '1.5rem',
                                        top: '1.5rem',
                                        width: '2rem',
                                        height: '2rem',
                                        background: index === currentStep ? 'linear-gradient(135deg, #4ade80, #a5b4fc)' : 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        color: index === currentStep ? '#000' : '#fff',
                                        transform: index === currentStep ? 'scale(1.2)' : 'scale(1)',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>
                                        {step.title}
                                    </h4>
                                    <p style={{ color: '#a0a0a0', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: step.content }} />
                                </div>
                            ))}
                        </div>

                        {/* Navigation Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            marginTop: '2rem',
                            justifyContent: 'space-between'
                        }}>
                            <button
                                onClick={previousStep}
                                disabled={currentStep === 0}
                                style={{
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                                    fontSize: '1rem',
                                    opacity: currentStep === 0 ? 0.3 : 1,
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <ChevronLeft size={20} /> Anterior
                            </button>
                            <button
                                onClick={nextStep}
                                style={{
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                                    color: '#000',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 5px 20px rgba(74, 222, 128, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {currentStep === tutorial.steps.length - 1 ? 'Completar ✓' : 'Siguiente'} <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
