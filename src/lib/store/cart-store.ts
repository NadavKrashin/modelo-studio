'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cart, CartItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface CartStore extends Cart {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

function recalculateCart(items: CartItem[]): Pick<Cart, 'totalItems' | 'subtotal'> {
  return {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
  };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      totalItems: 0,
      subtotal: 0,
      updatedAt: new Date().toISOString(),

      isCartOpen: false,
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      addItem: (item) =>
        set((state) => {
          const newItem: CartItem = {
            ...item,
            id: uuidv4(),
            addedAt: new Date().toISOString(),
          };
          const newItems = [...state.items, newItem];
          return {
            items: newItems,
            ...recalculateCart(newItems),
            updatedAt: new Date().toISOString(),
          };
        }),

      removeItem: (itemId) =>
        set((state) => {
          const newItems = state.items.filter((i) => i.id !== itemId);
          return {
            items: newItems,
            ...recalculateCart(newItems),
            updatedAt: new Date().toISOString(),
          };
        }),

      updateQuantity: (itemId, quantity) =>
        set((state) => {
          const newItems = state.items.map((item) =>
            item.id === itemId
              ? { ...item, quantity, subtotal: item.unitPrice * quantity }
              : item
          );
          return {
            items: newItems,
            ...recalculateCart(newItems),
            updatedAt: new Date().toISOString(),
          };
        }),

      clearCart: () =>
        set({
          items: [],
          totalItems: 0,
          subtotal: 0,
          updatedAt: new Date().toISOString(),
        }),
    }),
    {
      name: 'modelo-cart',
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        subtotal: state.subtotal,
        updatedAt: state.updatedAt,
      }),
    }
  )
);
