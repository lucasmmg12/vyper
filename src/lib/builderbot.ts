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
                content: messageContent,
                mediaUrl: "https://i.imgur.com/DcYHicK.png"
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
                content: messageContent,
                mediaUrl: "https://i.imgur.com/DcYHicK.png"
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
