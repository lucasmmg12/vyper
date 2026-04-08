import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// GET — List all admin users (superadmin only)
export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || user.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, nombre, rol, activo, created_at, last_login')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

// POST — Create new user (superadmin only)
export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || user.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, nombre, rol } = body;

  if (!email || !password || !nombre || !rol) {
    return NextResponse.json(
      { error: 'Email, contraseña, nombre y rol son requeridos' },
      { status: 400 }
    );
  }

  if (!['administrador', 'vendedor'].includes(rol)) {
    return NextResponse.json(
      { error: 'Rol inválido. Opciones: administrador, vendedor' },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('admin_users')
    .insert([{
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      nombre,
      rol,
    }])
    .select('id, email, nombre, rol, activo, created_at')
    .single();

  if (error) {
    if (error.message.includes('duplicate')) {
      return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data }, { status: 201 });
}
