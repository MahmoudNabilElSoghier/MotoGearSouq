import { categories } from "@/lib/content";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, Bike, Wrench, Shield, Compass } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

const icons = [Bike, Compass, Wrench, Shield];

const typeByCategory: Record<string, string> = {
  "new-motorcycles": "new",
  "used-motorcycles": "used",
  "spare-parts": "spare-parts",
  accessories: "accessories",
};

type CategoryEntry = {
  category: (typeof categories)[number];
  index: number;
};

export function Categories() {
  const t = useTranslations("categories");
  const locale = useLocale();

  const withIndex: CategoryEntry[] = categories.map((category, index) => ({ category, index }));
  const modelEntries = withIndex.filter(({ category }) =>
    ["new-motorcycles", "used-motorcycles"].includes(category.id)
  );
  const spareEntries = withIndex.filter(({ category }) => category.id === "spare-parts");
  const accessoryEntries = withIndex.filter(({ category }) => category.id === "accessories");

  const renderCard = ({ category, index }: CategoryEntry) => {
    const Icon = icons[index % icons.length];
    return (
      <FadeIn key={category.id} delay={Math.min(index * 0.05, 0.3)} className="h-full">
        <Link
          href={`/${locale}/products?type=${typeByCategory[category.id] ?? ""}`}
          className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Card
            hover
            padding="lg"
            className="flex flex-col justify-between h-full cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-white transition-colors">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t(`items.${category.id}.title`)}</h3>
              <p className="text-muted text-sm leading-relaxed mb-6">
                {t(`items.${category.id}.description`)}
              </p>
            </div>
            <div className="flex items-center justify-between text-accent text-sm font-semibold">
              <span>{t("cta.explore")}</span>
              {locale === "ar" ? (
                <ArrowLeft className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
              ) : (
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              )}
            </div>
          </Card>
        </Link>
      </FadeIn>
    );
  };

  const renderGroup = (
    id: string,
    titleKey: string,
    entries: CategoryEntry[],
    ctaHref: string,
    ctaKey: string,
    extraClass: string
  ) => (
    <div id={id} className={`scroll-mt-24 ${extraClass}`}>
      <h3 className="text-xl md:text-2xl font-bold mb-6">{t(titleKey)}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {entries.map(renderCard)}
      </div>
      <div className="mt-6">
        <Button variant="primary" asChild className="inline-flex items-center justify-center gap-2">
          <Link href={ctaHref}>
            <ArrowRight className="w-4 h-4" />
            {t(ctaKey)}
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <section id="categories" className="py-20 md:py-28 bg-bg scroll-mt-24">
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

        {renderGroup(
          "models",
          "modelsTitle",
          modelEntries,
          `/${locale}/products?type=new`,
          "cta.browseModels",
          ""
        )}
        {renderGroup(
          "spare-parts",
          "sparePartsTitle",
          spareEntries,
          `/${locale}/products?type=spare-parts`,
          "cta.browseSpareParts",
          "mt-16"
        )}
        {renderGroup(
          "accessories",
          "accessoriesTitle",
          accessoryEntries,
          `/${locale}/products?type=accessories`,
          "cta.browseAccessories",
          "mt-16"
        )}
      </Container>
    </section>
  );
}
