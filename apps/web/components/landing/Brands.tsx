import { brands } from "@/lib/content";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { ArrowRight } from "lucide-react";

export function Brands() {
  const t = useTranslations("brands");
  const tc = useTranslations("categories");
  const locale = useLocale();

  return (
    <section id="brands" className="py-12 md:py-16 bg-bg scroll-mt-24">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {brands.map((brand, index) => (
            <FadeIn key={brand.slug} delay={Math.min(index * 0.05, 0.3)} className="h-full">
              <Link
                href={`/${locale}/products?brand=${brand.slug}`}
                className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <Card
                  padding="md"
                  className="group bg-card border-border flex flex-col items-center justify-center text-center p-6 gap-3 min-h-[150px] h-full hover:border-brand-red/50 hover:bg-brand-red/5 transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-brand-red/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <span className="text-2xl font-bold text-brand-red">
                      {brand.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-bold text-base text-fg tracking-wide group-hover:text-brand-red transition-colors">
                    {brand.name}
                  </span>
                </Card>
              </Link>
            </FadeIn>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Button variant="primary" size="lg" asChild className="bg-brand-red hover:bg-red-700">
            <Link href={`/${locale}/brands`} className="inline-flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              {tc("cta.browseAllBrands")}
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
