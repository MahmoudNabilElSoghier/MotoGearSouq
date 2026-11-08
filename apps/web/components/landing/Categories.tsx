import { getTranslations } from "next-intl/server";
import {
  getLandingSections,
  type LandingSectionRow,
} from "@motogearsouq/api-client";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Bike, Wrench, Shield, Tag } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

const getCardIcon = (sectionSlug: string, cardTitle: string) => {
  const lower = (sectionSlug + " " + cardTitle).toLowerCase();
  if (lower.includes("motorcycle") || lower.includes("دراجات") || lower.includes("new") || lower.includes("used")) {
    return Bike;
  }
  if (lower.includes("spare") || lower.includes("غيار")) {
    return Wrench;
  }
  if (lower.includes("accessori") || lower.includes("إكسسوار")) {
    return Shield;
  }
  return Tag;
};

export default async function Categories({
  locale,
}: {
  locale: string;
}) {
  const t = await getTranslations("categories");
  const isAr = locale === "ar";

  let sections: LandingSectionRow[] = [];
  try {
    sections = await getLandingSections();
  } catch {
    sections = [];
  }

  return (
    <section id="categories" className="py-12 md:py-16 bg-bg scroll-mt-24">
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

        {sections.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-16 text-center text-muted">
            <p>{t("noSections")}</p>
          </div>
        ) : (
          <div className="space-y-12">
            {sections.map((section) => (
              <div
                key={section.slug}
                id={section.slug}
                className="scroll-mt-24"
              >
                <FadeIn>
                  <h3 className="text-2xl md:text-3xl font-extrabold mb-4">
                    {isAr ? section.titleAr : section.titleEn}
                  </h3>
                  {(section.subtitleAr || section.subtitleEn) && (
                    <p className="text-muted text-base mb-8 max-w-2xl">
                      {isAr ? section.subtitleAr : section.subtitleEn}
                    </p>
                  )}
                </FadeIn>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.cards.map((card) => {
                    const IconComponent = getCardIcon(section.slug, card.titleEn);
                    return (
                      <FadeIn
                        key={card.id}
                        delay={Math.min(
                          section.cards.indexOf(card) * 0.05,
                          0.3
                        )}
                        className="h-full"
                      >
                        <Link
                          href={card.link}
                          className="group block h-full rounded-xl border border-border bg-card p-6 hover:border-brand-red/50 hover:bg-brand-red/5 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0 transition-transform duration-300 group-hover:scale-105">
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-fg mb-1 text-lg group-hover:text-brand-red transition-colors">
                                {isAr ? card.titleAr : card.titleEn}
                              </h4>
                              {(card.descAr || card.descEn) && (
                                <p className="text-muted text-sm leading-relaxed">
                                  {isAr ? card.descAr : card.descEn}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      </FadeIn>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <Button
                    variant="primary"
                    asChild
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-red hover:bg-red-700"
                  >
                    <Link href={section.ctaLink}>
                      <ArrowRight className="w-4 h-4" />
                      {isAr ? section.ctaLabelAr : section.ctaLabelEn}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
