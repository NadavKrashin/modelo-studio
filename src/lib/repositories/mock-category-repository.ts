import type { Category } from '@/lib/types';
import type { CategoryRepository } from './interfaces';
import { CATEGORIES } from '@/lib/constants/categories';

/**
 * In-memory category repository.
 * Replace with PostgreSQL implementation for production.
 */
export class MockCategoryRepository implements CategoryRepository {
  private categories: Category[] = [...CATEGORIES];

  async findAll(): Promise<Category[]> {
    return [...this.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findActive(): Promise<Category[]> {
    return this.categories
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.categories.find((c) => c.slug === slug) ?? null;
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.find((c) => c.id === id) ?? null;
  }
}
