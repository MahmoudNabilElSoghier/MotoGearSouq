import { useCart } from "./cart-store";

/**
 * Merge logic: guest cart (localStorage) + customer cart (server-side).
 * For MVP: after login we KEEP the guest cart (customer continues shopping).
 * Server-side cart persistence is deferred to Sprint 7.
 */
export function mergeCartAfterLogin() {
  // Cart is already in localStorage (persist key "mgs-cart") — no server cart yet.
  // Reserved for Sprint 7: fetch server cart, merge quantities, update localStorage + server.
  void useCart;
}
