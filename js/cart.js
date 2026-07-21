import { api } from './api.js';

// Giỏ hàng: dữ liệu nằm ở backend, ở đây chỉ giữ bản sao trong bộ nhớ.
const state = { items: [] };
const listeners = new Set();

function emit() {
  listeners.forEach((cb) => cb(state.items));
}

export const cart = {
  get items() {
    return state.items;
  },
  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  async fetch() {
    const data = await api.get('/cart');
    state.items = data || [];
    emit();
    return state.items;
  },
  async add(productId, quantity = 1) {
    await api.post('/cart', { productId, quantity });
    await this.fetch();
  },
  async update(itemId, quantity) {
    await api.patch(`/cart/${itemId}`, { quantity });
    await this.fetch();
  },
  async remove(itemId) {
    await api.delete(`/cart/${itemId}`);
    await this.fetch();
  },
  async clear() {
    await api.delete('/cart');
    state.items = [];
    emit();
  },
  total() {
    return state.items.reduce((sum, it) => {
      const p = Number(it.product.discountPrice) > 0 ? Number(it.product.discountPrice) : Number(it.product.price);
      return sum + p * it.quantity;
    }, 0);
  },
  count() {
    return state.items.reduce((s, it) => s + it.quantity, 0);
  },
};
