import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { ADMIN_JWT_COOKIE, createAdminJwt } from '@/lib/admin-session';

function verifyAdminPassword(attempt: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? '';
  if (!expected) return false;
  const a = Buffer.from(attempt, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    console.error('[admin/login] ADMIN_PASSWORD is not configured.');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 503 });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log(
    'Login Attempt - Provided pass length:',
    body.password?.length,
    'Server pass exists:',
    !!process.env.ADMIN_PASSWORD,
  );

  const password = typeof body.password === 'string' ? body.password : '';
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  let token: string;
  try {
    token = await createAdminJwt();
  } catch (e) {
    console.error('[admin/login] JWT issue:', e);
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_JWT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
