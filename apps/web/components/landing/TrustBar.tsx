"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
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
    <section className="relative z-20 -mt-10 md:-mt-12 px-4 mb-8">
      <Container size="xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <FadeIn key={item.id} delay={Math.min(index * 0.05, 0.3)} className="h-full">
                <Card
                  padding="md"
                  className="bg-card border-border shadow-xl rounded-2xl flex items-center gap-3 sm:gap-4 p-3 sm:p-5 h-full hover:border-brand-red/50 transition-colors"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-fg text-sm sm:text-base mb-0.5">{item.title}</h3>
                    <p className="text-muted text-[11px] sm:text-xs">{item.subtitle}</p>
                  </div>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
