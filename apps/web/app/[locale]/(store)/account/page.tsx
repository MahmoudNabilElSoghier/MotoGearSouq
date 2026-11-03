"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LogOut, User, Mail, Phone, ShieldCheck } from "lucide-react";
import { useCustomerAuth } from "@/lib/customer-auth-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormBanner } from "@/components/admin/FormBanner";

export default function AccountPage() {
  const t = useTranslations("customerAuth.account");
  const locale = useLocale();
  const router = useRouter();
  const { customer, isLoading, logout } = useCustomerAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !customer) {
      router.push(`/${locale}/login`);
    }
  }, [customer, isLoading, router, locale]);

  if (isLoading || !customer) {
    return null;
  }

  const handleLogout = async () => {
    setError(null);
    try {
      await logout();
      router.push(`/${locale}`);
      router.refresh();
    } catch {
      setError(t("errors.logoutFailed"));
    }
  };

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16 px-4">
      <div className="mx-auto w-full max-w-md">
        <Card padding="lg" className="shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <User className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-fg">{t("title")}</h1>
            <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
          </div>

          {error && <FormBanner type="error" message={error} onClose={() => setError(null)} />}

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-bg">
              <ShieldCheck className="mt-1 h-5 w-5 text-accent shrink-0" />
              <div>
                <p className="text-sm font-medium text-fg">{t("fields.status")}</p>
                <p className="text-xs text-muted">
                  {customer.approvalStatus === "approved"
                    ? t("status.approved")
                    : customer.approvalStatus === "pending"
                      ? t("status.pending")
                      : t("status.rejected")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-fg">{t("fields.name")}</p>
              <p className="text-sm text-muted">{customer.name}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted shrink-0" />
                <p className="text-sm text-muted">{customer.phone}</p>
              </div>
            </div>

            {customer.email && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted shrink-0" />
                  <p className="text-sm text-muted">{customer.email}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <Button
              type="button"
              variant="secondary"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t("actions.logout")}
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            {t("actions.backToHome")}{" "}
            <button
              type="button"
              onClick={() => router.push(`/${locale}`)}
              className="font-semibold text-accent hover:underline"
            >
              {t("actions.home")}
            </button>
          </p>
        </Card>
      </div>
    </main>
  );
}
