import type {
  CartItem,
  CitiesBundleCartItem,
  FilamentOption,
  SimpleCartItem,
  StudioCartItem,
} from '@/lib/types';
import type { FilamentRepository } from '@/lib/repositories';
import type { CreateOrderInput } from '@/lib/validation';
import { calculatePrice } from '@/lib/pricing/pricing-engine';
import { fetchGlobalPricingSettings, type GlobalPricingSettings } from '@/lib/firebase/pricing-settings-admin';
import {
  findCityByHebrewNameAdmin,
  getCityUnitPriceAdmin,
  getSportBasePriceAdmin,
} from '@/lib/firebase/pricing-firestore-admin';
import { findActiveCouponForCheckout } from '@/lib/firebase/coupons-admin';
import { isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import type { CitySizeKey } from '@/lib/firebase/cities';
import type { SearchService } from './search-service';

export type OrderDraftItem = CreateOrderInput['items'][number];

export class OrderPricingError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = 'OrderPricingError';
  }
}

export interface SecureOrderTotals {
  lineItems: CartItem[];
  merchandiseSubtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  couponCode?: string;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function discountFromCoupon(
  subtotal: number,
  coupon: { discountType: 'percent' | 'fixed'; value: number },
): number {
  if (subtotal <= 0) return 0;
  if (coupon.discountType === 'percent') {
    return Math.min(subtotal, roundMoney((subtotal * coupon.value) / 100));
  }
  return Math.min(subtotal, Math.max(0, coupon.value));
}

function inferCitySizeFromAttributes(attrs?: string[]): CitySizeKey {
  const line = attrs?.[1] ?? '';
  if (line.includes('10')) return 'minicube';
  if (line.includes('15')) return 'cube';
  return 'cube';
}

/**
 * Server-only pricing: Firestore settings, cities, sport catalog, filaments, and catalog models.
 */
export class PricingService {
  constructor(
    private readonly filamentRepo: FilamentRepository,
    private readonly searchService: SearchService,
  ) {}

  async getAvailableFilaments(): Promise<FilamentOption[]> {
    return this.filamentRepo.findAvailable();
  }

  formatPrice(amount: number): string {
    return `₪${amount.toLocaleString('he-IL')}`;
  }

  private async unitPriceForCitiesBundle(
    item: CitiesBundleCartItem,
    settings: GlobalPricingSettings,
  ): Promise<number> {
    if (!isFirebaseAdminConfigured()) {
      throw new OrderPricingError('Cities bundles require Firebase Admin configuration');
    }
    const n = item.cities.length;
    if (n < 1) throw new OrderPricingError('נדרשת לפחות עיר אחת בחבילה');

    let sum = 0;
    for (const c of item.cities) {
      const slug = c.slug?.trim();
      if (!slug) throw new OrderPricingError('חסר מזהה עיר בחבילה');
      sum += await getCityUnitPriceAdmin(slug, item.sizeKey);
    }

    const bundleDiscount = (n - 1) * settings.bundleDiscountPerExtraCity;
    let unit = sum - bundleDiscount;
    if (item.hasCover) unit += settings.acrylicCoverCost;
    if (unit < 0) throw new OrderPricingError('סכום חבילת ערים לא תקין');
    return roundMoney(unit);
  }

  private async unitPriceForStudioModel(
    item: StudioCartItem,
    settings: GlobalPricingSettings,
  ): Promise<number> {
    const model = await this.searchService.getModel(item.modelId);
    if (!model) {
      throw new OrderPricingError(`המודל אינו זמין: ${item.modelId}`, 403);
    }

    const filamentOptions = await this.filamentRepo.findAvailable();
    const breakdown = calculatePrice({
      basePrice: model.estimatedBasePrice,
      dimensions: item.customization.dimensions,
      defaultDimensions: model.defaultDimensions,
      filamentId: item.customization.filamentId,
      filamentOptions,
      quantity: 1,
      hasEmbossedText: !!item.customization.embossedText?.trim(),
      embossedTextSurcharge: settings.studioEmbossedTextSurcharge,
      minUnitPrice: settings.studioMinUnitPrice,
    });

    return breakdown.unitPrice;
  }

  private async unitPriceForSimpleSport(
    item: SimpleCartItem,
    settings: GlobalPricingSettings,
  ): Promise<number> {
    if (!isFirebaseAdminConfigured()) {
      throw new OrderPricingError('מוצרי ספורט דורשים הגדרת Firebase Admin');
    }
    const slug = item.sportProductSlug?.trim();
    if (!slug) {
      throw new OrderPricingError('חסר מזהה מוצר ספורט (sportProductSlug)');
    }

    let unit = await getSportBasePriceAdmin(slug);
    if (item.sportWantsFrame) {
      unit += settings.sportRouteFrameAddonCost;
    }
    return roundMoney(unit);
  }

  private async unitPriceForSimpleCities(
    item: SimpleCartItem,
    settings: GlobalPricingSettings,
  ): Promise<number> {
    if (!isFirebaseAdminConfigured()) {
      throw new OrderPricingError('מוצרי ערים דורשים הגדרת Firebase Admin');
    }

    const size: CitySizeKey = item.citySizeKey ?? inferCitySizeFromAttributes(item.attributes);

    let slug = item.citySlug?.trim();
    if (!slug) {
      const name = item.attributes?.[0]?.trim();
      if (!name) {
        throw new OrderPricingError('חסר שם עיר או slug לשורת ערים');
      }
      const resolved = await findCityByHebrewNameAdmin(name);
      if (!resolved.inStock) {
        throw new OrderPricingError('העיר אינה זמינה');
      }
      slug = resolved.slug;
    }

    return roundMoney(await getCityUnitPriceAdmin(slug, size));
  }

  private unitPriceForSimplePersonal(settings: GlobalPricingSettings): number {
    return roundMoney(settings.personalCustomBasePrice);
  }

  /**
   * Recomputes every line from Firestore / catalog, applies coupon and shipping from settings.
   */
  async calculateSecureOrderTotal(
    items: OrderDraftItem[],
    options: {
      couponCode?: string | null;
      deliveryMethod: 'shipping' | 'pickup';
    },
  ): Promise<SecureOrderTotals> {
    const settings = await fetchGlobalPricingSettings();

    const lineItems: CartItem[] = [];

    for (const item of items) {
      let unitPrice: number;

      if (item.kind === 'cities_bundle') {
        unitPrice = await this.unitPriceForCitiesBundle(item as CitiesBundleCartItem, settings);
      } else if (item.kind === 'studio_model') {
        unitPrice = await this.unitPriceForStudioModel(item as StudioCartItem, settings);
      } else if (item.kind === 'simple') {
        if (item.department === 'sport') {
          unitPrice = await this.unitPriceForSimpleSport(item as SimpleCartItem, settings);
        } else if (item.department === 'cities') {
          unitPrice = await this.unitPriceForSimpleCities(item as SimpleCartItem, settings);
        } else if (item.department === 'personal') {
          unitPrice = this.unitPriceForSimplePersonal(settings);
        } else {
          throw new OrderPricingError(`סוג מחלקה לא נתמך לתמחור: ${item.department}`);
        }
      } else {
        throw new OrderPricingError('סוג פריט לא ידוע בעגלה');
      }

      const subtotal = roundMoney(unitPrice * item.quantity);
      lineItems.push({
        ...item,
        unitPrice,
        subtotal,
      } as CartItem);
    }

    const merchandiseSubtotal = roundMoney(
      lineItems.reduce((sum, li) => sum + li.subtotal, 0),
    );

    let discountAmount = 0;
    let couponCode: string | undefined;
    const rawCoupon = options.couponCode?.trim();
    if (rawCoupon) {
      const coupon = await findActiveCouponForCheckout(rawCoupon);
      if (!coupon) {
        throw new OrderPricingError('קופון לא חוקי או שפג תוקפו', 400);
      }
      discountAmount = roundMoney(discountFromCoupon(merchandiseSubtotal, coupon));
      couponCode = coupon.code;
    }

    const afterDiscount = roundMoney(merchandiseSubtotal - discountAmount);
    const shippingCost =
      options.deliveryMethod === 'shipping' ? settings.shippingCost : 0;
    const total = roundMoney(Math.max(0, afterDiscount + shippingCost));

    return {
      lineItems,
      merchandiseSubtotal,
      discountAmount,
      shippingCost,
      total,
      ...(couponCode && discountAmount > 0 ? { couponCode } : {}),
    };
  }
}
