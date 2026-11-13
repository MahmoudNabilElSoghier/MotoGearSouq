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
    <section className="relative z-20 -mt-12 sm:-mt-20 md:-mt-24 mb-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/50">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <FadeIn key={item.id} delay={Math.min(index * 0.05, 0.3)} className="h-full">
                  <div className="h-full bg-card flex flex-col items-center justify-center gap-2 sm:gap-3 py-4 px-1 sm:py-6 sm:px-4 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold leading-tight text-center text-fg">
                      {item.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted leading-tight text-center mt-1">
                      {item.subtitle}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
