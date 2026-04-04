import { NextResponse } from 'next/server';
import { calculatePrice } from '@/lib/pricing/pricing-engine';
import { fetchGlobalPricingSettings } from '@/lib/firebase/pricing-settings-admin';
import { parseSearchParams } from '@/lib/validation/api-helpers';
import { priceEstimateSchema } from '@/lib/validation';
import type { FilamentOption } from '@/lib/types';

const ESTIMATE_FILAMENT: FilamentOption = {
  id: '_price_estimate_',
  name: 'estimate',
  localizedName: 'estimate',
  material: 'PLA',
  colorHex: '#000000',
  colorName: '',
  localizedColorName: '',
  priceModifier: 0,
  inStock: true,
  isPopular: false,
};

export async function GET(request: Request) {
  const result = parseSearchParams(request.url, priceEstimateSchema);
  if (result.error) return result.error;

  try {
    const settings = await fetchGlobalPricingSettings();
    const scale = result.data.sizeScale ?? 1;
    const dim = 100 * scale;
    const filamentModifier = result.data.filamentModifier ?? 0;

    const breakdown = calculatePrice({
      basePrice: result.data.basePrice,
      dimensions: { widthMm: dim, heightMm: dim, depthMm: dim },
      defaultDimensions: { widthMm: 100, heightMm: 100, depthMm: 100 },
      filamentId: ESTIMATE_FILAMENT.id,
      filamentOptions: [{ ...ESTIMATE_FILAMENT, priceModifier: filamentModifier }],
      quantity: result.data.quantity ?? 1,
      hasEmbossedText: result.data.hasEmbossedText ?? false,
      embossedTextSurcharge: settings.studioEmbossedTextSurcharge,
      minUnitPrice: settings.studioMinUnitPrice,
    });

    return NextResponse.json(breakdown);
  } catch (err) {
    console.error('[API] Pricing estimate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
