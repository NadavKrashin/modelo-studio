export interface Category {
  id: string;
  slug: string;
  name: string;
  localizedName: string;
  description: string;
  localizedDescription: string;
  iconName: string;
  modelCount: number;
  isActive: boolean;
  sortOrder: number;
}
