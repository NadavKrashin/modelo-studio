import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_JWT_COOKIE, verifyAdminJwt } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_JWT_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const valid = await verifyAdminJwt(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/me] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
