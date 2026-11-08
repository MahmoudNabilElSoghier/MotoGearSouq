"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { authApi, type AuthUser } from "@motogearsouq/api-client";
import { Button } from "@/components/ui/Button";
import { Loader2, LogOut, Mail, ShieldCheck } from "lucide-react";

export default function AdminProfilePage() {
  const t = useTranslations("admin.profile");
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        // Not signed in (or session expired) → admin login, never the customer one.
        if (!cancelled) router.replace(`/${locale}/admin/login`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    router.push(`/${locale}/admin/login`);
    router.refresh();
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{t("loading")}</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-fg">{t("title")}</h1>
      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-strong/20 text-accent">
              <Mail className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">{t("email")}</p>
              <p className="truncate text-sm font-semibold text-fg">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-strong/20 text-accent">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">{t("role")}</p>
              <p className="truncate text-sm font-semibold text-fg">
                {user.role}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-border pt-6">
          <Button type="button" variant="secondary" onClick={handleLogout}>
            <LogOut className="me-2 h-4 w-4" />
            {t("logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
