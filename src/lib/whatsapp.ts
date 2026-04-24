import { CartItem, CheckoutData } from '@/types/ecommerce';

const FERNANDO_PHONE_MINORISTA = '5492646298880';
const FERNANDO_PHONE_MAYORISTA = '5492644193032';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateWhatsAppMessage(
  items: CartItem[],
  checkout: CheckoutData,
  pedidoNumero?: number,
  tienda: 'minorista' | 'mayorista' = 'mayorista'
): string {
  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const pedidoId = pedidoNumero ? `#${String(pedidoNumero).padStart(4, '0')}` : '';

  const productLines = items
    .map(item => `• ${item.cantidad}x ${item.nombre} — ${formatCurrency(item.precio)} c/u`)
    .join('\n');

  const title = tienda === 'mayorista' ? `🛒 *Nuevo Pedido Mayorista ${pedidoId}*` : `🛒 *Nuevo Pedido Minorista ${pedidoId}*`;

  const message = `${title}
━━━━━━━━━━━━━━━━
👤 *Cliente:* ${checkout.cliente_nombre}
📱 *Tel:* ${checkout.cliente_telefono}
📧 *Email:* ${checkout.cliente_email}

📦 *Productos:*
${productLines}

💰 *Total: ${formatCurrency(total)}*
━━━━━━━━━━━━━━━━
${checkout.notas ? `📝 *Notas:* ${checkout.notas}\n` : ''}_Pedido generado desde Vyper Labs_`;

  return message;
}

export function generateWhatsAppLink(
  items: CartItem[],
  checkout: CheckoutData,
  pedidoNumero?: number,
  tienda: 'minorista' | 'mayorista' = 'mayorista'
): string {
  const message = generateWhatsAppMessage(items, checkout, pedidoNumero, tienda);
  const encodedMessage = encodeURIComponent(message);
  const phone = tienda === 'mayorista' ? FERNANDO_PHONE_MAYORISTA : FERNANDO_PHONE_MINORISTA;
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}
