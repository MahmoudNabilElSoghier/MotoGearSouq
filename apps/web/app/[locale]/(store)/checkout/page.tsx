"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { createOrder, getOrders, initiatePayment, type CartItem, type CreateOrderPayload, type PaymentMethod } from "@motogearsouq/api-client";
import { useCart } from "@/lib/cart-store";
import { useCustomerAuth } from "@/lib/customer-auth-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Container } from "@/components/ui/Container";
import { Loader2, AlertCircle, Pencil, CheckCircle2 } from "lucide-react";

type CheckoutFormValues = {
  address: string;
  city: string;
  governorate: string;
  notes?: string;
};

function codLimitFor(successfulDeliveries: number): number {
  if (successfulDeliveries === 0) return 5000;
  if (successfulDeliveries === 1) return 15000;
  if (successfulDeliveries === 2) return 30000;
  return Infinity;
}

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");

  const { items, subtotal, taxAmount, total, clearCart } = useCart();
  const { customer, isLoading: authLoading, init } = useCustomerAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");

  const { items, subtotal, taxAmount, total, clearCart } = useCart();
  const { customer, isLoading: authLoading, init } = useCustomerAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormValues>();

  const [prevOrder, setPrevOrder] = useState<{
    shippingAddress?: string | null;
    shippingCity?: string | null;
    shippingGovernorate?: string | null;
    notes?: string | null;
  } | null>(null);
  const [showUsePrevious, setShowUsePrevious] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  // Force login: no guest checkout (5C-1).
  useEffect(() => {
    if (!authLoading && !customer) {
      router.replace(`/${locale}/login?next=/${locale}/checkout`);
    }
  }, [authLoading, customer, locale, router]);

  useEffect(() => {
    if (customer) {
      setValue("address", customer.address ?? "", { shouldValidate: true });
      setValue("city", customer.city ?? "", { shouldValidate: true });
      setValue("governorate", customer.governorate ?? "", { shouldValidate: true });
    }
  }, [customer, setValue]);

  useEffect(() => {
    if (items.length === 0) {
      router.replace(`/${locale}/cart`);
    }
  }, [items, locale, router]);

  const successfulDeliveries = customer?.successfulDeliveries ?? 0;
  const codLimit = codLimitFor(successfulDeliveries);
  const nextLimit = codLimitFor(successfulDeliveries + 1);
  const orderNumber = successfulDeliveries + 1;

  const sub = subtotal();
  const tax = taxAmount();
  const tot = total();
  const codExceeded = Number.isFinite(codLimit) && tot > codLimit;

  // Order total exceeds COD limit → force an online method.
  useEffect(() => {
    if (codExceeded && paymentMethod === "cod") {
      setPaymentMethod("mock");
    }
  }, [codExceeded, paymentMethod]);

  if (authLoading || !customer || items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" aria-hidden />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  const formatLimit = (limit: number) =>
    Number.isFinite(limit) ? nf.format(limit) : isAr ? "بلا حدود" : "Unlimited";

  const onSubmit = async (data: CheckoutFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: CreateOrderPayload = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        shippingAddress: data.address,
        shippingCity: data.city,
        shippingGovernorate: data.governorate,
        notes: data.notes || undefined,
        paymentMethod: paymentMethod as CreateOrderPayload["paymentMethod"],
      };

      const res = await createOrder(payload);
      if (res && res.data && res.data.orderNumber) {
        clearCart();
        const orderNumber = res.data.orderNumber;
        if (paymentMethod !== "cod") {
          try {
            const payRes = await initiatePayment({
              orderNumber,
              method: paymentMethod,
              returnUrl: `/${locale}/orders/${orderNumber}`,
            });
            if (payRes && payRes.redirectUrl) {
              router.push(payRes.redirectUrl);
              return;
            }
          } catch {
            // fallback to order tracking page if init fails
          }
        }
        router.push(`/${locale}/orders/${orderNumber}`);
      } else {
        throw new Error(isAr ? "فشل إنشاء الطلب" : "Failed to create order");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setErrorMsg(
        message ||
          (isAr
            ? "حدث خطأ أثناء إتمام الطلب. يرجى المحاولة مرة أخرى."
            : "An error occurred while placing the order. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16">
      <Container>
        <h1 className="mb-8 text-3xl md:text-4xl font-extrabold text-fg">
          {isAr ? "إتمام الطلب والدفع" : "Checkout & Payment"}
        </h1>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Customer / Shipping Form */}
          <div className="space-y-6 rounded-xl border border-border bg-card p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg">
              {isAr ? "بيانات الشحن والتواصل" : "Shipping & Contact Details"}
            </h2>

            {/* Signed-in customer (read-only) */}
            <div className="rounded-xl border border-border bg-bg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">{t("signedInAs", { name: customer.name })}</p>
                  <p className="mt-1 font-semibold text-fg" dir="ltr">
                    {customer.name}
                  </p>
                  <p className="text-sm text-muted" dir="ltr">
                    {customer.phone}
                    {customer.email ? ` · ${customer.email}` : ""}
                  </p>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link
                    href={`/${locale}/account`}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{t("changeAccount")}</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div>
              <Input
                label={isAr ? "العنوان بالتفصيل" : "Street Address"}
                {...register("address", { required: isAr ? "العنوان مطلوب" : "Address is required" })}
                placeholder={isAr ? "شارع الجمهورية، عمارة 12" : "12 El Gomhoreya St"}
              />
              {errors.address && (
                <span className="mt-1 text-xs text-red-400">{errors.address.message}</span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Input
                  label={isAr ? "المدينة / المركز" : "City / Center"}
                  {...register("city", { required: isAr ? "المدينة مطلوبة" : "City is required" })}
                  placeholder={isAr ? "المنصورة" : "Mansoura"}
                />
                {errors.city && (
                  <span className="mt-1 text-xs text-red-400">{errors.city.message}</span>
                )}
              </div>

              <div>
                <Input
                  label={isAr ? "المحافظة" : "Governorate"}
                  {...register("governorate", { required: isAr ? "المحافظة مطلوبة" : "Governorate is required" })}
                  placeholder={isAr ? "الدقهلية" : "Dakahlia"}
                />
                {errors.governorate && (
                  <span className="mt-1 text-xs text-red-400">{errors.governorate.message}</span>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-fg">
                {isAr ? "طريقة الدفع" : "Payment Method"}
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { id: "cod", labelAr: "الدفع عند الاستلام", labelEn: "Cash on Delivery" },
                  { id: "mock", labelAr: "الدفع الإلكتروني (تجريبي)", labelEn: "Online Payment (Mock)" },
                  { id: "instapay", labelAr: "انستاباي (InstaPay)", labelEn: "InstaPay" },
                ].map((m) => {
                  const disabled = m.id === "cod" && codExceeded;
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                        disabled
                          ? "border-border bg-bg text-muted opacity-60 cursor-not-allowed"
                          : paymentMethod === m.id
                            ? "border-accent bg-accent/10 text-fg font-semibold cursor-pointer"
                            : "border-border bg-bg text-muted hover:border-border/80 cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={m.id}
                        checked={paymentMethod === m.id}
                        disabled={disabled}
                        onChange={() => setPaymentMethod(m.id)}
                        className="accent-accent"
                      />
                      <span className="text-sm">{isAr ? m.labelAr : m.labelEn}</span>
                    </label>
                  );
                })}
              </div>

              {/* COD limit info */}
              <div
                className={`rounded-xl border p-4 text-sm ${
                  codExceeded
                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                }`}
              >
                <p className="font-semibold">{t("codLimitTitle")}</p>
                {codExceeded ? (
                  <p className="mt-1">
                    {t("codLimitExceeded", {
                      total: `${nf.format(tot)} ${isAr ? "ج.م" : "EGP"}`,
                      limit: `${nf.format(codLimit)} ${isAr ? "ج.م" : "EGP"}`,
                    })}
                  </p>
                ) : (
                  <>
                    <p className="mt-1">
                      {t("codLimitBody", {
                        limit: formatLimit(codLimit),
                        count: orderNumber,
                      })}
                    </p>
                    {successfulDeliveries < 3 && (
                      <p className="mt-1 text-xs opacity-80">
                        {t("codLimitProgress", {
                          count: orderNumber,
                          nextLimit: formatLimit(nextLimit),
                        })}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-fg">
                {isAr ? "ملاحظات التوصيل (اختياري)" : "Delivery Notes (Optional)"}
              </label>
              <textarea
                id="notes"
                rows={3}
                {...register("notes")}
                placeholder={isAr ? "أي تعليمات خاصة للمندوب..." : "Any special instructions for courier..."}
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-fg placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isAr ? "جاري تأكيد الطلب..." : "Placing order..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {paymentMethod === "cod"
                      ? isAr
                        ? "تأكيد الطلب (الدفع عند الاستلام)"
                        : "Confirm Order (COD)"
                      : isAr
                        ? "تأكيد الطلب والدفع"
                        : "Confirm Order & Pay"}
                  </span>
                </>
              )}
            </Button>
          </div>

          {/* Order Summary Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-xl font-bold text-fg">
                {isAr ? "ملخص المنتجات" : "Products Summary"}
              </h2>

              <ul className="max-h-60 overflow-y-auto space-y-3 divide-y divide-border/50 text-sm">
                {items.map((i) => (
                  <li key={i.productId} className="pt-3 first:pt-0 flex justify-between gap-2">
                    <div>
                      <p className="font-semibold text-fg">{i.name}</p>
                      <p className="text-xs text-muted" dir="ltr">
                        {i.quantity} × {nf.format(i.retailPrice)} {isAr ? "ج.م" : "EGP"}
                      </p>
                    </div>
                    <span className="font-bold text-fg" dir="ltr">
                      {nf.format(i.retailPrice * i.quantity)} {isAr ? "ج.م" : "EGP"}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted">
                  <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                  <span className="font-semibold text-fg" dir="ltr">
                    {nf.format(sub)} {isAr ? "ج.م" : "EGP"}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>{isAr ? "ضريبة القيمة المضافة (14%)" : "Estimated VAT (14%)"}</span>
                  <span className="font-semibold text-fg" dir="ltr">
                    {nf.format(tax)} {isAr ? "ج.م" : "EGP"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-extrabold text-fg border-t border-border pt-3">
                <span>{isAr ? "الإجمالي الكلي" : "Total"}</span>
                <span className="text-accent" dir="ltr">
                  {nf.format(tot)} {isAr ? "ج.م" : "EGP"}
                </span>
              </div>
            </div>
          </aside>
        </form>
      </Container>
    </main>
  );
}
