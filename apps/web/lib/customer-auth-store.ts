import { create } from "zustand";

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  customerType: "retail" | "wholesale";
  approvalStatus: "pending" | "approved" | "rejected";
  isActive: boolean;
}

interface RetailInput { name: string; phone: string; password: string; email?: string; }
interface WholesaleInput extends RetailInput { businessName: string; taxNumber: string; commercialRegister: string; }

interface CustomerAuthState {
  customer: CustomerUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  init: () => Promise<void>;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerRetail: (data: RetailInput) => Promise<{ success: boolean; error?: string }>;
  registerWholesale: (data: WholesaleInput) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  setCustomer: (c: CustomerUser | null) => void;
}

export const useCustomerAuth = create<CustomerAuthState>()((set, get) => ({
  customer: null,
  isLoading: false,
  isInitialized: false,

  init: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/customer/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        set({ customer: data.data, isInitialized: true });
      } else {
        set({ customer: null, isInitialized: true });
      }
    } catch {
      set({ customer: null, isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (phone, password) => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || "حدث خطأ" };
      set({ customer: data.data.customer });
      return { success: true };
    } catch {
      return { success: false, error: "تعذر الاتصال بالخادم" };
    } finally {
      set({ isLoading: false });
    }
  },

  registerRetail: async (input) => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || "حدث خطأ" };
      set({ customer: data.data.customer });
      return { success: true };
    } catch {
      return { success: false, error: "تعذر الاتصال بالخادم" };
    } finally {
      set({ isLoading: false });
    }
  },

  registerWholesale: async (input) => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/customer/register-wholesale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || "حدث خطأ" };
      return { success: true, message: data.data.message };
    } catch {
      return { success: false, error: "تعذر الاتصال بالخادم" };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await fetch("/api/auth/customer/logout", { method: "POST", credentials: "include" });
    set({ customer: null });
  },

  setCustomer: (c) => set({ customer: c }),
}));
