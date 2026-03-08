import type { Category } from '@/lib/types';

const slugToIdMap = new Map<string, string>();
const idToSlugMap = new Map<string, string>();

/**
 * Resolves a URL slug (e.g. 'home-decor') to the internal category ID ('cat-home-decor').
 * Returns undefined if the slug is not recognized.
 */
export function categorySlugToId(slug: string | undefined | null): string | undefined {
  if (!slug) return undefined;
  return slugToIdMap.get(slug);
}

/**
 * Resolves a category ID (e.g. 'cat-home-decor') to the URL slug ('home-decor').
 */
export function categoryIdToSlug(id: string): string | undefined {
  return idToSlugMap.get(id);
}

export const CATEGORIES: Category[] = [
  {
    id: 'cat-home-decor',
    slug: 'home-decor',
    name: 'Home Decor',
    localizedName: 'עיצוב הבית',
    description: 'Decorative items for your home',
    localizedDescription: 'פריטי עיצוב לבית',
    iconName: 'home',
    modelCount: 0,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'cat-gadgets',
    slug: 'gadgets',
    name: 'Gadgets & Tools',
    localizedName: 'גאדג׳טים וכלים',
    description: 'Useful gadgets and everyday tools',
    localizedDescription: 'גאדג׳טים שימושיים וכלים יומיומיים',
    iconName: 'wrench',
    modelCount: 0,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'cat-toys',
    slug: 'toys',
    name: 'Toys & Games',
    localizedName: 'צעצועים ומשחקים',
    description: 'Toys, figurines and game accessories',
    localizedDescription: 'צעצועים, דמויות ואביזרי משחק',
    iconName: 'puzzle',
    modelCount: 0,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'cat-art',
    slug: 'art',
    name: 'Art & Sculpture',
    localizedName: 'אמנות ופיסול',
    description: 'Artistic models and sculptures',
    localizedDescription: 'מודלים אמנותיים ופסלים',
    iconName: 'palette',
    modelCount: 0,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'cat-office',
    slug: 'office',
    name: 'Office & Desk',
    localizedName: 'משרד ושולחן עבודה',
    description: 'Desk organizers and office accessories',
    localizedDescription: 'מארגנים ואביזרי משרד',
    iconName: 'briefcase',
    modelCount: 0,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'cat-fashion',
    slug: 'fashion',
    name: 'Fashion & Jewelry',
    localizedName: 'אופנה ותכשיטים',
    description: 'Wearable items and jewelry',
    localizedDescription: 'פריטי אופנה ותכשיטים',
    iconName: 'gem',
    modelCount: 0,
    isActive: true,
    sortOrder: 6,
  },
  {
    id: 'cat-education',
    slug: 'education',
    name: 'Education',
    localizedName: 'חינוך ולמידה',
    description: 'Educational models and learning tools',
    localizedDescription: 'מודלים חינוכיים וכלי למידה',
    iconName: 'graduation',
    modelCount: 0,
    isActive: true,
    sortOrder: 7,
  },
  {
    id: 'cat-miniatures',
    slug: 'miniatures',
    name: 'Miniatures & Figurines',
    localizedName: 'מיניאטורות ודמויות',
    description: 'Tabletop miniatures and collectible figurines',
    localizedDescription: 'מיניאטורות שולחן ודמויות אספנות',
    iconName: 'users',
    modelCount: 0,
    isActive: true,
    sortOrder: 8,
  },
  {
    id: 'cat-mechanical',
    slug: 'mechanical',
    name: 'Mechanical Parts',
    localizedName: 'חלקים מכניים',
    description: 'Functional mechanical components',
    localizedDescription: 'רכיבים מכניים פונקציונליים',
    iconName: 'cog',
    modelCount: 0,
    isActive: true,
    sortOrder: 9,
  },
  {
    id: 'cat-gifts',
    slug: 'gifts',
    name: 'Gifts & Personalized',
    localizedName: 'מתנות ופריטים אישיים',
    description: 'Personalized gifts and custom items',
    localizedDescription: 'מתנות מותאמות אישית ופריטים בהזמנה',
    iconName: 'gift',
    modelCount: 0,
    isActive: true,
    sortOrder: 10,
  },
];

for (const cat of CATEGORIES) {
  slugToIdMap.set(cat.slug, cat.id);
  idToSlugMap.set(cat.id, cat.slug);
}
