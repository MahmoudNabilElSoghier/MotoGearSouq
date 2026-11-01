import { create } from "zustand";
import { persist } from "zustand/middleware";

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
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) => {
        const existing = get().items.find((i) => i.productId === item.productId);
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
      },
      removeItem: (productId) =>
        set({
          items: get().items.filter((i) => i.productId !== productId),
        }),
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
    }),
    { name: "mgs-cart" }
  )
);
