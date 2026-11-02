"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { createOrder, initiatePayment, type CreateOrderPayload } from "@motogearsouq/api-client";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Container } from "@/components/ui/Container";
import { Loader2, AlertCircle } from "lucide-react";

type CheckoutFormValues = {
  nameAr: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  governorate: string;
  notes?: string;
};

export default function CheckoutPage() {
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");

  const { items, subtotal, taxAmount, total, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>();

  useEffect(() => {
    if (items.length === 0) {
      router.replace(`/${locale}/cart`);
    }
  }, [items, locale, router]);

  if (items.length === 0) {
    return null;
  }

  const sub = subtotal();
  const tax = taxAmount();
  const tot = total();

  const onSubmit = async (data: CheckoutFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: CreateOrderPayload = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        customer: {
          nameAr: data.nameAr,
          phone: data.phone,
          email: data.email || undefined,
          address: data.address,
          city: data.city,
          governorate: data.governorate,
          notes: data.notes || undefined,
        },
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

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Input
                  label={isAr ? "الاسم الكامل" : "Full Name"}
                  {...register("nameAr", { required: isAr ? "الاسم مطلوب" : "Name is required" })}
                  placeholder={isAr ? "محمد أحمد" : "Mohamed Ahmed"}
                />
                {errors.nameAr && (
                  <span className="mt-1 text-xs text-red-400">{errors.nameAr.message}</span>
                )}
              </div>

              <div>
                <Input
                  label={isAr ? "رقم الهاتف" : "Phone Number"}
                  {...register("phone", { required: isAr ? "رقم الهاتف مطلوب" : "Phone is required" })}
                  placeholder="01012345678"
                  dir="ltr"
                />
                {errors.phone && (
                  <span className="mt-1 text-xs text-red-400">{errors.phone.message}</span>
                )}
              </div>
            </div>

            <div>
              <Input
                label={isAr ? "البريد الإلكتروني (اختياري)" : "Email (Optional)"}
                type="email"
                {...register("email")}
                placeholder="name@example.com"
                dir="ltr"
              />
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
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === m.id
                        ? "border-accent bg-accent/10 text-fg font-semibold"
                        : "border-border bg-bg text-muted hover:border-border/80"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.id}
                      checked={paymentMethod === m.id}
                      onChange={() => setPaymentMethod(m.id)}
                      className="accent-accent"
                    />
                    <span className="text-sm">{isAr ? m.labelAr : m.labelEn}</span>
                  </label>
                ))}
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
                <span>{isAr ? "تأكيد الطلب (الدفع عند الاستلام)" : "Confirm Order (COD)"}</span>
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
