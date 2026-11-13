"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Loader2, Key } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "@/components/admin/FormBanner";

export default function ResetPasswordPage() {
  const t = useTranslations("customerAuth.resetPassword");
  const tLogin = useTranslations("customerAuth.login");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetSchema = z.object({
    newPassword: z.string().min(6, t("errors.passwordMin")),
    confirmPassword: z.string(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ newPassword: string; confirmPassword: string }>({
    resolver: zodResolver(resetSchema),
  });

  useEffect(() => {
    if (!token) {
      setError(t("errors.invalidToken"));
    }
  }, [token, t]);

  const handleSubmitReset = async ({ newPassword }: { newPassword: string; confirmPassword: string }) => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!token) {
      setError(t("errors.invalidToken"));
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/customer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || t("errors.resetFailed"));
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setSuccess(data.message || t("messages.passwordUpdated"));
    } catch {
      setError(t("errors.resetFailed"));
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16 px-4">
      <div className="mx-auto w-full max-w-md">
        <Card padding="lg" className="shadow-2xl">
          <div className="mb-8">
            <Image
              src={locale === "ar" ? "/brand/Logo_Icon_Name_Desc_AR_Large.png" : "/brand/Logo_Icon_Name_Desc_EN_Large.png"}
              alt={tCommon("logoAlt")}
              width={250}
              height={100}
              className="max-w-[250px] w-full h-auto object-contain mx-auto mb-6"
              priority
            />
            <button
              type="button"
              onClick={() => router.push(`/${locale}/login`)}
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              {tLogin("signinShort")}
            </button>

            <h1 className="text-2xl font-bold text-fg">{t("title")}</h1>
            <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
          </div>

          {(error || success) && (
            <FormBanner
              type={error ? "error" : "success"}
              message={(error || success)!}
              onClose={() => {
                setError(null);
                setSuccess(null);
              }}
            />
          )}

          <form onSubmit={handleSubmit(handleSubmitReset)} className="space-y-4">
            <Input
              label={t("fields.newPassword")}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.newPassword?.message}
              disabled={isLoading}
              {...register("newPassword")}
            />
            <Input
              label={t("fields.confirmPassword")}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              disabled={isLoading}
              {...register("confirmPassword")}
            />
            <Button type="submit" fullWidth disabled={isLoading || !token} className="inline-flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("actions.resetting")}
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  {t("actions.resetPassword")}
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
