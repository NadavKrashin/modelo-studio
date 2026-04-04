/** Document path: `settings/pricing` */
export const PRICING_SETTINGS_DOC_ID = 'pricing';

export interface GlobalPricingSettings {
  shippingCost: number;
  acrylicCoverCost: number;
  bundleDiscountPerExtraCity: number;
  sportRouteFrameAddonCost: number;
  personalCustomBasePrice: number;
  studioEmbossedTextSurcharge: number;
  studioMinUnitPrice: number;
}

/** Used when Admin is off, document missing, or as form defaults (dev). */
export const PRICING_SETTINGS_DEV_FALLBACK: GlobalPricingSettings = {
  shippingCost: 35,
  acrylicCoverCost: 150,
  bundleDiscountPerExtraCity: 20,
  sportRouteFrameAddonCost: 50,
  personalCustomBasePrice: 199,
  studioEmbossedTextSurcharge: 8,
  studioMinUnitPrice: 10,
};
