import { testimonials } from "@/lib/content";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Star, Quote } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

export function Testimonials() {
  const t = useTranslations("testimonials");

  return (
    <section id="testimonials" className="py-6 sm:py-10 md:py-16 bg-bg scroll-mt-24">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <FadeIn key={item.id} delay={Math.min(index * 0.05, 0.3)} className="h-full">
              <Card padding="lg" className="bg-card border-border flex flex-col justify-between h-full hover:border-brand-red/50 transition-colors">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-brand-red/30 mb-2" />
                  <p className="text-muted text-base leading-relaxed mb-6">
                    &ldquo;{t(`items.${item.id}.text`)}&rdquo;
                  </p>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="font-bold text-fg">{t(`items.${item.id}.name`)}</div>
                  <div className="text-sm text-muted">{t(`items.${item.id}.role`)}</div>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      </Container>
    </section>
  );
}
