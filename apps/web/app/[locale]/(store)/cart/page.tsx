"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Trash2, ShoppingCart, ArrowRight, ArrowLeft } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useCustomerAuth } from "@/lib/customer-auth-store";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function CartPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const tCheckout = useTranslations("checkout");
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");

  const { items, removeItem, updateQuantity, clearCart, subtotal, taxAmount, total } =
    useCart();
  const { customer, init } = useCustomerAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const sub = subtotal();
  const tax = taxAmount();
  const tot = total();

  if (items.length === 0) {
    return (
      <main id="main-content" className="flex-1 py-16 md:py-24">
        <Container size="md">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center">
            <div className="mb-4 rounded-full bg-accent/15 p-4 text-accent">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-extrabold text-fg">
              {isAr ? "سلة الشراء فارغة" : "Your cart is empty"}
            </h1>
            <p className="mt-2 text-muted max-w-sm">
              {isAr
                ? "لم تقم بإضافة أي قطع غيار إلى سلة الشراء بعد. تصفح الكتالوج لاختيار ما تحتاجه."
                : "You haven't added any spare parts to your cart yet. Browse the catalog to find what you need."}
            </p>
            <div className="mt-6">
              <Button variant="primary" asChild>
                <Link href={`/${locale}/products`} className="inline-flex items-center gap-2">
                  <span>{isAr ? "تصفح قطع الغيار" : "Browse spare parts"}</span>
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-extrabold text-fg">
            {isAr ? "سلة الشراء" : "Shopping Cart"}
          </h1>
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-400 hover:text-red-500">
            {isAr ? "إفراغ السلة" : "Clear cart"}
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Items list */}
          <div className="space-y-4">
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5"
                >
                  <div className="space-y-1">
                    <span className="font-mono text-xs text-muted" dir="ltr">
                      {item.code}
                    </span>
                    <h2 className="font-bold text-fg">{item.name}</h2>
                    <p className="text-sm font-semibold text-accent" dir="ltr">
                      {nf.format(item.retailPrice)} {isAr ? "ج.م" : "EGP"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center rounded-lg border border-border bg-bg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-3 py-1 text-fg hover:bg-card transition-colors"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-sm font-semibold text-fg" dir="ltr">
                        {nf.format(item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-3 py-1 text-fg hover:bg-card transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-bold text-fg min-w-[90px] text-end" dir="ltr">
                      {nf.format(item.retailPrice * item.quantity)} {isAr ? "ج.م" : "EGP"}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="p-2 text-muted hover:text-red-400 transition-colors"
                      aria-label={isAr ? "حذف القطعة" : "Remove item"}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Summary sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-xl font-bold text-fg">
                {isAr ? "ملخص الطلب" : "Order Summary"}
              </h2>

              <div className="space-y-2 border-t border-b border-border py-4 text-sm">
                <div className="flex justify-between text-muted">
                  <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                  <span className="font-semibold text-fg" dir="ltr">
                    {nf.format(sub)} {isAr ? "ج.م" : "EGP"}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>{isAr ? "ضريبة القيمة المضافة (14% مقدرة)" : "Estimated VAT (14%)"}</span>
                  <span className="font-semibold text-fg" dir="ltr">
                    {nf.format(tax)} {isAr ? "ج.م" : "EGP"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-extrabold text-fg">
                <span>{isAr ? "الإجمالي الكلي" : "Total"}</span>
                <span className="text-accent" dir="ltr">
                  {nf.format(tot)} {isAr ? "ج.م" : "EGP"}
                </span>
              </div>

              <div className="pt-2">
                <Button variant="primary" size="lg" asChild className="w-full">
                  <Link
                    href={`/${locale}/checkout`}
                    onClick={(e) => {
                      if (!customer) {
                        e.preventDefault();
                        setShowLoginModal(true);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <span>{isAr ? "إتمام الطلب" : "Proceed to Checkout"}</span>
                    {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </Container>

      {/* Login required modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-login-title"
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4"
          >
            <h2 id="cart-login-title" className="text-lg font-bold text-fg text-center">
              {tCheckout("authRequired")}
            </h2>
            <div className="flex flex-col gap-2">
              <Button asChild variant="primary" fullWidth>
                <Link href={`/${locale}/login?next=/${locale}/checkout`}>
                  {tCheckout("loginCta")}
                </Link>
              </Button>
              <Button asChild variant="secondary" fullWidth>
                <Link href={`/${locale}/register?next=/${locale}/checkout`}>
                  {tCheckout("registerCta")}
                </Link>
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setShowLoginModal(false)}>
                {tCheckout("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
