"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "@/components/admin/FormBanner";

export default function ForgotPasswordPage() {
  const t = useTranslations("customerAuth.forgotPassword");
  const tLogin = useTranslations("customerAuth.login");
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get("email") as string;

    try {
      const res = await fetch("/api/auth/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || t("errors.requestFailed"));
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setSuccess(data.message || t("messages.linkSent"));
    } catch {
      setError(t("errors.requestFailed"));
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16 px-4">
      <div className="mx-auto w-full max-w-md">
        <Card padding="lg" className="shadow-2xl">
          <div className="mb-8">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("fields.email")}
              type="email"
              autoComplete="email"
              dir="ltr"
              placeholder="email@example.com"
              error={error ?? undefined}
              required
            />
            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("actions.sending")}
                </>
              ) : (
                t("actions.sendResetLink")
              )}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
