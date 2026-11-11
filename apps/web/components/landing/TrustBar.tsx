"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
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
    <section className="relative z-20 -mt-10 md:-mt-12 mb-8 py-6 sm:py-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <FadeIn key={item.id} delay={Math.min(index * 0.05, 0.3)} className="h-full">
              <Card
                padding="none"
                className="h-full flex flex-col items-center justify-center text-center rounded-xl border border-border bg-card p-4 sm:p-5 md:p-6 min-h-[110px] sm:min-h-[130px] transition-colors hover:border-brand-red/50 shadow-xl"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center mb-2 sm:mb-3 shrink-0">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-xs sm:text-sm md:text-base font-bold text-fg leading-tight line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted leading-snug mt-1">
                  {item.subtitle}
                </p>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
