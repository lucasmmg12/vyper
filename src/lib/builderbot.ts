// Helper function to send WhatsApp messages via BuilderBot webhook
import { getTierText, getTier } from '@/utils/tiers';

interface BuilderBotMessage {
    messages: {
        content: string;
        mediaUrl?: string;
    };
    number: string;
    checkIfExists: boolean;
}

export async function sendWhatsAppNotification(
    clientName: string,
    amount: number,
    totalCoins: number,
    phone: string
): Promise<boolean> {
    try {
        const webhookUrl = process.env.BUILDERBOT_WEBHOOK_URL;
        const apiKey = process.env.BUILDERBOT_API_KEY;

        if (!webhookUrl || !apiKey) {
            console.error('BuilderBot credentials not configured');
            return false;
        }

        // Format phone number (remove any non-digit characters)
        const cleanPhone = phone.replace(/\D/g, '');

        // Format amount as currency
        const formattedAmount = `$${amount.toLocaleString()}`;

        // Get tier info
        const tierInfo = getTier(totalCoins);
        const tierText = getTierText(totalCoins);
        const tierProgress = tierInfo.coinsToNext !== null
            ? `\n🎯 Te faltan *${tierInfo.coinsToNext} coins* para subir a *${tierInfo.nextTier}*`
            : '\n🏆 ¡Sos *nivel máximo*! Felicitaciones';

        // Build message content
        const messageContent = `👋 Hola, ${clientName}
Has realizado una compra por *${formattedAmount}* 💸
¡Ya tenés *${totalCoins} Vyper Coins*! 🪙

🏅 Tu nivel: *${tierText}*${tierProgress}

👉 Cuanto más comprás, más recompensas acumulás 🔥

────────────────────
🤖 Automatización creada por *Grow Labs*.`;

        const payload: BuilderBotMessage = {
            messages: {
                content: messageContent
            },
            number: cleanPhone,
            checkIfExists: false
        };

        console.log('Sending WhatsApp notification to:', cleanPhone);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-builderbot': apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('BuilderBot webhook error:', response.status, errorText);
            return false;
        }

        console.log('WhatsApp notification sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        return false;
    }
}

export async function sendDebtNotification(
    clientName: string,
    amount: number,
    newBalance: number,
    transactionType: 'charge' | 'payment',
    phone: string
): Promise<boolean> {
    try {
        const webhookUrl = process.env.BUILDERBOT_WEBHOOK_URL;
        const apiKey = process.env.BUILDERBOT_API_KEY;

        if (!webhookUrl || !apiKey) {
            console.error('BuilderBot credentials not configured');
            return false;
        }

        // Format phone number (remove any non-digit characters)
        const cleanPhone = phone.replace(/\D/g, '');

        // Format amounts as currency
        const formattedAmount = `$${amount.toLocaleString()}`;
        const formattedBalance = `$${newBalance.toLocaleString()}`;

        // Build message content based on transaction type
        let messageContent: string;

        if (transactionType === 'charge') {
            // Compra en cuenta corriente
            messageContent = `🛒 Hola, ${clientName}
Has realizado una compra en *Cuenta Corriente* por *${formattedAmount}* 💳

📊 Tu nuevo saldo es: *${formattedBalance}*

💡 Recordá que podés abonar tu cuenta en cualquier momento en nuestras sucursales o mediante transferencia 💰

────────────────────
🤖 Automatización creada por *Grow Labs*.`;
        } else {
            // Pago
            messageContent = `✅ Hola, ${clientName}
¡Gracias por tu pago de *${formattedAmount}*! 💚

📊 Tu nuevo saldo es: *${formattedBalance}*

${newBalance === 0 ? '🎉 ¡Felicitaciones! Tu cuenta está al día ✨' : '💡 Seguí abonando para mantener tu cuenta al día 👍'}

────────────────────
🤖 Automatización creada por *Grow Labs*.`;
        }

        const payload: BuilderBotMessage = {
            messages: {
                content: messageContent
            },
            number: cleanPhone,
            checkIfExists: false
        };

        console.log(`Sending debt ${transactionType} notification to:`, cleanPhone);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-builderbot': apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('BuilderBot webhook error:', response.status, errorText);
            return false;
        }

        console.log('Debt notification sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending debt notification:', error);
        return false;
    }
}

export async function sendOrderStatusNotification(
    clientName: string,
    pedidoNumero: number,
    nuevoEstado: string,
    total: number,
    phone: string,
    pedidoId?: string
): Promise<boolean> {
    try {
        const webhookUrl = process.env.BUILDERBOT_WEBHOOK_URL;
        const apiKey = process.env.BUILDERBOT_API_KEY;

        if (!webhookUrl || !apiKey) {
            console.error('BuilderBot credentials not configured');
            return false;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone) return false;

        const formattedTotal = `$${Number(total || 0).toLocaleString('es-AR')}`;
        const numStr = String(pedidoNumero || 0).padStart(4, '0');
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
        const trackingLine = pedidoId
            ? `\n🔗 Seguí el estado de tu pedido en vivo: ${siteUrl ? `${siteUrl}/pedido/${pedidoId}` : `/pedido/${pedidoId}`}\n`
            : '';

        let messageContent = '';
        if (nuevoEstado === 'procesando') {
            messageContent = `⏳ *¡Estamos preparando tu pedido #${numStr}!*

👋 Hola *${clientName}*, te avisamos que tu pedido por *${formattedTotal}* ya está en preparación en nuestro depósito 📦💪
${trackingLine}
Te vamos a avisar por acá apenas esté listo para retirar o despachar.

────────────────────
🤖 *Vyper Suplementos* · Grow Labs`;
        } else if (nuevoEstado === 'completado') {
            messageContent = `✅ *¡Tu pedido #${numStr} está listo!*

🎉 Hola *${clientName}*, tu pedido por *${formattedTotal}* ya fue completado y está listo para entrega/retiro 🚀
${trackingLine}
¡Muchas gracias por confiar en *Vyper Suplementos*! 🦾

────────────────────
🤖 *Vyper Suplementos* · Grow Labs`;
        } else {
            messageContent = `📦 Hola *${clientName}*, el estado de tu pedido *#${numStr}* (${formattedTotal}) cambió a: *${nuevoEstado.toUpperCase()}*.${trackingLine}

────────────────────
🤖 *Vyper Suplementos* · Grow Labs`;
        }

        const payload: BuilderBotMessage = {
            messages: {
                content: messageContent
            },
            number: cleanPhone,
            checkIfExists: false
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-builderbot': apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('BuilderBot order status webhook error:', response.status, errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending order status notification:', error);
        return false;
    }
}

export async function sendDebtReminderNotification(
    clientName: string,
    balance: number,
    phone: string,
    customMessage?: string
): Promise<boolean> {
    try {
        const webhookUrl = process.env.BUILDERBOT_WEBHOOK_URL;
        const apiKey = process.env.BUILDERBOT_API_KEY;

        if (!webhookUrl || !apiKey) {
            console.error('BuilderBot credentials not configured');
            return false;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone) return false;

        const formattedBalance = `$${Number(balance || 0).toLocaleString('es-AR')}`;

        const messageContent = customMessage || `👋 Hola *${clientName}*, ¿cómo estás?

Te escribimos de *Vyper Suplementos* para recordarte amablemente que tu cuenta corriente registra un saldo pendiente de *${formattedBalance}* 💳

💡 Podés abonar por transferencia o acercándote a nuestras sucursales cuando gustes. Si ya realizaste el pago, por favor desestimá este mensaje 🙏

¡Muchas gracias por tu confianza de siempre! 🦾

────────────────────
🤖 Automatización creada por *Grow Labs*.`;

        const payload: BuilderBotMessage = {
            messages: {
                content: messageContent
            },
            number: cleanPhone,
            checkIfExists: false
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-builderbot': apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('BuilderBot debt reminder error:', response.status, errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending debt reminder notification:', error);
        return false;
    }
}

