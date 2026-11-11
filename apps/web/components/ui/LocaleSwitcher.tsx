"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";

export function LocaleSwitcher() {
  const t = useTranslations("switcher");
  const locale = useLocale();
  const pathname = usePathname();

  // Strip the current locale prefix so the target locale can be swapped in.
  const segments = pathname.split("/");
  const current = segments[1] ?? "";
  const rest = ["ar", "en"].includes(current) ? pathname.slice(current.length + 1) : pathname;

  const target = locale === "ar" ? "en" : "ar";
  const targetLabel = target === "ar" ? t("arabic") : t("english");

  const handleSwitch = () => {
    document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <nav aria-label={t("languageAria")} className="inline-flex">
      <Link
        href={`/${target}${rest}`}
        onClick={handleSwitch}
        hrefLang={target}
        aria-label={t("switchTo", { language: targetLabel })}
        title={t("switchTo", { language: targetLabel })}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-bg/60 px-2.5 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        {locale === "ar" ? t("english") : t("arabic")}
      </Link>
    </nav>
  );
}
