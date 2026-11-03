"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/lib/cart-store";

interface CartIconProps {
  label?: string;
}

export function CartIcon({ label }: CartIconProps = {}) {
  const locale = useLocale();
  const t = useTranslations("cart");
  const count = useCart((state) => state.itemCount());

  return (
    <Link
      href={`/${locale}/cart`}
      className={`relative inline-flex items-center gap-1 sm:gap-2 rounded-lg border border-border bg-bg/60 text-fg hover:bg-card transition-colors ${label ? "px-3 py-2" : "p-2 justify-center"}`}
      aria-label={label ?? t("title")}
    >
      <ShoppingCart className="w-5 h-5" />
      {label && (
        <span className={`inline font-medium ${label ? "text-xs sm:text-sm" : ""}`}>
          {label}
        </span>
      )}
      {count > 0 && (
        <span className="absolute -top-1.5 -end-1.5 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
