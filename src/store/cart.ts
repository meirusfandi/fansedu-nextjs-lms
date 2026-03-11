"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Item di keranjang (minimal data kelas dari landing/halaman kelas). */
export interface CartItem {
  id: string;
  title: string;
  description?: string | null;
  subject_id?: string | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  hasItem: (id: string) => boolean;
}

const CART_STORAGE_KEY = "fansedu_cart";

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) return state;
          return { items: [...state.items, item] };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      clearCart: () => set({ items: [] }),

      hasItem: (id) => get().items.some((i) => i.id === id),
    }),
    { name: CART_STORAGE_KEY }
  )
);
