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
        <div className="flex overflow-x-auto gap-3 snap-x snap-mandatory px-2 pb-2 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <FadeIn key={item.id} delay={Math.min(index * 0.05, 0.3)} className="h-full min-w-[270px] sm:min-w-[290px] md:min-w-0 snap-center shrink-0">
                <Card
                  padding="md"
                  className="bg-card border-border shadow-xl rounded-2xl flex items-center gap-4 p-5 h-full hover:border-brand-red/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-fg text-base mb-0.5">{item.title}</h3>
                    <p className="text-muted text-xs">{item.subtitle}</p>
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
