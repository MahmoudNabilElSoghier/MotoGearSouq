import type { Product } from "./product";
import type { Dateish } from "./common";

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product?: Product | null;
  quantity: number;
  createdAt: Dateish;
  updatedAt: Dateish;
}

export interface Cart {
  id: string;
  customerId: string;
  items: CartItem[];
  createdAt: Dateish;
  updatedAt: Dateish;
}
