'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import type { AppliedCoupon, Cart, CartItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getFirebaseClientFirestore } from '@/lib/firebase/client';
import { COUPONS_COLLECTION, docToCoupon } from '@/lib/firebase/coupons';

interface CartStore extends Cart {
  isCartOpen: boolean;
  appliedCoupon: AppliedCoupon | null;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (rawCode: string) => Promise<void>;
  removeCoupon: () => void;
}

function recalculateCart(items: CartItem[]): Pick<Cart, 'totalItems' | 'subtotal'> {
  return {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
  };
}

function isCouponDateValid(expirationDate: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expirationDate);
  if (!m) return false;
  const end = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999);
  return end >= new Date();
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      totalItems: 0,
      subtotal: 0,
      updatedAt: new Date().toISOString(),
      appliedCoupon: null,

      isCartOpen: false,
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      applyCoupon: async (rawCode: string) => {
        const normalized = rawCode.trim().toUpperCase();
        if (!normalized) {
          throw new Error('הזינו קוד קופון.');
        }

        const db = getFirebaseClientFirestore();
        const q = query(
          collection(db, COUPONS_COLLECTION),
          where('code', '==', normalized),
          limit(5),
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          throw new Error('קופון לא חוקי או פג תוקף');
        }

        let matched: ReturnType<typeof docToCoupon> = null;
        for (const d of snap.docs) {
          const c = docToCoupon(d.id, d.data() as Record<string, unknown>);
          if (c && c.code === normalized) {
            matched = c;
            break;
          }
        }

        if (!matched) {
          throw new Error('קופון לא חוקי או פג תוקף');
        }
        if (!matched.isActive) {
          throw new Error('קופון לא חוקי או פג תוקף');
        }
        if (!isCouponDateValid(matched.expirationDate)) {
          throw new Error('קופון לא חוקי או פג תוקף');
        }

        set({
          appliedCoupon: {
            code: matched.code,
            type: matched.discountType,
            value: matched.value,
          },
          updatedAt: new Date().toISOString(),
        });
      },

      removeCoupon: () =>
        set({
          appliedCoupon: null,
          updatedAt: new Date().toISOString(),
        }),

      addItem: (item) =>
        set((state) => {
          const newItem = {
            ...item,
            id: uuidv4(),
            addedAt: new Date().toISOString(),
          } as CartItem;
          const newItems = [...state.items, newItem];
          return {
            items: newItems,
            ...recalculateCart(newItems),
            updatedAt: new Date().toISOString(),
            isCartOpen: true,
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
              : item,
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
          appliedCoupon: null,
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
        appliedCoupon: state.appliedCoupon,
      }),
    },
  ),
);
