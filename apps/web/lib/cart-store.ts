import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartRow,
} from "@motogearsouq/api-client";
import type { CartItem as SharedCartItem } from "@motogearsouq/shared";

export interface CartItem {
  productId: string;
  code: string;
  name: string;
  retailPrice: number;
  taxRate: number;
  imageUrl?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
  taxAmount: () => number;
  total: () => number;
  // Server sync (graceful: falls back to local-only when the API is unreachable).
  fetchCart: () => Promise<void>;
}

const toCartItem = (i: SharedCartItem): CartItem => ({
  productId: i.productId,
  code: i.product?.code ?? "",
  name: i.product?.name ?? "",
  retailPrice: Number(i.product?.retailPrice ?? 0),
  taxRate: Number(i.product?.taxRate ?? 0.14),
  quantity: i.quantity,
});

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        // Optimistic local update.
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + qty }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: qty }] });
        }
        // Sync to server (best effort).
        void addToCart({ productId: item.productId, quantity: qty }).catch(() => undefined);
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
        void removeCartItem(productId).catch(() => undefined);
      },
      updateQuantity: (productId, qty) => {
        if (qty < 1) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity: qty } : i
          ),
        });
        void updateCartItem(productId, qty).catch(() => undefined);
      },
      clearCart: () => set({ items: [] }),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.retailPrice * i.quantity, 0),
      taxAmount: () =>
        get().items.reduce(
          (sum, i) => sum + i.retailPrice * i.quantity * i.taxRate,
          0
        ),
      total: () => get().subtotal() + get().taxAmount(),
      fetchCart: async () => {
        try {
          const res: CartRow = await getCart();
          if (res && Array.isArray(res.items)) {
            set({ items: res.items.map(toCartItem) });
          }
        } catch {
          // Local-only fallback: keep whatever is persisted locally.
        }
      },
    }),
    { name: "mgs-cart" }
  )
);
