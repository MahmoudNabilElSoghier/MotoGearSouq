"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const BASE =
  "px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function LocaleSwitcher() {
  const t = useTranslations("switcher");
  const locale = useLocale();
  const pathname = usePathname();

  // Strip the current locale prefix so the target locale can be swapped in.
  const segments = pathname.split("/");
  const current = segments[1] ?? "";
  const rest = ["ar", "en"].includes(current) ? pathname.slice(current.length + 1) : pathname;

  const handleSwitch = (target: string) => {
    document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <nav
      aria-label={t("languageAria")}
      className="inline-flex items-center rounded-lg border border-border bg-bg/60 overflow-hidden"
    >
      <Link
        href={`/ar${rest}`}
        onClick={() => handleSwitch("ar")}
        hrefLang="ar"
        lang="ar"
        aria-current={locale === "ar" ? "true" : undefined}
        className={`${BASE} ${
          locale === "ar"
            ? "bg-accent-strong/15 text-fg"
            : "text-muted hover:text-fg"
        }`}
      >
        {t("arabic")}
      </Link>
      <span aria-hidden="true" className="w-px self-stretch bg-border" />
      <Link
        href={`/en${rest}`}
        onClick={() => handleSwitch("en")}
        hrefLang="en"
        lang="en"
        aria-current={locale === "en" ? "true" : undefined}
        className={`${BASE} ${
          locale === "en"
            ? "bg-accent-strong/15 text-fg"
            : "text-muted hover:text-fg"
        }`}
      >
        {t("english")}
      </Link>
    </nav>
  );
}
