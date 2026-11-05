"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useCustomerAuth } from "@/lib/customer-auth-store";
import { authApi } from "@motogearsouq/api-client";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogOut } from "lucide-react";

export function AdminTopBar() {
  const t = useTranslations("admin.topBar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const customer = useCustomerAuth((s) => s.customer);
  const isLoginPage = pathname === `/${locale}/admin/login`;

  if (isLoginPage) return null;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    router.push(`/${locale}/admin/login`);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-bg/60 backdrop-blur-sm px-6 py-4">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-fg">
            {t("title")}
          </span>
          <LocaleSwitcher />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-2">
            {customer?.email && (
              <span className="text-xs text-muted truncate max-w-[200px]">
                {customer.email}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t("logout")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
