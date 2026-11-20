import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'vyper-admin-token-v2';
const LEGACY_COOKIE_NAME = 'vyper-admin-token';
const SESSION_VERSION = 'v2';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (not /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      // Clear any legacy open session cookie so old sessions of fer@growlabs.com are closed
      response.cookies.set(LEGACY_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return response;
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'fallback-secret-key'
      );
      const { payload } = await jwtVerify(token, secret);

      if (payload.ver !== SESSION_VERSION) {
        throw new Error('Expired session version');
      }

      const email = String(payload.email || '').toLowerCase().trim();
      // Restriction for eze@growlabs.com: cannot access CRM, Cheques, or Usuarios
      if (
        email === 'eze@growlabs.com' &&
        (pathname.startsWith('/admin/crm') ||
          pathname.startsWith('/admin/cheques') ||
          pathname.startsWith('/admin/usuarios'))
      ) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      return NextResponse.next();
    } catch {
      // Token invalid or expired
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      // Clear both v2 and legacy cookies
      response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
      response.cookies.set(LEGACY_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
