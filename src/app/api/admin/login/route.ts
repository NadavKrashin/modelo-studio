import { NextResponse } from 'next/server';

// Admin login is disabled: admin area is public.
export async function POST() {
  return NextResponse.json({ ok: true });
}
