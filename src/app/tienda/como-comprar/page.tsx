'use client';

import { ShoppingCart, Search, Plus, CreditCard, Send, MessageCircle, Package, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    number: 1,
    title: 'Explorá el catálogo',
    description: 'Navegá por nuestras secciones de Ofertas, Destacados y Últimos Ingresos. También podés usar el buscador o los filtros por rubro, categoría y marca para encontrar lo que necesitás.',
    icon: <Search size={24} />,
    color: '#3b82f6',
  },
  {
    number: 2,
    title: 'Agregá productos al pedido',
    description: 'Hacé click en "+ Agregar" en cada producto que quieras. Se va a sumar automáticamente a tu pedido con la cantidad mínima mayorista. Podés ver el detalle de cada producto haciendo click en su imagen.',
    icon: <Plus size={24} />,
    color: '#10b981',
  },
  {
    number: 3,
    title: 'Revisá tu pedido',
    description: 'Andá a "Mi Pedido" desde el menú o el ícono del carrito. Ahí podés ajustar cantidades, eliminar productos y ver el total de tu compra.',
    icon: <ShoppingCart size={24} />,
    color: '#f59e0b',
  },
  {
    number: 4,
    title: 'Completá tus datos',
    description: 'Ingresá tu nombre, teléfono y dirección de entrega. Seleccioná el método de pago que prefieras: efectivo, transferencia o tarjeta.',
    icon: <CreditCard size={24} />,
    color: '#8b5cf6',
  },
  {
    number: 5,
    title: 'Enviá el pedido por WhatsApp',
    description: 'Al confirmar, se abre WhatsApp con un mensaje pre-armado con todo el detalle de tu pedido. Solo tenés que enviarlo y listo, nosotros nos encargamos del resto.',
    icon: <Send size={24} />,
    color: '#25D366',
  },
  {
    number: 6,
    title: 'Recibí la confirmación',
    description: 'Te confirmamos por WhatsApp la disponibilidad, el monto final y coordinamos la entrega o retiro en nuestro local.',
    icon: <CheckCircle size={24} />,
    color: '#ef4444',
  },
];

const faqs = [
  {
    q: '¿Cuál es el pedido mínimo?',
    a: 'Cada producto tiene su cantidad mínima mayorista indicada en la ficha. No hay un monto mínimo total para hacer el pedido.',
  },
  {
    q: '¿Los precios incluyen IVA?',
    a: 'Los precios mostrados son finales. Podemos facturar A o B según lo que necesites.',
  },
  {
    q: '¿Hacen envíos?',
    a: 'Sí, hacemos envíos dentro de San Juan. Para el interior consultanos las opciones de transporte.',
  },
  {
    q: '¿Puedo retirar en el local?',
    a: 'Sí, podés retirar tu pedido en Dr. Ortega 192, Villa Krause. Te avisamos cuando está listo.',
  },
  {
    q: '¿Qué formas de pago aceptan?',
    a: 'Efectivo, transferencia bancaria y tarjetas (débito y crédito). Para pagos en cuotas consultanos.',
  },
  {
    q: '¿Cuánto tarda el pedido?',
    a: 'Si el pedido tiene stock disponible, lo preparamos en el día. Te confirmamos el plazo exacto por WhatsApp.',
  },
];

export default function ComoComprarPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: '#f0f9ff', color: '#3b82f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
        }}>
          <Package size={28} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#111' }}>
          ¿Cómo comprar?
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
          Comprar en Vyper es fácil y rápido. Seguí estos pasos y armá tu pedido mayorista en minutos.
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
        {steps.map((step, i) => (
          <div
            key={step.number}
            style={{
              display: 'flex',
              gap: '1.25rem',
              padding: '1.5rem',
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #e5e7eb',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              position: 'relative',
            }}
            onMouseEnter={e => {
              (e.currentTarget).style.borderColor = step.color;
              (e.currentTarget).style.boxShadow = `0 4px 16px ${step.color}15`;
            }}
            onMouseLeave={e => {
              (e.currentTarget).style.borderColor = '#e5e7eb';
              (e.currentTarget).style.boxShadow = 'none';
            }}
          >
            {/* Step icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 12, flexShrink: 0,
              background: `${step.color}10`, color: step.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {step.icon}
            </div>
            {/* Step content */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 700,
                  color: step.color, background: `${step.color}12`,
                  padding: '0.125rem 0.5rem', borderRadius: 100,
                }}>
                  PASO {step.number}
                </span>
              </div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.375rem', color: '#111' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
                {step.description}
              </p>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div style={{
                position: 'absolute',
                bottom: -24,
                left: 44.5,
                width: 2,
                height: 24,
                background: '#e5e7eb',
                zIndex: 1,
              }} />
            )}
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#111', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageCircle size={20} /> Preguntas frecuentes
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {faqs.map((faq, i) => (
            <details
              key={i}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <summary style={{
                padding: '1rem 1.25rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9375rem',
                color: '#111',
                listStyle: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                {faq.q}
                <ArrowRight size={16} style={{ color: '#9ca3af', transition: '0.2s', flexShrink: 0 }} />
              </summary>
              <div style={{
                padding: '0 1.25rem 1rem',
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: 1.6,
              }}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: '#f9fafb',
        borderRadius: 14,
        border: '1px solid #e5e7eb',
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111' }}>
          ¿Listo para armar tu pedido?
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '1.25rem', fontSize: '0.9375rem' }}>
          Explorá nuestro catálogo de suplementos, indumentaria y accesorios.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/tienda">
            <button style={{
              background: '#111', color: '#fff', border: 'none',
              padding: '0.75rem 1.5rem', borderRadius: 10,
              fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <ShoppingCart size={18} /> Ir al catálogo
            </button>
          </Link>
          <a
            href="https://api.whatsapp.com/send/?phone=5492644193032&text=Hola%20Vyper!%20Tengo%20una%20consulta&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button style={{
              background: '#fff', color: '#111',
              border: '1px solid #d1d5db',
              padding: '0.75rem 1.5rem', borderRadius: 10,
              fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <MessageCircle size={18} /> Consultar por WhatsApp
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
