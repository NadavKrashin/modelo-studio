import type { NextResponse } from 'next/server';

/**
 * Admin auth is intentionally disabled.
 *
 * The admin area is public; all admin API routes should be accessible to anyone.
 * Keeping this shim avoids touching every route handler.
 */
export async function requireAdminAuth(): Promise<NextResponse | null> {
  return null;
}
