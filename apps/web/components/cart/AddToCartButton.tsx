"use client";

import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface AddToCartButtonProps {
  product: {
    id: string;
    code: string;
    name: string;
    retailPrice: number | null;
    taxRate: number | null;
  };
  className?: string;
}

export function AddToCartButton({ product, className }: AddToCartButtonProps) {
  const t = useTranslations("cart");
  const addItem = useCart((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      code: product.code,
      name: product.name,
      retailPrice: product.retailPrice ?? 0,
      taxRate: product.taxRate ?? 0.14,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleAdd}
      className={`inline-flex items-center gap-1.5 ${className ?? ""}`}
    >
      {added ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{t("added")}</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          <span>{t("add")}</span>
        </>
      )}
    </Button>
  );
}
