import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
);

const COOKIE_NAME = 'vyper-admin-token';

export type UserRole = 'superadmin' | 'administrador' | 'vendedor';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
}

export async function createToken(user: AuthUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      nombre: payload.nombre as string,
      rol: payload.rol as UserRole,
    };
  } catch {
    return null;
  }
}

// Permission checks
export function canEdit(rol: UserRole): boolean {
  return rol === 'superadmin' || rol === 'administrador';
}

export function canManageUsers(rol: UserRole): boolean {
  return rol === 'superadmin';
}

export { COOKIE_NAME };
