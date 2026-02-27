
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { whatsapp, amount, isCredit, clientName } = body; // 'whatsapp' comes from frontend input

        if (!whatsapp || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let formattedWhatsapp = String(whatsapp).trim().replace(/[\s-]/g, '');
        if (!formattedWhatsapp.startsWith('+549')) {
            if (formattedWhatsapp.startsWith('+54') && !formattedWhatsapp.startsWith('+549')) {
                formattedWhatsapp = '+549' + formattedWhatsapp.slice(3);
            } else if (formattedWhatsapp.startsWith('549')) {
                formattedWhatsapp = '+' + formattedWhatsapp;
            } else {
                formattedWhatsapp = '+549' + formattedWhatsapp;
            }
        }

        const amountNum = parseFloat(amount);
        const earnedCoins = Math.floor(amountNum / 1000);
        const now = new Date().toISOString();

        // 1. Find User by Phone (Telefono)
        let { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('phone', formattedWhatsapp)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user:', fetchError);
            return NextResponse.json({ error: 'Database Error' }, { status: 500 });
        }

        // 2. Create User if not exists
        if (!user) {
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    phone: whatsapp,
                    name: clientName || `Cliente ${whatsapp}`,
                    user_profile: 'CLIENT',
                    coin_balance: 0,
                    debt_balance: 0,
                    client_id: Math.floor(Math.random() * 1000000).toString(), // Generate simplified ID
                    last_load_date: now,
                    user_view: true,
                    user_status: true
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating user:', createError);
                return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
            }
            user = newUser;
        }

        // 3. Calculate New Balances
        const newDebt = isCredit ? (parseFloat(user.debt_balance || '0') + amountNum) : parseFloat(user.debt_balance || '0');
        const newCoins = (parseInt(user.coin_balance || '0')) + earnedCoins;

        // 4. Update User
        const { error: updateError } = await supabase
            .from('users')
            .update({
                debt_balance: newDebt,
                coin_balance: newCoins,
                last_load_date: now
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating user:', updateError);
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
        }

        // 5. Create Transaction
        const { error: txnError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                type: 'SALE',
                amount_fiat: amountNum,
                amount_coins: earnedCoins,
                description: `Venta POS - ${isCredit ? 'Crédito' : 'Contado'}`
            });

        if (txnError) console.error('Transaction log error:', txnError);

        // 6. Trigger Webhook
        try {
            const message = `*VYPER LABS NOTIFICATION*\n------------------\n¡Compra registrada!\nMonto: $${amountNum}\nGanaste: ${earnedCoins} Coins\nTotal Coins: ${newCoins}\n${isCredit ? `Deuda Actual: $${newDebt}` : ''}`;

            await axios.post(
                'https://app.builderbot.cloud/api/v2/1a3be0ed-27c1-4b67-a2f0-d0a2ac8fe949/messages',
                {
                    messages: {
                        content: message,
                        mediaUrl: "https://www.builderbot.app/assets/brand/logo-alone.png"
                    },
                    number: formattedWhatsapp.replace(/\D/g, ''),
                    checkIfExists: false
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-builderbot': 'bb-0921a9b4-81a2-4fd2-b45d-680480138bdc'
                    }
                }
            );
            console.log('Webhook sent successfully');
        } catch (webhookError) {
            console.error('Webhook failed:', webhookError);
        }

        return NextResponse.json({
            success: true,
            user: { ...user, coin_balance: newCoins, debt_balance: newDebt },
            earnedCoins
        });

    } catch (error) {
        console.error('Error processing sale:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
