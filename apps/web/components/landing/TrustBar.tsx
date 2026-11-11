"use client";

import { useTranslations } from "next-intl";
import { Truck, Banknote, Store, Headphones } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

export function TrustBar() {
  const t = useTranslations("landing.trustBar");

  const items = [
    {
      id: "delivery",
      icon: Truck,
      title: t("delivery"),
      subtitle: t("deliverySub"),
    },
    {
      id: "cod",
      icon: Banknote,
      title: t("cod"),
      subtitle: t("codSub"),
    },
    {
      id: "wholesale",
      icon: Store,
      title: t("wholesale"),
      subtitle: t("wholesaleSub"),
    },
    {
      id: "support",
      icon: Headphones,
      title: t("support"),
      subtitle: t("supportSub"),
    },
  ];

  return (
    <section className="relative z-20 -mt-10 md:-mt-12 mb-8 py-6 sm:py-8 px-4 sm:px-6">
      <div className="rounded-2xl bg-card border border-border overflow-hidden max-w-4xl mx-auto shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/50">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <FadeIn key={item.id} delay={Math.min(index * 0.05, 0.3)} className="h-full">
                <div className="h-full bg-card flex flex-col items-center justify-center gap-3 py-6 px-4 sm:py-8 text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-fg text-center leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted text-center leading-snug">
                    {item.subtitle}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
