import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_JWT_COOKIE, verifyAdminJwt } from '@/lib/admin-session';

/**
 * Server-side guard for admin API routes.
 * Returns `null` when the request is authenticated; otherwise returns a 401
 * `NextResponse` that the route handler should return immediately.
 *
 * Uses only `jose` (pure JS) — no `firebase-admin` dependency.
 */
export async function requireAdminAuth(): Promise<NextResponse | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_JWT_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const valid = await verifyAdminJwt(token);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return null;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
