import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api/admin-auth';
import { ADMIN_JWT_COOKIE } from '@/lib/admin-session';

export async function POST() {
  const unauthorized = await requireAdminAuth();
  if (unauthorized) return unauthorized;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_JWT_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
