import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const whatsapp = searchParams.get('whatsapp');

    if (!whatsapp) {
        return NextResponse.json({ error: 'Whatsapp required' }, { status: 400 });
    }

    const digits = whatsapp.replace(/\D/g, '');
    const tailDigits = digits.length >= 8 ? digits.slice(-8) : digits;

    // Fetch User by phone (flexible match on last 8 digits)
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .ilike('phone', `%${tailDigits}%`)
        .limit(1);

    const user = users?.[0];

    if (error || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch Recent Coin Transactions
    const { data: transactions } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

    const formattedUser = {
        ...user,
        coinBalance: Number(user.coin_balance || 0),
        debtBalance: Number(user.debt_balance || 0),
        name: user.name,
        whatsapp: user.phone,
        transactions: (transactions || []).map(t => ({
            ...t,
            amountFiat: Number(t.amount || t.amount_fiat || 0),
            amountCoins: Number(t.coins_added || t.amount_coins || 0),
            createdAt: t.date || t.created_at,
        })),
    };

    return NextResponse.json({ user: formattedUser });
}
