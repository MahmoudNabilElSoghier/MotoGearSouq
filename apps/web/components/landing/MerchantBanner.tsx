"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { Store, ArrowRight } from "lucide-react";

export function MerchantBanner() {
  const t = useTranslations("landing.merchant");
  const locale = useLocale();

  return (
    <section className="py-12 md:py-16 bg-bg">
      <Container size="xl">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-dark via-neutral-900 to-brand-red p-8 md:p-12 text-white shadow-2xl border border-white/15">
            {/* Background glowing decoration */}
            <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-brand-red/25 blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-brand-gold/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-start">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-gold text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  <Store className="w-4 h-4" />
                  {locale === "ar" ? "برنامج التجار والورش" : "B2B Merchants Program"}
                </div>
                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                  {t("title")}
                </h2>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                  {t("subtitle")}
                </p>
              </div>

              <div className="shrink-0">
                <Button
                  variant="primary"
                  size="lg"
                  asChild
                  className="bg-brand-red hover:bg-red-700 text-white font-bold px-8 py-4 text-base shadow-lg transition-transform hover:scale-105"
                >
                  <Link href={`/${locale}/register?type=merchant`} className="inline-flex items-center gap-2">
                    <span>{t("cta")}</span>
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
