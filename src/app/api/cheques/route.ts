import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import {
    normalizeArgentinePhone,
    sendDirectWhatsAppMessage,
    sendWhatsAppTemplate,
} from '@/lib/builderbot';
import { COOKIE_NAME, verifyToken, isEzeRawsonUser } from '@/lib/auth';

const db = supabaseAdmin || supabase;

const CONFIG_KEY_CHEQUES = 'vyper_cheques_registry';
const CONFIG_KEY_RAZONES = 'vyper_cheques_razones_sociales';
const CONFIG_KEY_BANCOS = 'vyper_cheques_bancos';

export interface ChequeItem {
    id: string;
    nro_cheque: string;
    banco: string;
    direccion: 'emitido' | 'recibido';
    tipo: 'fisico' | 'echeq';
    razon_social_emisora: string;
    beneficiario: string;
    factura_asociada?: string;
    monto: number;
    fecha_emision: string;
    fecha_vencimiento: string;
    estado: 'pendiente' | 'pagado';
    scan_url?: string | null;
    notas?: string;
    created_at: string;
    updated_at: string;
}

const DEFAULT_RAZONES_SOCIALES: string[] = [
    'VYPER LABS',
    'ECAR SAS',
    'CARLOS ADOLFO REGALADO',
    'LUCAS MARINERO',
];

const DEFAULT_BANCOS: string[] = [
    'Banco Macro',
    'Banco San Juan',
    'Banco Santander',
    'Banco Galicia',
    'BBVA',
    'Banco Nación',
    'Banco Provincia',
    'Banco Credicoop',
    'ICBC',
    'Banco Patagonia',
];

// Los 12 cheques por defecto de la 4ta foto (hoja manuscrita)
const DEFAULT_CHEQUES_SEED: ChequeItem[] = [
    {
        id: 'seed-chq-01',
        nro_cheque: '2111-A',
        banco: 'Banco San Juan',
        direccion: 'emitido',
        tipo: 'echeq',
        razon_social_emisora: 'VYPER LABS',
        beneficiario: 'GENETIC',
        factura_asociada: 'Lote Noviembre (1/2)',
        monto: 811422.0,
        fecha_emision: '2026-11-01',
        fecha_vencimiento: '2026-11-21',
        estado: 'pendiente',
        scan_url: null,
        notas: 'Lote 21/11 + 23/11 ($1.667.876,50)',
        created_at: '2026-11-01T10:00:00.000Z',
        updated_at: '2026-11-01T10:00:00.000Z',
    },
    {
        id: 'seed-chq-02',
        nro_cheque: '2311-B',
        banco: 'Banco San Juan',
        direccion: 'emitido',
        tipo: 'echeq',
        razon_social_emisora: 'VYPER LABS',
        beneficiario: 'GENETIC',
        factura_asociada: 'Lote Noviembre (2/2)',
        monto: 856454.5,
        fecha_emision: '2026-11-01',
        fecha_vencimiento: '2026-11-23',
        estado: 'pendiente',
        scan_url: null,
        notas: 'Lote 21/11 + 23/11 ($1.667.876,50)',
        created_at: '2026-11-01T10:01:00.000Z',
        updated_at: '2026-11-01T10:01:00.000Z',
    },
    {
        id: 'seed-chq-03',
        nro_cheque: '2111-GEN',
        banco: 'Banco San Juan',
        direccion: 'emitido',
        tipo: 'echeq',
        razon_social_emisora: 'VYPER LABS',
        beneficiario: 'GENETIC',
        factura_asociada: '',
        monto: 1688810.0,
        fecha_emision: '2026-11-01',
        fecha_vencimiento: '2026-11-21',
        estado: 'pendiente',
        scan_url: null,
        notas: 'Cheque 21/11 -> Genetic',
        created_at: '2026-11-01T10:02:00.000Z',
        updated_at: '2026-11-01T10:02:00.000Z',
    },
    {
        id: 'seed-chq-04',
        nro_cheque: '0212-SCI',
        banco: 'Banco San Juan',
        direccion: 'emitido',
        tipo: 'echeq',
        razon_social_emisora: 'VYPER LABS',
        beneficiario: 'SCIMMIA',
        factura_asociada: 'Cheque Diciembre (1/4)',
        monto: 1045577.6,
        fecha_emision: '2026-11-15',
        fecha_vencimiento: '2026-12-02',
        estado: 'pendiente',
        scan_url: null,
        notas: 'Cheque diciembre - SCIMMIA',
        created_at: '2026-11-15T10:03:00.000Z',
        updated_at: '2026-11-15T10:03:00.000Z',
    },
    {
        id: 'seed-chq-05',
        nro_cheque: '0612-SCI',
        banco: 'Banco San Juan',
        direccion: 'emitido',
        tipo: 'echeq',
        razon_social_emisora: 'VYPER LABS',
        beneficiario: 'SCIMMIA',
        factura_asociada: 'Cheque Diciembre (2/4)',
        monto: 1676444.0,
        fecha_emision: '2026-11-15',
        fecha_vencimiento: '2026-12-06',
        estado: 'pendiente',
        scan_url: null,
        notas: 'Cheque diciembre - SCIMMIA',
        created_at: '2026-11-15T10:04:00.000Z',
        updated_at: '2026-11-15T10:04:00.000Z',
    },
    {
        id: 'seed-chq-06',
        nro_cheque: '0712-SCI',
        banco: 'Banco San Juan',
        direccion: 'emitido',
        tipo: 'echeq',
        razon_social_emisora: 'VYPER LABS',
        beneficiario: 'SCIMMIA',
        factura_asociada: 'Cheque Diciembre (3/4)',
        monto: 1481476.55,
        fecha_emision: '2026-11-15',
        fecha_vencimiento: '2026-12-07',
        estado: 'pendiente',
        scan_url: null,
        notas: 'Cheque diciembre - SCIMMIA',
        created_at: '2026-11-15T10:05:00.000Z',
        updated_at: '2026-11-15T10:05:00.000Z',
    },
    {
        id: 'seed-chq-07',
        nro_cheque: '0912-SCI',
        banco: 'Banco San Juan',
        direccion: 'emitido',
        tipo: 'echeq',
        razon_social_emisora: 'VYPER LABS',
        beneficiario: 'SCIMMIA',
        factura_asociada: 'Cheque Diciembre (4/4)',
        monto: 1242400.5,
        fecha_emision: '2026-11-15',
        fecha_vencimiento: '2026-12-09',
        estado: 'pendiente',
        scan_url: null,
        notas: 'Cheque diciembre - SCIMMIA',
        created_at: '2026-11-15T10:06:00.000Z',
        updated_at: '2026-11-15T10:06:00.000Z',
    },
    {
        id: 'seed-chq-08',
        nro_cheque: '1812-PAV',
        banco: 'Banco San Juan',
        direccion: 'emitido',
        tipo: 'echeq',
        razon_social_emisora: 'VYPER LABS',
        beneficiario: 'PAVE',
        factura_asociada: 'Pave (18/12)',
        monto: 1590242.5,
        fecha_emision: '2026-11-15',
        fecha_vencimiento: '2026-12-18',
        estado: 'pendiente',
        scan_url: null,
        notas: 'Cheque Pave 18/12',
        created_at: '2026-11-15T10:07:00.000Z',
        updated_at: '2026-11-15T10:07:00.000Z',
    },
    {
        id: 'seed-chq-09',
        nro_cheque: '1801-PAV',
        banco: 'Banco San Juan',
        direccion: 'emitido',
        tipo: 'echeq',
        razon_social_emisora: 'VYPER LABS',
        beneficiario: 'PAVE',
        factura_asociada: 'Pave (18/01)',
        monto: 1590242.5,
        fecha_emision: '2026-11-15',
        fecha_vencimiento: '2027-01-18',
        estado: 'pendiente',
        scan_url: null,
        notas: 'Cheque Pave 18/01',
        created_at: '2026-11-15T10:08:00.000Z',
        updated_at: '2026-11-15T10:08:00.000Z',
    },
    {
        id: 'seed-chq-10',
        nro_cheque: '0101-ANG',
        banco: 'Banco San Juan',
        direccion: 'emitido',
        tipo: 'echeq',
        razon_social_emisora: 'VYPER LABS',
        beneficiario: 'ANGACO',
        factura_asociada: 'Angaco (1/3)',
        monto: 1500000.0,
        fecha_emision: '2026-11-15',
        fecha_vencimiento: '2027-01-01',
        estado: 'pendiente',
        scan_url: null,
        notas: 'Cheque Angaco 01/01',
        created_at: '2026-11-15T10:09:00.000Z',
        updated_at: '2026-11-15T10:09:00.000Z',
    },
    {
        id: 'seed-chq-11',
        nro_cheque: '1501-ANG',
        banco: 'Banco San Juan',
        direccion: 'emitido',
        tipo: 'echeq',
        razon_social_emisora: 'VYPER LABS',
        beneficiario: 'ANGACO',
        factura_asociada: 'Angaco (2/3)',
        monto: 3152013.0,
        fecha_emision: '2026-11-15',
        fecha_vencimiento: '2027-01-15',
        estado: 'pendiente',
        scan_url: null,
        notas: 'Cheque Angaco 15/01/27',
        created_at: '2026-11-15T10:10:00.000Z',
        updated_at: '2026-11-15T10:10:00.000Z',
    },
    {
        id: 'seed-chq-12',
        nro_cheque: '0202-ANG',
        banco: 'Banco San Juan',
        direccion: 'emitido',
        tipo: 'echeq',
        razon_social_emisora: 'VYPER LABS',
        beneficiario: 'ANGACO',
        factura_asociada: 'Angaco (3/3)',
        monto: 2180100.0,
        fecha_emision: '2026-11-15',
        fecha_vencimiento: '2027-02-02',
        estado: 'pendiente',
        scan_url: null,
        notas: 'Cheque Angaco 02/02/27',
        created_at: '2026-11-15T10:11:00.000Z',
        updated_at: '2026-11-15T10:11:00.000Z',
    },
];

async function getStoredCheques(): Promise<ChequeItem[]> {
    const { data } = await db
        .from('configuraciones')
        .select('valor')
        .eq('clave', CONFIG_KEY_CHEQUES)
        .maybeSingle();

    if (Array.isArray(data?.valor) && data.valor.length > 0) {
        return data.valor as ChequeItem[];
    }

    // Seed initially with the 12 default cheques from Photo 4
    await db.from('configuraciones').upsert(
        {
            clave: CONFIG_KEY_CHEQUES,
            valor: DEFAULT_CHEQUES_SEED,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'clave' }
    );
    return DEFAULT_CHEQUES_SEED;
}

async function saveStoredCheques(list: ChequeItem[]) {
    await db.from('configuraciones').upsert(
        {
            clave: CONFIG_KEY_CHEQUES,
            valor: list,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'clave' }
    );
}

async function getStoredRazones(): Promise<string[]> {
    const { data } = await db
        .from('configuraciones')
        .select('valor')
        .eq('clave', CONFIG_KEY_RAZONES)
        .maybeSingle();

    if (Array.isArray(data?.valor) && data.valor.length > 0) {
        return data.valor as string[];
    }

    await db.from('configuraciones').upsert(
        {
            clave: CONFIG_KEY_RAZONES,
            valor: DEFAULT_RAZONES_SOCIALES,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'clave' }
    );
    return DEFAULT_RAZONES_SOCIALES;
}

async function saveStoredRazones(list: string[]) {
    await db.from('configuraciones').upsert(
        {
            clave: CONFIG_KEY_RAZONES,
            valor: list,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'clave' }
    );
}

async function getStoredBancos(): Promise<string[]> {
    const { data } = await db
        .from('configuraciones')
        .select('valor')
        .eq('clave', CONFIG_KEY_BANCOS)
        .maybeSingle();

    if (Array.isArray(data?.valor) && data.valor.length > 0) {
        const stored = data.valor as string[];
        if (!stored.some(b => b.toLowerCase() === 'banco macro')) {
            const updated = ['Banco Macro', ...stored];
            await saveStoredBancos(updated);
            return updated;
        }
        return stored;
    }

    await db.from('configuraciones').upsert(
        {
            clave: CONFIG_KEY_BANCOS,
            valor: DEFAULT_BANCOS,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'clave' }
    );
    return DEFAULT_BANCOS;
}

async function saveStoredBancos(list: string[]) {
    await db.from('configuraciones').upsert(
        {
            clave: CONFIG_KEY_BANCOS,
            valor: list,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'clave' }
    );
}

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get(COOKIE_NAME)?.value;
        const sessionUser = token ? await verifyToken(token) : null;
        if (sessionUser && isEzeRawsonUser(sessionUser.email)) {
            return NextResponse.json({ ok: false, error: 'Acceso restringido' }, { status: 403 });
        }
        const [cheques, razonesSociales, bancos, comprasRes] = await Promise.all([
            getStoredCheques(),
            getStoredRazones(),
            getStoredBancos(),
            db
                .from('compras')
                .select('id, proveedor, numero_factura, total, fecha')
                .order('created_at', { ascending: false })
                .limit(100),
        ]);

        // Sort cheques by fecha_vencimiento ascending
        const sorted = [...cheques].sort((a, b) =>
            (a.fecha_vencimiento || '').localeCompare(b.fecha_vencimiento || '')
        );

        return NextResponse.json({
            ok: true,
            cheques: sorted,
            razonesSociales,
            bancos,
            facturasDisponibles: comprasRes.data || [],
        });
    } catch (error: any) {
        console.error('[API /api/cheques GET] Error:', error);
        return NextResponse.json(
            { ok: false, error: error?.message || 'Error obteniendo cheques' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get(COOKIE_NAME)?.value;
        const sessionUser = token ? await verifyToken(token) : null;
        if (sessionUser && isEzeRawsonUser(sessionUser.email)) {
            return NextResponse.json({ ok: false, error: 'Acceso restringido' }, { status: 403 });
        }
        const body = await request.json();
        const { action = 'create' } = body;

        // 1. Crear o eliminar Razón Social Emisora
        if (action === 'add_razon_social') {
            const nombre = String(body.nombre || '')
                .trim()
                .toUpperCase();
            if (!nombre) {
                return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
            }
            const current = await getStoredRazones();
            if (!current.includes(nombre)) {
                current.push(nombre);
                await saveStoredRazones(current);
            }
            return NextResponse.json({ ok: true, razonesSociales: current });
        }

        if (action === 'delete_razon_social') {
            const nombre = String(body.nombre || '').trim();
            const current = await getStoredRazones();
            const filtered = current.filter(r => r !== nombre);
            await saveStoredRazones(filtered.length > 0 ? filtered : DEFAULT_RAZONES_SOCIALES);
            return NextResponse.json({
                ok: true,
                razonesSociales: filtered.length > 0 ? filtered : DEFAULT_RAZONES_SOCIALES,
            });
        }

        // 1b. Crear o eliminar Banco
        if (action === 'add_banco') {
            const nombre = String(body.nombre || '').trim();
            if (!nombre) {
                return NextResponse.json({ error: 'Nombre de banco requerido' }, { status: 400 });
            }
            const current = await getStoredBancos();
            if (!current.some(b => b.toLowerCase() === nombre.toLowerCase())) {
                current.push(nombre);
                await saveStoredBancos(current);
            }
            return NextResponse.json({ ok: true, bancos: current });
        }

        if (action === 'delete_banco') {
            const nombre = String(body.nombre || '').trim();
            const current = await getStoredBancos();
            const filtered = current.filter(b => b !== nombre);
            await saveStoredBancos(filtered.length > 0 ? filtered : DEFAULT_BANCOS);
            return NextResponse.json({
                ok: true,
                bancos: filtered.length > 0 ? filtered : DEFAULT_BANCOS,
            });
        }

        const currentCheques = await getStoredCheques();

        // 2. Alternar Estado (pendiente <-> pagado)
        if (action === 'toggle_estado') {
            const { id } = body;
            const updated = currentCheques.map(c =>
                c.id === id
                    ? {
                          ...c,
                          estado: (c.estado === 'pagado' ? 'pendiente' : 'pagado') as
                              | 'pendiente'
                              | 'pagado',
                          updated_at: new Date().toISOString(),
                      }
                    : c
            );
            await saveStoredCheques(updated);
            return NextResponse.json({ ok: true, cheques: updated });
        }

        // 3. Actualizar scan_url (Foto / PDF del cheque)
        if (action === 'update_scan') {
            const { id, scan_url } = body;
            const updated = currentCheques.map(c =>
                c.id === id
                    ? { ...c, scan_url: scan_url || null, updated_at: new Date().toISOString() }
                    : c
            );
            await saveStoredCheques(updated);
            return NextResponse.json({ ok: true, cheques: updated });
        }

        // 4. Eliminar Cheque
        if (action === 'delete') {
            const { id } = body;
            const filtered = currentCheques.filter(c => c.id !== id);
            await saveStoredCheques(filtered);
            return NextResponse.json({ ok: true, cheques: filtered });
        }

        // 5. Restaurar los 12 cheques por defecto de la Foto 4 ( si el usuario quiere resetear/agregar lote)
        if (action === 'restore_defaults') {
            const existingIds = new Set(currentCheques.map(c => c.id));
            const merged = [
                ...currentCheques,
                ...DEFAULT_CHEQUES_SEED.filter(d => !existingIds.has(d.id)),
            ];
            await saveStoredCheques(merged);
            return NextResponse.json({ ok: true, cheques: merged });
        }

        // 5b. Enviar Recordatorio de Pago de Cheque(s) por WhatsApp (Bot / Meta Template)
        if (action === 'send_whatsapp_reminder') {
            const targetPhone = normalizeArgentinePhone(
                body.phone || process.env.OWNER_PHONE || '5492645438114'
            );
            const chequeId = body.id;
            const pendingList = currentCheques
                .filter(c => c.estado === 'pendiente' && c.direccion === 'emitido')
                .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento));

            const itemsToRemind = chequeId
                ? currentCheques.filter(c => c.id === chequeId)
                : pendingList.slice(0, 6);

            if (itemsToRemind.length === 0) {
                return NextResponse.json(
                    { ok: false, error: 'No hay cheques pendientes para recordar' },
                    { status: 400 }
                );
            }

            const totalRemind = itemsToRemind.reduce((s, c) => s + Number(c.monto || 0), 0);
            const detailLines = itemsToRemind
                .map(
                    c =>
                        `• *${c.fecha_vencimiento}* — *${c.beneficiario || 'PROVEEDOR'}*: $${Number(
                            c.monto
                        ).toLocaleString('es-AR', { minimumFractionDigits: 2 })} (${c.banco} #${
                            c.nro_cheque
                        } · Emisor: ${c.razon_social_emisora})`
                )
                .join('\n');

            const fullText = `🔔 *RECORDATORIO DE VENCIMIENTO DE CHEQUES (VYPER LABS)*\n\n${detailLines}\n\n💰 *Total en aviso:* $${totalRemind.toLocaleString(
                'es-AR',
                { minimumFractionDigits: 2 }
            )}\n📉 *Deuda Total Pendiente en Cheques:* $${pendingList
                .reduce((s, c) => s + Number(c.monto || 0), 0)
                .toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

            // Intentar mensaje directo primero; si falla (ventana 24h cerrada), usar plantilla oficial Meta
            const directRes = await sendDirectWhatsAppMessage({
                to: targetPhone,
                content: fullText,
                senderName: 'Recordatorio Cheques Vyper',
            });

            if (directRes.ok) {
                return NextResponse.json({ ok: true, method: 'direct', phone: targetPhone });
            }

            const tplRes = await sendWhatsAppTemplate({
                to: targetPhone,
                templateName: 'vyper_notificacion_general',
                languageCode: 'es_AR',
                parameters: [
                    'Administración Vyper',
                    `Recordatorio de Pago de Cheques ($${totalRemind.toLocaleString('es-AR')})`,
                    itemsToRemind
                        .map(
                            c =>
                                `${c.fecha_vencimiento}: ${c.beneficiario || 'Cheque'} $${Number(
                                    c.monto
                                ).toLocaleString('es-AR')}`
                        )
                        .join(' | '),
                    'Recordá cubrir los fondos en cuenta bancaria antes del vencimiento.',
                ],
                renderedText: fullText,
            });

            return NextResponse.json({
                ok: tplRes.ok,
                method: 'template',
                phone: targetPhone,
                error: tplRes.error,
            });
        }

        // 6. Crear o Editar Cheque
        const {
            id,
            nro_cheque,
            banco,
            direccion = 'emitido',
            tipo = 'fisico',
            razon_social_emisora = 'VYPER LABS',
            beneficiario = '',
            factura_asociada = '',
            monto,
            fecha_emision,
            fecha_vencimiento,
            estado = 'pendiente',
            scan_url = null,
            notas = '',
        } = body;

        if (!nro_cheque || !fecha_vencimiento || monto === undefined || monto === '') {
            return NextResponse.json(
                { error: 'Nro. de Cheque, Monto y Vencimiento son obligatorios' },
                { status: 400 }
            );
        }

        // Si la razón social ingresada es nueva, agregarla automáticamente al dropdown
        const cleanRazon = String(razon_social_emisora || 'VYPER LABS')
            .trim()
            .toUpperCase();
        const currentRazones = await getStoredRazones();
        if (cleanRazon && !currentRazones.includes(cleanRazon)) {
            currentRazones.push(cleanRazon);
            await saveStoredRazones(currentRazones);
        }

        // Si el banco ingresado es nuevo, agregarlo automáticamente al dropdown
        const cleanBanco = String(banco || 'Banco Macro').trim();
        const currentBancos = await getStoredBancos();
        if (cleanBanco && !currentBancos.some(b => b.toLowerCase() === cleanBanco.toLowerCase())) {
            currentBancos.push(cleanBanco);
            await saveStoredBancos(currentBancos);
        }

        const nowIso = new Date().toISOString();

        if (id) {
            const updated = currentCheques.map(c =>
                c.id === id
                    ? {
                          ...c,
                          nro_cheque: String(nro_cheque).trim(),
                          banco: String(banco || 'Banco San Juan').trim(),
                          direccion: direccion === 'recibido' ? 'recibido' : 'emitido',
                          tipo: tipo === 'echeq' ? 'echeq' : 'fisico',
                          razon_social_emisora: cleanRazon,
                          beneficiario: String(beneficiario || '').trim().toUpperCase(),
                          factura_asociada: String(factura_asociada || '').trim(),
                          monto: Number(monto),
                          fecha_emision: fecha_emision || c.fecha_emision,
                          fecha_vencimiento,
                          estado: estado === 'pagado' ? 'pagado' : 'pendiente',
                          scan_url: scan_url !== undefined ? scan_url : c.scan_url,
                          notas: String(notas || '').trim(),
                          updated_at: nowIso,
                      }
                    : c
            );
            await saveStoredCheques(updated);
            return NextResponse.json({
                ok: true,
                cheques: updated,
                razonesSociales: currentRazones,
            });
        } else {
            const newCheque: ChequeItem = {
                id: `chq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                nro_cheque: String(nro_cheque).trim(),
                banco: String(banco || 'Banco San Juan').trim(),
                direccion: direccion === 'recibido' ? 'recibido' : 'emitido',
                tipo: tipo === 'echeq' ? 'echeq' : 'fisico',
                razon_social_emisora: cleanRazon,
                beneficiario: String(beneficiario || '').trim().toUpperCase(),
                factura_asociada: String(factura_asociada || '').trim(),
                monto: Number(monto),
                fecha_emision: fecha_emision || nowIso.slice(0, 10),
                fecha_vencimiento,
                estado: estado === 'pagado' ? 'pagado' : 'pendiente',
                scan_url: scan_url || null,
                notas: String(notas || '').trim(),
                created_at: nowIso,
                updated_at: nowIso,
            };

            const nextList = [...currentCheques, newCheque];
            await saveStoredCheques(nextList);
            return NextResponse.json({
                ok: true,
                cheque: newCheque,
                cheques: nextList,
                razonesSociales: currentRazones,
            });
        }
    } catch (error: any) {
        console.error('[API /api/cheques POST] Error:', error);
        return NextResponse.json(
            { ok: false, error: error?.message || 'Error guardando cheque' },
            { status: 500 }
        );
    }
}
