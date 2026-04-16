import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createAdminJwt, ADMIN_JWT_COOKIE } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function safeCompare(input: string, expected: string): boolean {
  const key = 'modelo-pw-cmp';
  const a = createHmac('sha256', key).update(input).digest();
  const b = createHmac('sha256', key).update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = body?.password;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      console.error('[admin/login] ADMIN_PASSWORD env var is not set');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (!safeCompare(password, expected)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createAdminJwt();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_JWT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (err) {
    console.error('[admin/login] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
