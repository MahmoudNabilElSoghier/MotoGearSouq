import { whyUs } from "@/lib/content";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ShieldCheck, Wrench, CreditCard, Truck, Award, Headphones } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

const icons = [ShieldCheck, Wrench, CreditCard, Truck, Award, Headphones];

export function WhyUs() {
  const t = useTranslations("whyUs");

  return (
    <section id="why-us" className="py-6 sm:py-10 md:py-16 bg-card border-y border-border scroll-mt-24">
      <Container size="xl">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              {t("title")}
            </h2>
            <p className="text-muted text-lg">
              {t("subtitle")}
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyUs.map((feature, index) => {
            const Icon = icons[index % icons.length];
            return (
              <FadeIn key={feature.id} delay={Math.min(index * 0.05, 0.3)} className="h-full">
                <Card
                  padding="lg"
                  className="bg-bg/50 border-border h-full flex flex-col transition-all duration-300 hover:border-brand-red/50 hover:bg-brand-red/5 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="w-14 h-14 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{t(`items.${feature.id}.title`)}</h3>
                  <p className="text-muted text-sm md:text-base leading-relaxed">
                    {t(`items.${feature.id}.description`)}
                  </p>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
