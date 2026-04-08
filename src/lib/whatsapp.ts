import { CartItem, CheckoutData } from '@/types/ecommerce';

const FERNANDO_PHONE = '5492646298880';

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
  pedidoNumero?: number
): string {
  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const pedidoId = pedidoNumero ? `#${String(pedidoNumero).padStart(4, '0')}` : '';

  const productLines = items
    .map(item => `• ${item.cantidad}x ${item.nombre} — ${formatCurrency(item.precio)} c/u`)
    .join('\n');

  const message = `🛒 *Nuevo Pedido Mayorista ${pedidoId}*
━━━━━━━━━━━━━━━━
👤 *Cliente:* ${checkout.cliente_nombre}
📱 *Tel:* ${checkout.cliente_telefono}
📧 *Email:* ${checkout.cliente_email}

📦 *Productos:*
${productLines}

💰 *Total: ${formatCurrency(total)}*
━━━━━━━━━━━━━━━━
${checkout.notas ? `📝 *Notas:* ${checkout.notas}\n` : ''}
_Pedido generado desde Vyper Labs_`;

  return message;
}

export function generateWhatsAppLink(
  items: CartItem[],
  checkout: CheckoutData,
  pedidoNumero?: number
): string {
  const message = generateWhatsAppMessage(items, checkout, pedidoNumero);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${FERNANDO_PHONE}?text=${encodedMessage}`;
}
