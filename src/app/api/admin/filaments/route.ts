import { NextResponse } from 'next/server';
import { getFilamentRepo } from '@/lib/services/container';

export async function GET() {
  try {
    const filamentRepo = getFilamentRepo();
    const filaments = await filamentRepo.findAll();
    return NextResponse.json(filaments);
  } catch (err) {
    console.error('[API] Admin filaments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
