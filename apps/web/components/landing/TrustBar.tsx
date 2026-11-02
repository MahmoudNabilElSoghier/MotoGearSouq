"use client";

import { trustBar } from "@/lib/content";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";
import { useCountUp } from "@/components/ui/useCountUp";

interface TrustItem {
  id: string;
  value: string;
}

function Stat({ item, index }: { item: TrustItem; index: number }) {
  const t = useTranslations("trustBar");
  const match = /^(\d+)(.*)$/.exec(item.value);
  const target = match ? Number(match[1]) : 0;
  const suffix = match ? match[2] : "";
  const { value, ref } = useCountUp(target);

  return (
    <FadeIn delay={Math.min(index * 0.05, 0.3)} className="h-full">
      <Card padding="md" className="border-border/50 bg-bg/40 h-full">
        <div
          ref={ref}
          className="text-3xl md:text-4xl font-extrabold text-accent mb-2"
        >
          {value}
          {suffix}
        </div>
        <div className="text-sm md:text-base text-muted font-medium">
          {t(`${item.id}.label`)}
        </div>
      </Card>
    </FadeIn>
  );
}

export function TrustBar() {
  return (
    <section id="trust-bar" className="py-12 bg-card border-y border-border scroll-mt-24">
      <Container size="xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {trustBar.map((item, index) => (
            <Stat key={item.id} item={item} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}
