"use client";

import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useCustomerAuth } from "@/lib/customer-auth-store";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AdminTopBar() {
  const t = useTranslations("admin.topBar");
  const locale = useLocale();
  const pathname = usePathname();
  const customer = useCustomerAuth((s) => s.customer);
  const isLoginPage = pathname === `/${locale}/admin/login`;

  if (isLoginPage) return null;

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
          {customer?.email && (
            <span className="text-xs text-muted truncate max-w-[200px]">
              {customer.email}
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
