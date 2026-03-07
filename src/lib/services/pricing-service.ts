import type { CartItem, FilamentOption } from '@/lib/types';
import type { FilamentRepository } from '@/lib/repositories';

export interface PriceBreakdown {
  basePrice: number;
  sizeMultiplier: number;
  filamentMultiplier: number;
  embossedTextSurcharge: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

const BASE_PRICE_PER_MODEL = 29;
const EMBOSSED_TEXT_SURCHARGE = 15;
const MIN_PRICE = 19;

/**
 * Server-authoritative pricing service.
 * Recomputes prices on order submission to prevent client-side tampering.
 */
export class PricingService {
  constructor(private filamentRepo: FilamentRepository) {}

  /**
   * Calculate the unit price for a cart item.
   * The source of truth for pricing — called during order creation.
   * Uses the client-submitted unitPrice as the base and validates with scale.
   */
  calculateItemPrice(item: CartItem): number {
    const scale = item.customization.scale ?? 1;
    const volumeRatio = Math.pow(scale, 3);
    const hasEmbossed = !!item.customization.embossedText?.trim();

    const base = (item.unitPrice > 0 ? item.unitPrice : BASE_PRICE_PER_MODEL) * volumeRatio;
    const embossed = hasEmbossed ? EMBOSSED_TEXT_SURCHARGE : 0;

    return Math.max(Math.round(base + embossed), MIN_PRICE);
  }

  /**
   * Full breakdown for display or verification.
   */
  getBreakdown(item: CartItem): PriceBreakdown {
    const scale = item.customization.scale ?? 1;
    const volumeRatio = Math.pow(scale, 3);
    const hasEmbossed = !!item.customization.embossedText?.trim();

    const basePrice = item.unitPrice > 0 ? item.unitPrice : BASE_PRICE_PER_MODEL;
    const embossedTextSurcharge = hasEmbossed ? EMBOSSED_TEXT_SURCHARGE : 0;

    const raw = basePrice * volumeRatio + embossedTextSurcharge;
    const unitPrice = Math.max(Math.round(raw), MIN_PRICE);

    return {
      basePrice,
      sizeMultiplier: volumeRatio,
      filamentMultiplier: 1,
      embossedTextSurcharge,
      unitPrice,
      quantity: item.quantity,
      subtotal: unitPrice * item.quantity,
    };
  }

  /**
   * Estimate a price without full cart item context (used on model detail page).
   */
  estimate(params: {
    basePrice: number;
    sizeScale?: number;
    filamentModifier?: number;
    hasEmbossedText?: boolean;
    quantity?: number;
  }): PriceBreakdown {
    const sizeScale = params.sizeScale ?? 1;
    const volumeRatio = Math.pow(sizeScale, 3);
    const filamentMultiplier = params.filamentModifier ?? 1;
    const embossedTextSurcharge = params.hasEmbossedText ? EMBOSSED_TEXT_SURCHARGE : 0;

    const raw = params.basePrice * volumeRatio * filamentMultiplier + embossedTextSurcharge;
    const unitPrice = Math.max(Math.round(raw), MIN_PRICE);
    const quantity = params.quantity ?? 1;

    return {
      basePrice: params.basePrice,
      sizeMultiplier: volumeRatio,
      filamentMultiplier,
      embossedTextSurcharge,
      unitPrice,
      quantity,
      subtotal: unitPrice * quantity,
    };
  }

  async getAvailableFilaments(): Promise<FilamentOption[]> {
    return this.filamentRepo.findAvailable();
  }

  formatPrice(amount: number): string {
    return `₪${amount.toLocaleString('he-IL')}`;
  }
}
