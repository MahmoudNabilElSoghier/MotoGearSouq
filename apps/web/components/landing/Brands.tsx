import { brands } from "@/lib/content";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function Brands() {
  const t = useTranslations("brands");
  const tc = useTranslations("categories");
  const locale = useLocale();

  return (
    <section id="brands" className="py-20 md:py-28 bg-bg scroll-mt-24">
      <Container size="xl">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-16">
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
              {/* TODO: replace with real logo */}
              <Link
                href={`/${locale}/products?brand=${brand.slug}`}
                className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <Card
                  padding="md"
                  className="group bg-card/55 border-border flex flex-col items-center justify-center text-center min-h-[160px] h-full hover:border-accent/40 transition-colors"
                >
                  <div className="w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105">
                    <span className="text-3xl font-extrabold text-accent">
                      {brand.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-bold text-base text-fg tracking-wide">
                    {brand.name}
                  </span>
                </Card>
              </Link>
            </FadeIn>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <Button variant="primary" size="lg" asChild>
            <Link href={`/${locale}/brands`}>{tc("cta.browseAllBrands")}</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
