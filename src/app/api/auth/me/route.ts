import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await verifyToken(token);

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user,
  });
}

// PUT — Allow current logged-in user (e.g. fer@growlabs.com) to change their own password
export async function PUT(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await request.json();
  const { newPassword } = body;

  if (!newPassword || String(newPassword).trim().length < 4) {
    return NextResponse.json(
      { error: 'La nueva contraseña debe tener al menos 4 caracteres' },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(String(newPassword).trim(), 10);

  const { error } = await supabase
    .from('admin_users')
    .update({ password_hash: passwordHash })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
