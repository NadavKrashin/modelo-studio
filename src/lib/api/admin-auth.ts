import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_JWT_COOKIE, verifyAdminJwt } from '@/lib/admin-session';

export async function requireAdminAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_JWT_COOKIE)?.value;

  if (!adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await verifyAdminJwt(adminToken);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
