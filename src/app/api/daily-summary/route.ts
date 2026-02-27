
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const webhookUrl = process.env.BUILDERBOT_WEBHOOK_URL;
        const apiKey = process.env.BUILDERBOT_API_KEY;
        const ownerPhone = process.env.OWNER_PHONE;

        if (!webhookUrl || !apiKey || !ownerPhone) {
            return NextResponse.json(
                { error: 'Missing configuration: BUILDERBOT_WEBHOOK_URL, BUILDERBOT_API_KEY, or OWNER_PHONE' },
                { status: 500 }
            );
        }

        // Get today's date range (Argentina timezone UTC-3)
        const now = new Date();
        const argentinaOffset = -3 * 60; // UTC-3 in minutes
        const argentinaTime = new Date(now.getTime() + (argentinaOffset + now.getTimezoneOffset()) * 60000);

        const todayStart = new Date(argentinaTime);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(argentinaTime);
        todayEnd.setHours(23, 59, 59, 999);

        // Also calculate last week same day for comparison
        const lastWeekStart = new Date(todayStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(todayEnd);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

        // ─── FETCH TODAY'S DATA ─────────────────────────

        // Today's sales
        const { data: todaySales } = await supabase
            .from('sales')
            .select('amount, branch')
            .gte('date', todayStart.toISOString())
            .lte('date', todayEnd.toISOString());

        // Today's expenses
        const { data: todayExpenses } = await supabase
            .from('expenses')
            .select('amount, branch, category')
            .gte('date', todayStart.toISOString())
            .lte('date', todayEnd.toISOString());

        // Last week same day sales (for comparison)
        const { data: lastWeekSales } = await supabase
            .from('sales')
            .select('amount')
            .gte('date', lastWeekStart.toISOString())
            .lte('date', lastWeekEnd.toISOString());

        // Coin transactions today
        const { data: todayCoins } = await supabase
            .from('coin_transactions')
            .select('coins_added, amount')
            .gte('date', todayStart.toISOString())
            .lte('date', todayEnd.toISOString());

        // Debt transactions today
        const { data: todayDebt } = await supabase
            .from('debt_transactions')
            .select('amount, transaction_type')
            .gte('date', todayStart.toISOString())
            .lte('date', todayEnd.toISOString());

        // Clients with overdue debt (> 0)
        const { data: debtClients } = await supabase
            .from('users')
            .select('name, debt_balance, phone')
            .gt('debt_balance', 0)
            .order('debt_balance', { ascending: false })
            .limit(5);

        // Total active clients
        const { count: totalClients } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('user_status', true);

        // ─── CALCULATE METRICS ──────────────────────────

        const totalSales = todaySales?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
        const totalExpenses = todayExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        const netProfit = totalSales - totalExpenses;
        const salesCount = todaySales?.length || 0;
        const expensesCount = todayExpenses?.length || 0;

        // Per branch
        const salesRivadavia = todaySales?.filter(s => s.branch?.toLowerCase().includes('rivadavia')).reduce((sum, s) => sum + Number(s.amount), 0) || 0;
        const salesRawson = todaySales?.filter(s => s.branch?.toLowerCase().includes('rawson')).reduce((sum, s) => sum + Number(s.amount), 0) || 0;
        const salesNoBranch = totalSales - salesRivadavia - salesRawson;

        const expensesRivadavia = todayExpenses?.filter(e => e.branch?.toLowerCase().includes('rivadavia')).reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        const expensesRawson = todayExpenses?.filter(e => e.branch?.toLowerCase().includes('rawson')).reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        // Last week comparison
        const lastWeekTotal = lastWeekSales?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
        const weekComparison = lastWeekTotal > 0
            ? ((totalSales - lastWeekTotal) / lastWeekTotal * 100).toFixed(1)
            : null;

        // Coin stats
        const totalCoinsGiven = todayCoins?.reduce((sum, c) => sum + Number(c.coins_added), 0) || 0;
        const coinTransactionsAmount = todayCoins?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

        // Debt stats
        const newCharges = todayDebt?.filter(d => d.transaction_type === 'charge').reduce((sum, d) => sum + Number(d.amount), 0) || 0;
        const payments = todayDebt?.filter(d => d.transaction_type === 'payment').reduce((sum, d) => sum + Number(d.amount), 0) || 0;

        // Average ticket
        const avgTicket = salesCount > 0 ? (totalSales / salesCount) : 0;

        // Top expense categories
        const categoryMap: Record<string, number> = {};
        todayExpenses?.forEach(e => {
            const cat = e.category || 'Sin categoría';
            categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount);
        });
        const topCategories = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        // ─── FORMAT MESSAGE ─────────────────────────────

        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const dayName = dayNames[argentinaTime.getDay()];
        const dateStr = `${argentinaTime.getDate()} de ${monthNames[argentinaTime.getMonth()]}`;

        const profitEmoji = netProfit >= 0 ? '📈' : '📉';
        const comparisonStr = weekComparison !== null
            ? (Number(weekComparison) >= 0
                ? `📊 *+${weekComparison}%* vs mismo día semana pasada ✅`
                : `📊 *${weekComparison}%* vs mismo día semana pasada ⚠️`)
            : '📊 Sin datos de la semana pasada para comparar';

        let message = `📋 *RESUMEN DEL DÍA — VYPER*
${dayName} ${dateStr}

━━━━━━━━━━━━━━━━━━━━
${profitEmoji} *RESULTADO GENERAL*
━━━━━━━━━━━━━━━━━━━━
💰 Ventas: *$${totalSales.toLocaleString('es-AR')}* (${salesCount} ops)
💸 Egresos: *$${totalExpenses.toLocaleString('es-AR')}* (${expensesCount} ops)
${netProfit >= 0 ? '✅' : '🔴'} Ganancia Neta: *$${netProfit.toLocaleString('es-AR')}*
🎫 Ticket Promedio: *$${avgTicket.toLocaleString('es-AR', { maximumFractionDigits: 0 })}*

${comparisonStr}`;

        // Branch breakdown (only if there are sales in at least one branch)
        if (salesRivadavia > 0 || salesRawson > 0) {
            message += `

━━━━━━━━━━━━━━━━━━━━
🏪 *POR SUCURSAL*
━━━━━━━━━━━━━━━━━━━━`;
            if (salesRivadavia > 0 || expensesRivadavia > 0) {
                message += `
📍 *Rivadavia*: Ventas $${salesRivadavia.toLocaleString('es-AR')} | Egresos $${expensesRivadavia.toLocaleString('es-AR')}`;
            }
            if (salesRawson > 0 || expensesRawson > 0) {
                message += `
📍 *Rawson*: Ventas $${salesRawson.toLocaleString('es-AR')} | Egresos $${expensesRawson.toLocaleString('es-AR')}`;
            }
            if (salesNoBranch > 0) {
                message += `
📍 *Sin asignar*: $${salesNoBranch.toLocaleString('es-AR')}`;
            }
        }

        // Coin stats
        if (totalCoinsGiven > 0) {
            message += `

━━━━━━━━━━━━━━━━━━━━
🪙 *VYPER COINS*
━━━━━━━━━━━━━━━━━━━━
Coins entregados: *${totalCoinsGiven}*
En compras por: *$${coinTransactionsAmount.toLocaleString('es-AR')}*`;
        }

        // Debt stats
        if (newCharges > 0 || payments > 0) {
            message += `

━━━━━━━━━━━━━━━━━━━━
💳 *CUENTA CORRIENTE*
━━━━━━━━━━━━━━━━━━━━`;
            if (newCharges > 0) message += `\n🔴 Nuevos cargos: *$${newCharges.toLocaleString('es-AR')}*`;
            if (payments > 0) message += `\n🟢 Pagos recibidos: *$${payments.toLocaleString('es-AR')}*`;
        }

        // Top expense categories
        if (topCategories.length > 0) {
            message += `

━━━━━━━━━━━━━━━━━━━━
📂 *TOP EGRESOS*
━━━━━━━━━━━━━━━━━━━━`;
            topCategories.forEach(([cat, amount], i) => {
                const medals = ['🥇', '🥈', '🥉'];
                message += `\n${medals[i] || '•'} ${cat}: $${amount.toLocaleString('es-AR')}`;
            });
        }

        // ─── ALERTS ─────────────────────────────────────

        const alerts: string[] = [];

        // Alert: Overdue debts
        if (debtClients && debtClients.length > 0) {
            const totalDebt = debtClients.reduce((sum, c) => sum + Number(c.debt_balance), 0);
            alerts.push(`💳 *${debtClients.length} clientes con deuda* (Total: $${totalDebt.toLocaleString('es-AR')})`);
            debtClients.slice(0, 3).forEach(c => {
                alerts.push(`   → ${c.name}: $${Number(c.debt_balance).toLocaleString('es-AR')}`);
            });
        }

        // Alert: No sales today
        if (salesCount === 0) {
            alerts.push(`⚠️ *Sin ventas registradas hoy*`);
        }

        // Alert: High expenses vs sales
        if (totalSales > 0 && totalExpenses > totalSales * 0.8) {
            alerts.push(`⚠️ *Egresos altos*: representan el ${((totalExpenses / totalSales) * 100).toFixed(0)}% de las ventas`);
        }

        if (alerts.length > 0) {
            message += `

━━━━━━━━━━━━━━━━━━━━
🚨 *ALERTAS*
━━━━━━━━━━━━━━━━━━━━
${alerts.join('\n')}`;
        }

        // Footer
        message += `

━━━━━━━━━━━━━━━━━━━━
👥 Clientes activos: *${totalClients || 0}*

🤖 Automatización creada por *Grow Labs*.`;

        // ─── SEND VIA BUILDERBOT ────────────────────────

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-builderbot': apiKey
            },
            body: JSON.stringify({
                messages: {
                    content: message,
                    mediaUrl: "https://i.imgur.com/DcYHicK.png"
                },
                number: ownerPhone,
                checkIfExists: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Daily summary send error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Failed to send daily summary', details: errorText },
                { status: 500 }
            );
        }

        console.log('Daily summary sent to owner successfully');

        return NextResponse.json({
            success: true,
            summary: {
                totalSales,
                totalExpenses,
                netProfit,
                salesCount,
                avgTicket,
                salesRivadavia,
                salesRawson,
                totalCoinsGiven,
                newCharges,
                payments,
                alertsCount: alerts.length,
                totalClients: totalClients || 0
            }
        });

    } catch (error) {
        console.error('Error generating daily summary:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
