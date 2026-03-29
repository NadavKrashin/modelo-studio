export type SportProductCategory = 'medal_hanger' | 'city_route' | 'data_hex' | 'other';

export interface SportProduct {
  id: string;
  nameHe: string;
  slug: string;
  category: SportProductCategory;
  basePrice: number;
  isActive: boolean;
  /** Optional explicit thumbnail URL (otherwise derived from Storage). */
  imageUrl?: string;
}
