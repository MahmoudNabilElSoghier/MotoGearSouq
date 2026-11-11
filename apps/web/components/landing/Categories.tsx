import { getTranslations } from "next-intl/server";
import {
  getLandingSections,
  type LandingSectionRow,
} from "@motogearsouq/api-client";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import {
  ArrowRight,
  Bike,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Shield,
  Tag,
  Wrench,
} from "lucide-react";
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

// Resolves a CMS photo value into a usable src: absolute/protocol-relative
// values pass through, storage keys are prefixed with the public API origin.
const resolvePhoto = (rawPhoto?: string | null): string | null =>
  rawPhoto
    ? rawPhoto.startsWith("http") || rawPhoto.startsWith("/")
      ? rawPhoto
      : `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/api$/, "")}/${rawPhoto}`
    : null;

// Normalized card shape fed to <CategoryCard /> — mapped either from CMS
// sections (LandingSectionRow.cards) or from the static fallback items.
interface CategoryCardData {
  id: string;
  title: string;
  image?: string | null;
  link: string;
  Icon: typeof Bike;
}

function SectionHeader({ tag, title }: { tag: "h2" | "h3"; title: string }) {
  const TagEl = tag;
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex flex-col gap-1.5">
        <TagEl className="text-xl font-bold text-fg truncate">{title}</TagEl>
        <span className="block h-1 w-8 bg-brand-red" aria-hidden="true" />
      </div>
      <LayoutGrid
        className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-brand-red"
        aria-hidden="true"
      />
    </div>
  );
}

function CategoryCard({
  card,
  isAr,
  index,
}: {
  card: CategoryCardData;
  isAr: boolean;
  index: number;
}) {
  const { link, title, image, Icon } = card;
  return (
    <FadeIn delay={Math.min(index * 0.05, 0.3)} className="h-full">
      <Link
        href={link}
        className="group relative flex flex-col items-center gap-2"
      >
        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-border bg-card">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              sizes="(min-width: 1024px) 16vw, (min-width: 768px) 25vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-red/10 via-brand-red/5 to-transparent text-brand-red transition-transform duration-500 group-hover:scale-105">
              <Icon
                className="h-10 w-10 sm:h-12 sm:w-12"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
          )}

          <div
            className="absolute bottom-0 start-0 w-10 h-10 bg-brand-red flex items-end justify-start p-0.5 z-10 sm:w-12 sm:h-12 sm:p-1"
            style={{
              clipPath: isAr
                ? "polygon(100% 100%, 0 100%, 100% 0)"
                : "polygon(0 100%, 100% 100%, 0 0)",
            }}
            aria-hidden="true"
          >
            <Icon className="w-4 h-4 text-white sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="flex items-center justify-between w-full px-1 gap-2">
          <span className="text-xs sm:text-sm font-bold leading-tight text-fg">{title}</span>
          {isAr ? (
            <ChevronLeft
              className="w-4 h-4 shrink-0 text-muted transition-colors group-hover:text-brand-red"
              aria-hidden="true"
            />
          ) : (
            <ChevronRight
              className="w-4 h-4 shrink-0 text-muted transition-colors group-hover:text-brand-red"
              aria-hidden="true"
            />
          )}
        </div>
      </Link>
    </FadeIn>
  );
}

const GRID_CLASSES = "grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-4 lg:grid-cols-6 items-start";

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

  const fallbackCards: CategoryCardData[] = [
    { id: "new-motorcycles", link: `/${locale}/products`, title: t("items.new-motorcycles.title"), image: null, Icon: Bike },
    { id: "used-motorcycles", link: `/${locale}/products`, title: t("items.used-motorcycles.title"), image: null, Icon: Bike },
    { id: "spare-parts", link: `/${locale}/products`, title: t("items.spare-parts.title"), image: null, Icon: Wrench },
    { id: "accessories", link: `/${locale}/products`, title: t("items.accessories.title"), image: null, Icon: Shield },
  ];

  return (
    <section id="categories" className="pt-4 md:pt-6 pb-12 md:pb-16 bg-bg scroll-mt-24">
      <Container size="xl">
        {sections.length === 0 ? (
          <>
            <FadeIn>
              <SectionHeader tag="h2" title={t("title")} />
            </FadeIn>
            <div className={GRID_CLASSES}>
              {fallbackCards.map((card, index) => (
                <CategoryCard key={card.id} card={card} isAr={isAr} index={index} />
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-10 md:space-y-12">
            {sections.map((section) => (
              <div
                key={section.slug}
                id={section.slug}
                className="scroll-mt-24"
              >
                <FadeIn>
                  <SectionHeader
                    tag="h3"
                    title={isAr ? section.titleAr : section.titleEn}
                  />
                  {(section.subtitleAr || section.subtitleEn) && (
                    <p className="mb-6 max-w-2xl text-sm text-muted">
                      {isAr ? section.subtitleAr : section.subtitleEn}
                    </p>
                  )}
                </FadeIn>

                <div className={GRID_CLASSES}>
                  {section.cards.map((card, index) => (
                    <CategoryCard
                      key={card.id}
                      card={{
                        id: card.id,
                        title: isAr ? card.titleAr : card.titleEn,
                        image: resolvePhoto(card.photo),
                        link: card.link,
                        Icon: getCardIcon(section.slug, card.titleEn),
                      }}
                      isAr={isAr}
                      index={index}
                    />
                  ))}
                </div>

                {(() => {
                  const ctaLabel = isAr ? section.ctaLabelAr : section.ctaLabelEn;
                  const ctaLink = section.ctaLink;
                  if (!ctaLabel || !ctaLink) return null;
                  return (
                    <div className="mt-6">
                      <Button
                        variant="primary"
                        asChild
                        className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-red hover:bg-red-700"
                      >
                        <Link href={ctaLink}>
                          <ArrowRight className="w-4 h-4" />
                          {ctaLabel}
                        </Link>
                      </Button>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
