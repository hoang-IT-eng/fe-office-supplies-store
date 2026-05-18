import { create } from 'zustand';
import { api } from '../lib/api';

export interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice: number;
    images: string[];
    inventory?: { quantity: number };
  };
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  fetch: () => Promise<void>;
  add: (productId: string, quantity?: number) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/cart');
      set({ items: data });
    } finally {
      set({ loading: false });
    }
  },

  add: async (productId, quantity = 1) => {
    await api.post('/cart', { productId, quantity });
    await get().fetch();
  },

  update: async (itemId, quantity) => {
    await api.patch(`/cart/${itemId}`, { quantity });
    await get().fetch();
  },

  remove: async (itemId) => {
    await api.delete(`/cart/${itemId}`);
    await get().fetch();
  },

  clear: async () => {
    await api.delete('/cart');
    set({ items: [] });
  },

  total: () =>
    get().items.reduce((sum, it) => {
      const p = Number(it.product.discountPrice) > 0
        ? Number(it.product.discountPrice)
        : Number(it.product.price);
      return sum + p * it.quantity;
    }, 0),

  count: () => get().items.reduce((s, it) => s + it.quantity, 0),
}));
