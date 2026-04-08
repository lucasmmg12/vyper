import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// PUT — Update user (superadmin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || user.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  if (body.nombre !== undefined) updateData.nombre = body.nombre;
  if (body.rol !== undefined) {
    if (!['administrador', 'vendedor'].includes(body.rol)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }
    updateData.rol = body.rol;
  }
  if (body.activo !== undefined) updateData.activo = body.activo;
  if (body.password) {
    updateData.password_hash = await bcrypt.hash(body.password, 10);
  }

  const { data, error } = await supabase
    .from('admin_users')
    .update(updateData)
    .eq('id', id)
    .select('id, email, nombre, rol, activo, created_at, last_login')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

// DELETE — Delete user (superadmin only, cannot delete self)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || user.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  if (user.id === id) {
    return NextResponse.json({ error: 'No podés eliminar tu propia cuenta' }, { status: 400 });
  }

  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
