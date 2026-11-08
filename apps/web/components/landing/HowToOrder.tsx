"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { Card } from "@/components/ui/Card";
import { Search, ShoppingCart, Truck } from "lucide-react";

export function HowToOrder() {
  const t = useTranslations("landing.howToOrder");

  const steps = [
    {
      id: "step1",
      number: "01",
      icon: Search,
      title: t("step1Title"),
      desc: t("step1Desc"),
    },
    {
      id: "step2",
      number: "02",
      icon: ShoppingCart,
      title: t("step2Title"),
      desc: t("step2Desc"),
    },
    {
      id: "step3",
      number: "03",
      icon: Truck,
      title: t("step3Title"),
      desc: t("step3Desc"),
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-card border-y border-border scroll-mt-24">
      <Container size="xl">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{t("title")}</h2>
            <p className="text-muted text-lg">{t("subtitle")}</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <FadeIn key={step.id} delay={Math.min(index * 0.1, 0.3)} className="h-full">
                <Card
                  padding="lg"
                  className="bg-bg/50 border-border h-full flex flex-col items-center text-center p-8 rounded-2xl relative hover:border-brand-red/50 hover:bg-brand-red/5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute top-4 start-4 text-4xl font-black text-brand-red/15 select-none">
                    {step.number}
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center mb-6 shadow-sm">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-fg mb-3">{step.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{step.desc}</p>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
