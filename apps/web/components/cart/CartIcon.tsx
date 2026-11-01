"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/lib/cart-store";

export function CartIcon() {
  const locale = useLocale();
  const t = useTranslations("cart");
  const count = useCart((state) => state.itemCount());

  return (
    <Link
      href={`/${locale}/cart`}
      className="relative p-2 rounded-lg border border-border bg-bg/60 text-fg hover:bg-card transition-colors flex items-center justify-center"
      aria-label={t("title")}
    >
      <ShoppingCart className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1.5 -end-1.5 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
