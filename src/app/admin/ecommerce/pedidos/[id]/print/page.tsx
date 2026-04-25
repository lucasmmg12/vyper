'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Pedido } from '@/types/ecommerce';

export default function PedidoPrintPage() {
  const params = useParams();
  const id = params.id as string;
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPedido() {
      try {
        const res = await fetch(`/api/ecommerce/pedidos/${id}`);
        const data = await res.json();
        if (data.pedido) {
          setPedido(data.pedido);
        }
      } catch (err) {
        console.error('Error fetching pedido', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPedido();
  }, [id]);

  useEffect(() => {
    if (!loading && pedido) {
      // Delay print slightly to ensure images/fonts load
      const timeout = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [loading, pedido]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Cargando factura...</div>;
  }

  if (!pedido) {
    return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif', color: 'red' }}>Pedido no encontrado.</div>;
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: "'Inter', sans-serif",
      color: '#000',
      background: '#fff',
      minHeight: '100vh'
    }}>
      {/* Header Factura */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 800 }}>FACTURA / PEDIDO</h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', color: '#555' }}>
            Nº de Pedido: <strong>#{String(pedido.numero_pedido).padStart(4, '0')}</strong>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Fecha: {new Date(pedido.created_at).toLocaleDateString('es-AR')}</p>
        </div>
      </div>

      {/* Datos Cliente y Empresa */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', borderBottom: '1px solid #ccc', paddingBottom: '0.25rem' }}>Datos del Cliente</h3>
          <p style={{ margin: '0.25rem 0', fontWeight: 600 }}>{pedido.cliente_nombre}</p>
          <p style={{ margin: '0.25rem 0' }}>Teléfono: {pedido.cliente_telefono}</p>
          {pedido.cliente_email && <p style={{ margin: '0.25rem 0' }}>Email: {pedido.cliente_email}</p>}
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', borderBottom: '1px solid #ccc', paddingBottom: '0.25rem' }}>Datos de la Empresa</h3>
          <p style={{ margin: '0.25rem 0', fontWeight: 600 }}>GrowLabs Ecommerce</p>
          <p style={{ margin: '0.25rem 0' }}>Comprobante Interno</p>
        </div>
      </div>

      {/* Tabla de Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #000' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Descripción</th>
            <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>Cantidad</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Precio Unit.</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {(pedido.items || []).map((item, index) => (
            <tr key={item.id || index} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem', textAlign: 'left' }}>{item.producto_nombre}</td>
              <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.cantidad}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatPrice(item.precio_unitario)}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 500 }}>{formatPrice(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #000', paddingTop: '1rem' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
            <span>TOTAL:</span>
            <span>{formatPrice(pedido.total)}</span>
          </div>
        </div>
      </div>

      {/* Notas */}
      {pedido.notas && (
        <div style={{ marginTop: '3rem', padding: '1rem', background: '#f9f9f9', borderLeft: '4px solid #333' }}>
          <strong>Notas del pedido:</strong>
          <p style={{ margin: '0.5rem 0 0 0' }}>{pedido.notas}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '4rem', textAlign: 'center', fontSize: '0.875rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
        <p>Gracias por su compra.</p>
        <p>Este documento es un comprobante interno de pedido, no válido como factura legal.</p>
      </div>

      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: #fff; margin: 0; padding: 0; }
          .page-container { padding: 0; }
          @page { margin: 1cm; }
        }
      `}} />
    </div>
  );
}
