'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchUiState {
  query: string;
  selectedCategory?: string;
  page: number;
  isFiltersOpen: boolean;
  setSearchContext: (input: { query: string; selectedCategory?: string; page: number }) => void;
  setFiltersOpen: (open: boolean) => void;
  reset: () => void;
}

const initialState = {
  query: '',
  selectedCategory: undefined,
  page: 1,
  isFiltersOpen: false,
} as const;

export const useSearchUiStore = create<SearchUiState>()(
  persist(
    (set) => ({
      ...initialState,
      setSearchContext: ({ query, selectedCategory, page }) => set({ query, selectedCategory, page }),
      setFiltersOpen: (open) => set({ isFiltersOpen: open }),
      reset: () => set(initialState),
    }),
    {
      name: 'modelo-search-ui',
      partialize: (state) => ({
        query: state.query,
        selectedCategory: state.selectedCategory,
        page: state.page,
      }),
    },
  ),
);
