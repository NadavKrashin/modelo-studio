import { NextResponse } from 'next/server';
import { getPricingService } from '@/lib/services/container';

export async function GET() {
  try {
    const pricing = getPricingService();
    const filaments = await pricing.getAvailableFilaments();
    return NextResponse.json(filaments);
  } catch (err) {
    console.error('[API] Filaments fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
