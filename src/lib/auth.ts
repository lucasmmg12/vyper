import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
);

// Cookie v2 invalidates all previously open browser sessions immediately
const COOKIE_NAME = 'vyper-admin-token-v2';
const LEGACY_COOKIE_NAME = 'vyper-admin-token';
const SESSION_VERSION = 'v2';

export type UserRole = 'superadmin' | 'administrador' | 'vendedor';

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  restrictedBranch?: string | null;
  hideCrmAndCheques?: boolean;
}

export function isEzeRawsonUser(email?: string | null): boolean {
  return (email || '').toLowerCase().trim() === 'eze@growlabs.com';
}

export async function createToken(user: AuthUser): Promise<string> {
  const isEze = isEzeRawsonUser(user.email);
  return await new SignJWT({
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    ver: SESSION_VERSION,
    restrictedBranch: isEze ? 'Rawson' : null,
    hideCrmAndCheques: isEze,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.ver !== SESSION_VERSION) {
      return null;
    }
    const email = (payload.email as string) || '';
    const isEze = isEzeRawsonUser(email);
    return {
      id: payload.id as string,
      email,
      nombre: payload.nombre as string,
      rol: payload.rol as UserRole,
      restrictedBranch: isEze ? 'Rawson' : null,
      hideCrmAndCheques: isEze,
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

export { COOKIE_NAME, LEGACY_COOKIE_NAME };
