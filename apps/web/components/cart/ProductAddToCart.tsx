"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, Check, Minus, Plus } from "lucide-react";
import { useLocale } from "next-intl";

interface ProductAddToCartProps {
  product: {
    id: string;
    code: string;
    name: string;
    retailPrice: number | null;
    taxRate: number | null;
  };
}

export function ProductAddToCart({ product }: ProductAddToCartProps) {
  const locale = useLocale();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCart((state) => state.addItem);

  const price = product.retailPrice ?? 0;

  const handleAdd = () => {
    addItem(
      {
        productId: product.id,
        code: product.code,
        name: product.name,
        retailPrice: price,
        taxRate: product.taxRate ?? 0.14,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted">{locale === "ar" ? "السعر" : "Price"}</span>
        <span className="text-2xl font-extrabold text-accent" dir="ltr">
          {price.toFixed(2)} EGP
        </span>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="qty" className="text-sm font-medium text-fg">
          {locale === "ar" ? "الكمية" : "Quantity"}
        </label>
        <div className="flex items-center rounded-lg border border-border bg-bg overflow-hidden">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="px-3 py-1.5 text-fg hover:bg-card transition-colors inline-flex items-center justify-center"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            id="qty"
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 text-center bg-transparent py-1.5 text-fg focus:outline-none"
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="px-3 py-1.5 text-fg hover:bg-card transition-colors inline-flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handleAdd}
        className="w-full inline-flex items-center justify-center gap-2"
      >
        {added ? (
          <>
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{locale === "ar" ? "تمت الإضافة!" : "Added to Cart!"}</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            <span>{locale === "ar" ? "إضافة إلى السلة" : "Add to Cart"}</span>
          </>
        )}
      </Button>
    </div>
  );
}
