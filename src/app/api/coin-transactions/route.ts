
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppNotification } from '@/lib/builderbot';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';

    const { data, error } = await supabase
        .from('coin_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ transactions: data });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { client_id, client_name, amount, coins_added } = body;

        if (!client_id || !amount || coins_added === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('coin_transactions')
            .insert([{
                client_id,
                client_name,
                amount: parseFloat(amount),
                coins_added: parseInt(coins_added),
                date: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('Error creating transaction:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get client info including phone number and updated coin balance
        const { data: clientData, error: clientError } = await supabase
            .from('users')
            .select('phone, coin_balance')
            .eq('id', client_id)
            .single();

        if (!clientError && clientData && clientData.phone) {
            // Send WhatsApp notification (don't wait for it, run async)
            sendWhatsAppNotification(
                client_name,
                parseFloat(amount),
                clientData.coin_balance || 0,
                clientData.phone
            ).catch(err => {
                console.error('Failed to send WhatsApp notification:', err);
                // Don't fail the transaction if notification fails
            });
        } else {
            console.warn('Could not send notification: client phone not found');
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('POST /api/coin-transactions error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { data, error } = await supabase
            .from('coin_transactions')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { error } = await supabase
            .from('coin_transactions')
            .delete()
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
