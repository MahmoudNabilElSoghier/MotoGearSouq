import { getTranslations } from "next-intl/server";
import {
  getLandingSections,
  type LandingSectionRow,
} from "@motogearsouq/api-client";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Bike, ChevronLeft, ChevronRight, Wrench, Shield, Tag } from "lucide-react";
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

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {section.cards.map((card, index) => {
                    const IconComponent = getCardIcon(section.slug, card.titleEn);
                    const rawPhoto = card.photo;
                    const photo = rawPhoto
                      ? rawPhoto.startsWith("http") || rawPhoto.startsWith("/")
                        ? rawPhoto
                        : `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/api$/, "")}/${rawPhoto}`
                      : null;
                    const title = isAr ? card.titleAr : card.titleEn;
                    return (
                      <FadeIn
                        key={card.id}
                        delay={Math.min(index * 0.05, 0.3)}
                        className="h-full"
                      >
                        <Link
                          href={card.link}
                          className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card hover:border-brand-red transition-all duration-300"
                        >
                          <div className="relative h-40 w-full overflow-hidden bg-muted">
                            {photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={photo}
                                alt={title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-red/10 via-brand-red/5 to-transparent text-brand-red transition-transform duration-500 group-hover:scale-110">
                                <IconComponent
                                  className="h-14 w-14"
                                  strokeWidth={1.5}
                                  aria-hidden="true"
                                />
                              </div>
                            )}
                          </div>

                          <div
                            className="absolute right-0 bottom-12 h-16 w-16 bg-brand-red flex items-end justify-end p-2 z-10"
                            style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
                            aria-hidden="true"
                          >
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-card z-20 border-t border-border">
                            <span className="font-bold text-fg">{title}</span>
                            {isAr ? (
                              <ChevronLeft
                                className="h-5 w-5 text-muted transition-colors group-hover:text-brand-red"
                                aria-hidden="true"
                              />
                            ) : (
                              <ChevronRight
                                className="h-5 w-5 text-muted transition-colors group-hover:text-brand-red"
                                aria-hidden="true"
                              />
                            )}
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
