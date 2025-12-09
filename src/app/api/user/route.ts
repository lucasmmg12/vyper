
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const whatsapp = searchParams.get('whatsapp');

    if (!whatsapp) {
        return NextResponse.json({ error: 'Whatsapp required' }, { status: 400 });
    }

    // Fetch User by phone
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', whatsapp)
        .single();

    if (error || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch Recent Transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    // Map to frontend-friendly structure
    const formattedUser = {
        ...user,
        // Map snake_case to camelCase for frontend consistency if needed, or use directly
        coinBalance: user.coin_balance,
        debtBalance: user.debt_balance,
        name: user.name,
        whatsapp: user.phone, // Frontend expects 'whatsapp'
        transactions: transactions?.map(t => ({
            ...t,
            amountFiat: t.amount_fiat,
            amountCoins: t.amount_coins,
            createdAt: t.created_at
        })) || []
    };

    return NextResponse.json({ user: formattedUser });
}
