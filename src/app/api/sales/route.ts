
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = Array.isArray(body) ? body : [body];

        const inserts = data.map((item: any) => ({
            date: item.date || new Date().toISOString(),
            observations: item.observations,
            amount: parseFloat(item.amount),
            branch: item.branch,
            month_number: item.month_number ? parseInt(item.month_number) : new Date().getMonth() + 1,
            legacy_id: item.id_ingreso?.toString() // Optional mapping from excel
        }));

        const { data: result, error } = await supabase
            .from('sales')
            .insert(inserts)
            .select();

        if (error) {
            console.error('Error recording sale:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: result.length, data: result });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    let query = supabase
        .from('sales')
        .select('*')
        .order('date', { ascending: false });

    if (limit) {
        query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sales: data });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { data, error } = await supabase
            .from('sales')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
