"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { completeMockPayment } from "@motogearsouq/api-client";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CheckCircle2, XCircle, Loader2, CreditCard } from "lucide-react";

function MockPayContent() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAr = locale === "ar";

  const orderNumber = searchParams.get("order") || "";
  const providerRef = searchParams.get("ref") || "";

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleComplete = async (success: boolean) => {
    if (!providerRef) {
      setErrorMsg(isAr ? "رقم مرجع الدفع غير موجود" : "Payment reference not found");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await completeMockPayment({ providerRef, success });
      if (res && res.redirectUrl) {
        router.push(`/${locale}/orders/${orderNumber}?payment=${success ? "success" : "failed"}`);
      } else {
        router.push(`/${locale}/orders/${orderNumber}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setErrorMsg(message || (isAr ? "فشل محاكاة الدفع" : "Failed to simulate payment"));
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="flex-1 py-16">
      <Container size="sm">
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-6 shadow-lg">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <CreditCard className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-fg">
              {isAr ? "بوابة الدفع الوهمية (محاكاة)" : "Mock Payment Gateway (Simulation)"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {isAr ? "أنت تقوم بمحاكاة عملية دفع إلكتروني للطلب رقم:" : "You are simulating an online payment for order:"}
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-accent" dir="ltr">
              {orderNumber}
            </p>
            <p className="mt-1 text-xs text-muted" dir="ltr">
              Ref: {providerRef}
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 pt-4">
            <Button
              variant="primary"
              onClick={() => handleComplete(true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {isAr ? "محاكاة دفع ناجح (Paid)" : "Simulate Success (Paid)"}
            </Button>

            <Button
              variant="secondary"
              onClick={() => handleComplete(false)}
              disabled={loading}
              className="flex items-center justify-center gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
              {isAr ? "محاكاة فشل الدفع (Failed)" : "Simulate Failure (Failed)"}
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}

export default function MockPayPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
      <MockPayContent />
    </Suspense>
  );
}
