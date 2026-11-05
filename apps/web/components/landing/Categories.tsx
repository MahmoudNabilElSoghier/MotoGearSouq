import { getTranslations } from "next-intl/server";
import {
  getLandingSections,
  type LandingSectionRow,
} from "@motogearsouq/api-client";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

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

        {sections.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-16 text-center text-muted">
            <p>{t("noSections")}</p>
          </div>
        ) : (
          <div className="space-y-16">
            {sections.map((section) => (
              <div
                key={section.slug}
                id={section.slug}
                className="scroll-mt-24"
              >
                <FadeIn>
                  <h3 className="text-3xl md:text-4xl font-extrabold mb-6">
                    {isAr ? section.titleAr : section.titleEn}
                  </h3>
                  {(section.subtitleAr || section.subtitleEn) && (
                    <p className="text-muted text-lg mb-10 max-w-2xl">
                      {isAr ? section.subtitleAr : section.subtitleEn}
                    </p>
                  )}
                </FadeIn>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.cards.map((card) => (
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
                        className="group block h-full rounded-xl border border-border bg-card p-6 hover:border-accent transition-colors"
                      >
                        <div>
                          <h4 className="font-bold text-fg mb-2">
                            {isAr ? card.titleAr : card.titleEn}
                          </h4>
                          {(card.descAr || card.descEn) && (
                            <p className="text-muted text-sm leading-relaxed">
                              {isAr ? card.descAr : card.descEn}
                            </p>
                          )}
                        </div>
                      </Link>
                    </FadeIn>
                  ))}
                </div>

                <div className="mt-8">
                  <Button
                    variant="primary"
                    asChild
                    className="inline-flex items-center justify-center gap-2 px-8 py-3"
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
