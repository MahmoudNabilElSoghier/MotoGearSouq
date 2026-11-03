"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { customerLoginSchema, type CustomerLoginInput } from "@motogearsouq/shared";
import { useCustomerAuth } from "@/lib/customer-auth-store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormBanner } from "@/components/admin/FormBanner";

function safeNext(next: string | null, fallback: string): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) {
    return next;
  }
  return fallback;
}

export default function LoginPage() {
  const t = useTranslations("customerAuth.login");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useCustomerAuth((s) => s.login);
  const isLoading = useCustomerAuth((s) => s.isLoading);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerLoginInput>({
    resolver: zodResolver(customerLoginSchema),
  });

  const onSubmit = async (data: CustomerLoginInput) => {
    setError(null);
    const result = await login(data.identifier || data.phone || "", data.password);
    if (!result.success) {
      const raw = result.error || "";
      if (raw.includes("قيد المراجعة")) setError(t("errors.pending"));
      else if (raw.includes("رفض")) setError(t("errors.rejected"));
      else if (raw.includes("بيانات غير صحيحة") || !raw) setError(t("errors.invalid"));
      else setError(raw);
      return;
    }
    const next = safeNext(searchParams.get("next"), `/${locale}/account`);
    router.push(next);
    router.refresh();
  };

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16 px-4">
      <div className="mx-auto w-full max-w-md">
        <Card padding="lg" className="shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <LogIn className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-fg">{t("title")}</h1>
            <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
          </div>

          {error && <FormBanner type="error" message={error} onClose={() => setError(null)} />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label={t("identifier")}
              type="text"
              dir="ltr"
              autoComplete="username"
              placeholder={t("identifierPlaceholder")}
              error={errors.identifier?.message}
              disabled={isLoading}
              {...register("identifier")}
            />

            <div className="relative">
              <Input
                label={t("password")}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pe-11"
                error={errors.password?.message}
                disabled={isLoading}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                className="absolute end-3 top-[34px] p-1 text-muted hover:text-fg transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("loading")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {t("noAccount")}{" "}
            <Link href={`/${locale}/register`} className="font-semibold text-accent hover:underline">
              {t("registerLink")}
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
