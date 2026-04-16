import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { CLIENT_JWT_COOKIE } from '@/lib/client-session';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(CLIENT_JWT_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
