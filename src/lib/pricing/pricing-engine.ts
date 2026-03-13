import type { ModelDimensions, FilamentOption } from '@/lib/types';

export interface PriceCalculationInput {
  basePrice: number;
  dimensions: ModelDimensions;
  defaultDimensions: ModelDimensions;
  filamentId: string;
  filamentOptions?: FilamentOption[];
  quantity: number;
  hasEmbossedText: boolean;
}

export interface PriceBreakdown {
  basePrice: number;
  sizeMultiplier: number;
  sizeAdjustedPrice: number;
  materialModifier: number;
  embossedTextSurcharge: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  currency: string;
}

const EMBOSSED_TEXT_SURCHARGE = 8;
const MIN_PRICE = 10;

/**
 * Pricing engine for 3D print orders.
 * 
 * Extensibility points:
 * - Volume-based pricing (future: weight estimation from model geometry)
 * - Rush order multipliers
 * - Bulk discount tiers
 * - Shipping cost integration
 */
export function calculatePrice(input: PriceCalculationInput): PriceBreakdown {
  const { basePrice, dimensions, defaultDimensions, filamentId, filamentOptions, quantity, hasEmbossedText } = input;

  const volumeRatio = calculateVolumeRatio(dimensions, defaultDimensions);
  const sizeMultiplier = Math.max(0.5, volumeRatio);
  const sizeAdjustedPrice = basePrice * sizeMultiplier;

  const filament = (filamentOptions ?? []).find((f) => f.id === filamentId);
  const materialModifier = filament?.priceModifier ?? 0;

  const embossedTextSurcharge = hasEmbossedText ? EMBOSSED_TEXT_SURCHARGE : 0;

  const unitPrice = Math.max(MIN_PRICE, Math.round((sizeAdjustedPrice + materialModifier + embossedTextSurcharge) * 100) / 100);

  return {
    basePrice,
    sizeMultiplier: Math.round(sizeMultiplier * 100) / 100,
    sizeAdjustedPrice: Math.round(sizeAdjustedPrice * 100) / 100,
    materialModifier,
    embossedTextSurcharge,
    unitPrice,
    quantity,
    subtotal: Math.round(unitPrice * quantity * 100) / 100,
    currency: 'ILS',
  };
}

function calculateVolumeRatio(current: ModelDimensions, base: ModelDimensions): number {
  const currentVolume = current.widthMm * current.heightMm * current.depthMm;
  const baseVolume = base.widthMm * base.heightMm * base.depthMm;
  if (baseVolume === 0) return 1;
  return currentVolume / baseVolume;
}

export function formatPrice(amount: number): string {
  return `₪${amount.toFixed(2)}`;
}

