"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import {
  createRetailCustomerSchema,
  createWholesaleCustomerSchema,
  type CreateRetailCustomerInput,
  type CreateWholesaleCustomerInput,
} from "@motogearsouq/shared";
import { useCustomerAuth } from "@/lib/customer-auth-store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormBanner } from "@/components/admin/FormBanner";

type Tab = "retail" | "wholesale";

export default function RegisterPage() {
  const t = useTranslations("customerAuth.register");
  const tLogin = useTranslations("customerAuth.login");
  const locale = useLocale();
  const router = useRouter();
  const { registerRetail, registerWholesale, isLoading } = useCustomerAuth();

  const [tab, setTab] = useState<Tab>("retail");
  const [error, setError] = useState<string | null>(null);
  const [wholesaleDone, setWholesaleDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const retailForm = useForm<CreateRetailCustomerInput>({
    resolver: zodResolver(createRetailCustomerSchema),
    defaultValues: { name: "", phone: "", password: "", email: "" },
  });

  const wholesaleForm = useForm<CreateWholesaleCustomerInput>({
    resolver: zodResolver(createWholesaleCustomerSchema),
    defaultValues: {
      name: "",
      phone: "",
      password: "",
      email: "",
      businessName: "",
      taxNumber: "",
      commercialRegister: "",
    },
  });

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
    setShowPassword(false);
  };

  const onRetailSubmit = async (data: CreateRetailCustomerInput) => {
    setError(null);
    const result = await registerRetail(data);
    if (!result.success) {
      setError(result.error || "حدث خطأ");
      return;
    }
    router.push(`/${locale}/account`);
    router.refresh();
  };

  const onWholesaleSubmit = async (data: CreateWholesaleCustomerInput) => {
    setError(null);
    const result = await registerWholesale(data);
    if (!result.success) {
      setError(result.error || "حدث خطأ");
      return;
    }
    wholesaleForm.reset();
    setWholesaleDone(true);
  };

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? tLogin("hidePassword") : tLogin("showPassword")}
      className="absolute end-3 top-[34px] p-1 text-muted hover:text-fg transition-colors"
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16 px-4">
      <div className="mx-auto w-full max-w-lg">
        <Card padding="lg" className="shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <UserPlus className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-fg">{t("title")}</h1>
          </div>

          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg border border-border bg-bg p-1">
            <button
              type="button"
              onClick={() => switchTab("retail")}
              aria-pressed={tab === "retail"}
              className={`rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                tab === "retail" ? "bg-accent-strong text-white" : "text-muted hover:text-fg"
              }`}
            >
              {t("tabs.retail")}
            </button>
            <button
              type="button"
              onClick={() => switchTab("wholesale")}
              aria-pressed={tab === "wholesale"}
              className={`rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                tab === "wholesale" ? "bg-accent-strong text-white" : "text-muted hover:text-fg"
              }`}
            >
              {t("tabs.wholesale")}
            </button>
          </div>

          {error && <FormBanner type="error" message={error} onClose={() => setError(null)} />}

          {wholesaleDone && (
            <FormBanner
              type="success"
              message={t("wholesaleSuccess")}
              onClose={() => setWholesaleDone(false)}
            />
          )}

          {tab === "retail" && (
            <form onSubmit={retailForm.handleSubmit(onRetailSubmit)} className="space-y-4">
              <Input
                label={t("fields.name")}
                autoComplete="name"
                error={retailForm.formState.errors.name?.message}
                disabled={isLoading}
                {...retailForm.register("name")}
              />
              <Input
                label={t("fields.phone")}
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                error={retailForm.formState.errors.phone?.message}
                disabled={isLoading}
                {...retailForm.register("phone")}
              />
              <div className="relative">
                <Input
                  label={t("fields.password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="pe-11"
                  error={retailForm.formState.errors.password?.message}
                  disabled={isLoading}
                  {...retailForm.register("password")}
                />
                {passwordToggle}
              </div>
              <Input
                label={t("fields.email")}
                type="email"
                autoComplete="email"
                dir="ltr"
                error={retailForm.formState.errors.email?.message}
                disabled={isLoading}
                {...retailForm.register("email")}
              />
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
          )}

          {tab === "wholesale" && (
            <form onSubmit={wholesaleForm.handleSubmit(onWholesaleSubmit)} className="space-y-4">
              <Input
                label={t("fields.name")}
                autoComplete="name"
                error={wholesaleForm.formState.errors.name?.message}
                disabled={isLoading}
                {...wholesaleForm.register("name")}
              />
              <Input
                label={t("fields.phone")}
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                error={wholesaleForm.formState.errors.phone?.message}
                disabled={isLoading}
                {...wholesaleForm.register("phone")}
              />
              <div className="relative">
                <Input
                  label={t("fields.password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="pe-11"
                  error={wholesaleForm.formState.errors.password?.message}
                  disabled={isLoading}
                  {...wholesaleForm.register("password")}
                />
                {passwordToggle}
              </div>
              <Input
                label={t("fields.email")}
                type="email"
                autoComplete="email"
                dir="ltr"
                error={wholesaleForm.formState.errors.email?.message}
                disabled={isLoading}
                {...wholesaleForm.register("email")}
              />
              <Input
                label={t("fields.businessName")}
                autoComplete="organization"
                error={wholesaleForm.formState.errors.businessName?.message}
                disabled={isLoading}
                {...wholesaleForm.register("businessName")}
              />
              <Input
                label={t("fields.taxNumber")}
                dir="ltr"
                error={wholesaleForm.formState.errors.taxNumber?.message}
                disabled={isLoading}
                {...wholesaleForm.register("taxNumber")}
              />
              <Input
                label={t("fields.commercialRegister")}
                dir="ltr"
                error={wholesaleForm.formState.errors.commercialRegister?.message}
                disabled={isLoading}
                {...wholesaleForm.register("commercialRegister")}
              />
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
          )}

          {wholesaleDone && tab === "wholesale" && (
            <div className="mt-4">
              <Button variant="secondary" fullWidth onClick={() => router.push(`/${locale}`)}>
                {t("backHome")}
              </Button>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            {t("haveAccount")}{" "}
            <Link href={`/${locale}/login`} className="font-semibold text-accent hover:underline">
              {t("loginLink")}
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
