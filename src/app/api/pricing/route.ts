import { NextResponse } from 'next/server';
import { getPricingService } from '@/lib/services/container';
import { parseSearchParams } from '@/lib/validation/api-helpers';
import { priceEstimateSchema } from '@/lib/validation';

export async function GET(request: Request) {
  const result = parseSearchParams(request.url, priceEstimateSchema);
  if (result.error) return result.error;

  try {
    const pricing = getPricingService();
    const breakdown = pricing.estimate({
      basePrice: result.data.basePrice,
      sizeScale: result.data.sizeScale,
      filamentModifier: result.data.filamentModifier,
      hasEmbossedText: result.data.hasEmbossedText,
      quantity: result.data.quantity,
    });

    return NextResponse.json(breakdown);
  } catch (err) {
    console.error('[API] Pricing estimate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
