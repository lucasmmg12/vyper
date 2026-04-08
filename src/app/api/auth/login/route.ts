import { NextRequest, NextResponse } from 'next/server';
import { createToken, COOKIE_NAME } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email y contraseña son requeridos' },
      { status: 400 }
    );
  }

  // Find user in admin_users table
  const { data: user, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('activo', true)
    .single();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Credenciales incorrectas' },
      { status: 401 }
    );
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return NextResponse.json(
      { error: 'Credenciales incorrectas' },
      { status: 401 }
    );
  }

  // Update last login
  await supabase
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  // Create JWT with user info and role
  const token = await createToken({
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
  });

  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    },
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return response;
}
