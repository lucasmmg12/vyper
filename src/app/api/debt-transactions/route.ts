
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendDebtNotification } from '@/lib/builderbot';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';
    const clientId = searchParams.get('client_id');
    const currentMonth = searchParams.get('current_month') === 'true';

    let query = supabase
        .from('debt_transactions')
        .select('*')
        .order('created_at', { ascending: false });

    if (clientId) {
        query = query.eq('client_id', clientId);
    }

    // Si se solicita el mes actual, filtrar por fecha
    if (currentMonth) {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        query = query
            .gte('created_at', firstDayOfMonth.toISOString())
            .lte('created_at', lastDayOfMonth.toISOString());
    } else {
        // Si no se solicita el mes actual, aplicar el límite
        query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ transactions: data });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { client_id, client_name, amount, transaction_type, notes, branch } = body;

        if (!client_id || !amount || !transaction_type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['charge', 'payment'].includes(transaction_type)) {
            return NextResponse.json({ error: 'Invalid transaction_type. Must be "charge" or "payment"' }, { status: 400 });
        }

        // Get current client debt balance
        const { data: clientData, error: clientError } = await supabase
            .from('users')
            .select('debt_balance, phone')
            .eq('id', client_id)
            .single();

        if (clientError || !clientData) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const currentBalance = parseFloat(clientData.debt_balance || '0');
        const transactionAmount = parseFloat(amount);

        // Calculate new balance
        let newBalance;
        if (transaction_type === 'charge') {
            // Compra en cuenta corriente: aumenta la deuda
            newBalance = currentBalance + transactionAmount;
        } else {
            // Pago: disminuye la deuda
            newBalance = currentBalance - transactionAmount;
        }

        // Create transaction record
        const { data: transactionData, error: transactionError } = await supabase
            .from('debt_transactions')
            .insert([{
                client_id,
                client_name,
                amount: transactionAmount,
                transaction_type,
                balance_after: newBalance,
                date: new Date().toISOString(),
                notes: notes || (branch ? `Sucursal: ${branch}` : null)
            }])
            .select();

        if (transactionError) {
            console.error('Error creating debt transaction:', transactionError);
            return NextResponse.json({ error: transactionError.message }, { status: 500 });
        }

        // Update client's debt balance
        const { error: updateError } = await supabase
            .from('users')
            .update({ debt_balance: newBalance })
            .eq('id', client_id);

        if (updateError) {
            console.error('Error updating client debt balance:', updateError);
            // Non-critical, but should be noted
        }

        // --- NEW: IF PAYMENT, REGISTER AS INCOME IN SALES ---
        if (transaction_type === 'payment') {
            const saleDate = new Date();
            const { error: salesError } = await supabase
                .from('sales')
                .insert([{
                    date: saleDate.toISOString(),
                    amount: transactionAmount,
                    branch: branch || 'Rawson',
                    observations: `PAGO CTA CTE - ${client_name} - ${notes || ''}`.trim(),
                    month_number: saleDate.getMonth() + 1
                }]);

            if (salesError) {
                console.error('Error registering payment in sales table:', salesError);
                // We prefer not to fail the whole request if this fails, but it is important.
            }
        }
        // ---------------------------------------------------

        // Send WhatsApp notification
        if (clientData.phone) {
            sendDebtNotification(
                client_name,
                transactionAmount,
                newBalance,
                transaction_type,
                clientData.phone
            ).catch(err => {
                console.error('Failed to send debt notification:', err);
            });
        }

        return NextResponse.json({ success: true, data: transactionData, newBalance });
    } catch (error: any) {
        console.error('POST /api/debt-transactions error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { error } = await supabase
            .from('debt_transactions')
            .delete()
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
