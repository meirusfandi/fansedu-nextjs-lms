"use client";

import { create } from "zustand";

/** Item di keranjang (minimal data kelas dari landing/halaman kelas). */
export interface CartItem {
  id: string;
  title: string;
  description?: string | null;
  subjectId?: string | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  hasItem: (id: string) => boolean;
}

export const useCartStore = create<CartStore>((set, get) => ({
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
}));
