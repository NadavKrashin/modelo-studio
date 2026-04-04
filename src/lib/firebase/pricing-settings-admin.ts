import { getFirestoreAdmin, isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/firestore';
import {
  PRICING_SETTINGS_DEV_FALLBACK,
  PRICING_SETTINGS_DOC_ID,
  type GlobalPricingSettings,
} from '@/lib/firebase/pricing-settings-shared';

export {
  PRICING_SETTINGS_DEV_FALLBACK,
  PRICING_SETTINGS_DOC_ID,
  type GlobalPricingSettings,
} from '@/lib/firebase/pricing-settings-shared';

function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function mergeSettings(raw: Record<string, unknown>): GlobalPricingSettings {
  const f = PRICING_SETTINGS_DEV_FALLBACK;
  return {
    shippingCost: num(raw.shippingCost, f.shippingCost),
    acrylicCoverCost: num(raw.acrylicCoverCost, f.acrylicCoverCost),
    bundleDiscountPerExtraCity: num(raw.bundleDiscountPerExtraCity, f.bundleDiscountPerExtraCity),
    sportRouteFrameAddonCost: num(raw.sportRouteFrameAddonCost, f.sportRouteFrameAddonCost),
    personalCustomBasePrice: num(raw.personalCustomBasePrice, f.personalCustomBasePrice),
    studioEmbossedTextSurcharge: num(raw.studioEmbossedTextSurcharge, f.studioEmbossedTextSurcharge),
    studioMinUnitPrice: num(raw.studioMinUnitPrice, f.studioMinUnitPrice),
  };
}

/**
 * Fetches `settings/pricing`. In production with Firebase configured, requires the document to exist.
 */
export async function fetchGlobalPricingSettings(): Promise<GlobalPricingSettings> {
  if (!isFirebaseAdminConfigured()) {
    return PRICING_SETTINGS_DEV_FALLBACK;
  }

  const snap = await getFirestoreAdmin()
    .collection(FIRESTORE_COLLECTIONS.settings)
    .doc(PRICING_SETTINGS_DOC_ID)
    .get();

  if (!snap.exists) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Firestore document settings/pricing is missing. Create it with shippingCost, acrylicCoverCost, etc.',
      );
    }
    console.warn('[pricing-settings] settings/pricing missing — using dev fallback');
    return PRICING_SETTINGS_DEV_FALLBACK;
  }

  return mergeSettings((snap.data() ?? {}) as Record<string, unknown>);
}
