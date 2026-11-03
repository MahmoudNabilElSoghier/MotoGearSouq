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

const GUEST_CART_KEY = "mgs-guest-cart";

function loadGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items: CartItem[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify({ items }));
  } catch {
    // localStorage may be disabled/quota-exceeded; degrade gracefully.
  }
}

function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // ignore
  }
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
  // Merge guest cart items into the authenticated user's server cart.
  syncGuestCart: () => Promise<void>;
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
        // Persist guest cart to localStorage immediately (works for both guest and logged-in).
        saveGuestCart(get().items);
        // Sync to server (best effort). On 401, skipAuthRedirect prevents the
        // api-client from redirecting to /login; the guest cart in localStorage
        // remains the source of truth until the user logs in.
        void addToCart(
          { productId: item.productId, quantity: qty },
          true, // skipAuthRedirect
        ).catch((err) => {
          // 401 or network error — guest cart already persisted locally.
          if (err instanceof Error && err.message.includes("401")) {
            // Expected for guests; nothing else to do.
          }
        });
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
        saveGuestCart(get().items);
        void removeCartItem(productId, true).catch(() => undefined);
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
        saveGuestCart(get().items);
        void updateCartItem(productId, qty, true).catch(() => undefined);
      },
      clearCart: () => {
        set({ items: [] });
        clearGuestCart();
      },
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
          const res: CartRow = await getCart(true);
          if (res && Array.isArray(res.items)) {
            set({ items: res.items.map(toCartItem) });
            saveGuestCart(get().items);
          }
        } catch {
          // Server unavailable or 401 — fall back to guest cart in localStorage.
          const guest = loadGuestCart();
          if (guest.length > 0) {
            set({ items: guest });
          }
        }
      },
      syncGuestCart: async () => {
        const guest = loadGuestCart();
        if (guest.length === 0) return;
        // Sync each guest cart item to the server cart.
        for (const item of guest) {
          try {
            await addToCart(
              { productId: item.productId, quantity: item.quantity },
              true, // skipAuthRedirect — user is now authenticated
            );
          } catch {
            // Best effort; continue syncing remaining items.
          }
        }
        clearGuestCart();
        // Refresh server cart to reflect synced state.
        void get().fetchCart();
      },
    }),
    { name: "mgs-cart" }
  )
);
