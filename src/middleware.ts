import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { ADMIN_JWT_COOKIE, getJwtSecretBytes } from '@/lib/admin-session';

function adminSecretOrNull(): Uint8Array | null {
  try {
    return getJwtSecretBytes();
  } catch (error) {
    console.log('Middleware JWT verify failed:', error);
    return null;
  }
}

async function isValidAdmin(request: NextRequest): Promise<boolean> {
  const secret = adminSecretOrNull();
  if (!secret) return false;
  const token = request.cookies.get(ADMIN_JWT_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch (error) {
    console.log('Middleware JWT verify failed:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (pathname === '/api/admin/login' || pathname === '/api/admin/logout') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/admin')) {
    if (!(await isValidAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    if (!(await isValidAdmin(request))) {
      const login = new URL('/admin/login', request.url);
      login.searchParams.set('from', pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  if (pathname === '/api/orders' && request.method === 'GET') {
    if (!(await isValidAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  const statusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (statusMatch && request.method === 'PATCH') {
    if (!(await isValidAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  const orderGetMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
  if (orderGetMatch && request.method === 'GET') {
    if (await isValidAdmin(request)) {
      return NextResponse.next();
    }
    const token = request.nextUrl.searchParams.get('token');
    if (!token || !token.trim()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/orders', '/api/orders/:id', '/api/orders/:id/status'],
};
