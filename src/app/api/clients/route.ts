
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort'); // 'coins', 'debt', 'recent'
    const limit = searchParams.get('limit') || '50';
    const search = searchParams.get('search');

    let query = supabase
        .from('users')
        .select('*');

    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    if (sort === 'coins') {
        query = query.order('coin_balance', { ascending: false });
    } else if (sort === 'debt') {
        query = query.order('debt_balance', { ascending: false }); // Highest debt first
    } else {
        query = query.order('created_at', { ascending: false });
    }

    query = query.limit(parseInt(limit));

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ clients: data });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Support bulk or single
        const data = Array.isArray(body) ? body : [body];

        // Helper to convert boolean values from Excel
        const toBool = (val: any): boolean => {
            if (val === undefined || val === null || val === '') return true;
            if (typeof val === 'boolean') return val;
            if (typeof val === 'string') {
                const lower = val.toLowerCase().trim();
                return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'si';
            }
            return Boolean(val);
        };

        const inserts = data.map((item: any) => ({
            client_id: item.client_id?.toString() || item.ClienteID?.toString() || Math.floor(Math.random() * 1000000).toString(),
            name: item.name || item.Nombre,
            last_load_date: item.last_load_date || item['Fecha de Ultima carga'] || new Date().toISOString(),
            observations: item.observations || item.Observaciones,
            phone: item.phone?.toString() || item.Telefono?.toString(),
            user_password: item.user_password || item['UsuarioContraseña'] || item.UsuarioContraseña,
            user_view: toBool(item.user_view ?? item.UsuarioVer),
            user_photo: item.user_photo || item.UsuarioFoto,
            user_profile: item.user_profile || item.UsuarioPerfil || 'CLIENT',
            user_status: toBool(item.user_status ?? item.UsuarioStatus),
            coin_balance: parseInt(item.coin_balance || item['Cantidad de Monedas'] || item.coins || 0),
            image_url: item.image_url || item.Imagen,
            debt_balance: parseFloat(item.debt_balance || item['Cta Cte'] || item.debt || 0)
        }));

        // Deduplicate by phone number (keep last occurrence)
        const uniqueInserts = Array.from(
            inserts.reduce((map, item) => {
                if (item.phone) {
                    map.set(item.phone, item);
                }
                return map;
            }, new Map()).values()
        );

        console.log(`Original records: ${inserts.length}, After deduplication: ${uniqueInserts.length}`);

        const { data: result, error } = await supabase
            .from('users')
            .upsert(uniqueInserts, { onConflict: 'phone' }) // Upsert based on phone to avoid duplicates on import
            .select();

        if (error) {
            console.error('Error creating clients:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: result.length, data: result });
    } catch (error: any) {
        console.error('POST /api/clients error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { data, error } = await supabase
            .from('users')
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
            .from('users')
            .delete()
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
