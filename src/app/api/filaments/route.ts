import { NextResponse } from 'next/server';
import { getFilamentService } from '@/lib/services/container';

export async function GET() {
  try {
    const service = getFilamentService();
    const filaments = await service.getAvailableFilaments();
    return NextResponse.json(filaments);
  } catch (err) {
    console.error('[API] Filaments fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
