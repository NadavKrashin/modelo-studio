import type { Category } from '@/lib/types';
import type { CategoryRepository } from './interfaces';
import { CATEGORIES } from '@/lib/constants/categories';

export class StaticCategoryRepository implements CategoryRepository {
  async findAll(): Promise<Category[]> {
    return [...CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findActive(): Promise<Category[]> {
    return [...CATEGORIES]
      .filter((category) => category.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return CATEGORIES.find((category) => category.slug === slug) ?? null;
  }

  async findById(id: string): Promise<Category | null> {
    return CATEGORIES.find((category) => category.id === id) ?? null;
  }
}
