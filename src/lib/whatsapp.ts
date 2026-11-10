import { CartItem, CheckoutData } from '@/types/ecommerce';

const FERNANDO_PHONE_MINORISTA = '5492646796509';
const FERNANDO_PHONE_MAYORISTA = '5492646796509';

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
  const subtotal = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const descuento = checkout.descuento_monto && checkout.descuento_monto > 0 ? checkout.descuento_monto : 0;
  const total = Math.max(0, subtotal - descuento);
  const pedidoId = pedidoNumero ? `#${String(pedidoNumero).padStart(4, '0')}` : '';

  const productLines = items
    .map(item => {
      const hasVarInName = item.variante && item.nombre.toLowerCase().includes(`(${item.variante.toLowerCase()})`);
      const displayName = item.variante && !hasVarInName ? `${item.nombre} (${item.variante})` : item.nombre;
      return `• ${item.cantidad}x ${displayName} — ${formatCurrency(item.precio)} c/u`;
    })
    .join('\n');

  const title = tienda === 'mayorista' ? `🛒 *Nuevo Pedido Mayorista ${pedidoId}*` : `🛒 *Nuevo Pedido Minorista ${pedidoId}*`;

  let discountLines = '';
  if (descuento > 0) {
    discountLines += `\n💵 *Subtotal:* ${formatCurrency(subtotal)}`;
    if (checkout.cupon_codigo) {
      discountLines += `\n🏷️ *Cupón (${checkout.cupon_codigo}):* -${formatCurrency(descuento)}`;
    } else if (checkout.coins_usados && checkout.coins_usados > 0) {
      discountLines += `\n🪙 *Canje Vyper Coins (${checkout.coins_usados}):* -${formatCurrency(descuento)}`;
    } else {
      discountLines += `\n🏷️ *Descuento aplicado:* -${formatCurrency(descuento)}`;
    }
  }

  const message = `${title}
━━━━━━━━━━━━━━━━
👤 *Cliente:* ${checkout.cliente_nombre}
📱 *Tel:* ${checkout.cliente_telefono}
${checkout.cliente_email ? `📧 *Email:* ${checkout.cliente_email}\n` : ''}
📦 *Productos:*
${productLines}
${discountLines}
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
