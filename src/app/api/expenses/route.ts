
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken, COOKIE_NAME, isEzeRawsonUser } from '@/lib/auth';

async function getSessionUser(request: Request) {
    try {
        const cookieHeader = request.headers.get('cookie') || '';
        const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
        const token = match ? decodeURIComponent(match[1]) : null;
        return token ? await verifyToken(token) : null;
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const user = await getSessionUser(request);
        const forceRawson = isEzeRawsonUser(user?.email);
        const body = await request.json();
        const data = Array.isArray(body) ? body : [body];

        const inserts = data.map((item: any) => ({
            date: item.date || new Date().toISOString(),
            category: item.category,
            amount: parseFloat(item.amount),
            observations: item.observations,
            branch: forceRawson ? 'Rawson' : item.branch,
            legacy_id: item.id_egreso?.toString()
        }));

        const { data: result, error } = await supabase
            .from('expenses')
            .insert(inserts)
            .select();

        if (error) {
            console.error('Error recording expense:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: result.length, data: result });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const user = await getSessionUser(request);
    const forceRawson = isEzeRawsonUser(user?.email);
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    let query = supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

    if (forceRawson) {
        query = query.eq('branch', 'Rawson');
    }

    if (limit) {
        query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ expenses: data });
}

export async function DELETE(request: Request) {
    const user = await getSessionUser(request);
    const forceRawson = isEzeRawsonUser(user?.email);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    let query = supabase
        .from('expenses')
        .delete()
        .eq('id', id);

    if (forceRawson) {
        query = query.eq('branch', 'Rawson');
    }

    const { error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
    try {
        const user = await getSessionUser(request);
        const forceRawson = isEzeRawsonUser(user?.email);
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        if (forceRawson) {
            updates.branch = 'Rawson';
        }

        let query = supabase
            .from('expenses')
            .update(updates)
            .eq('id', id);

        if (forceRawson) {
            query = query.eq('branch', 'Rawson');
        }

        const { data, error } = await query.select();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
