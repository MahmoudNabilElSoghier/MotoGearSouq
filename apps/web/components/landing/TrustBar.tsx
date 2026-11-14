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
    <section className="relative z-20 -mt-4 sm:-mt-10 mb-6">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xl">
          <div className="grid grid-cols-4 gap-px bg-border/50">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <FadeIn key={item.id} delay={Math.min(index * 0.05, 0.3)} className="h-full">
                  <div className="h-full bg-card flex flex-col items-center justify-center gap-2 sm:gap-3 py-3 px-0.5 sm:py-4 sm:px-2 text-center">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 mb-1 sm:mb-2 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="text-[9px] sm:text-xs leading-[1.1] whitespace-normal font-bold text-center text-fg">
                      {item.title}
                    </h3>
                    <p className="text-[8px] sm:text-[10px] text-muted leading-tight text-center mt-1">
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
