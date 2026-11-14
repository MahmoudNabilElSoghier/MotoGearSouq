import { getTranslations } from "next-intl/server";
import {
  getPartCategories,
  getProducts,
} from "@motogearsouq/api-client";
import type { PartCategory } from "@motogearsouq/shared";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import {
  Bike,
  ChevronRight,
  LayoutGrid,
  Shield,
  Tag,
  Wrench,
} from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

const getCardIcon = (title: string) => {
  const lower = title.toLowerCase();
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

// Normalized card shape fed to <CategoryCard /> — mapped from the part
// categories (with product cover images) or from the static fallback items.
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
      <div className="flex items-center gap-2">
        <span
          className="block h-1 w-6 bg-brand-red rounded-full"
          aria-hidden="true"
        />
        <TagEl className="text-lg font-bold text-fg">{title}</TagEl>
      </div>
      <LayoutGrid
        className="w-5 h-5 shrink-0 text-brand-red"
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
        className="group relative flex flex-col items-center gap-1 w-full h-full"
      >
        <div className="relative w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-muted/30 border border-border">
          {image ? (
            /* object-cover = full bleed (heroes, banners), object-contain = show entire image (cards, products) */
            <Image
              src={image}
              alt={title}
              fill
              sizes="(min-width: 1024px) 16vw, (min-width: 640px) 20vw, 33vw"
              className="object-contain p-2 w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted/40 transition-transform duration-500 group-hover:scale-105">
              <Icon
                className="h-6 w-6 sm:h-8 sm:w-8"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
          )}

          <div
            className="absolute bottom-0 start-0 w-7 h-7 sm:w-8 sm:h-8 bg-brand-red flex items-end justify-start p-0.5 z-10"
            style={{
              clipPath: isAr
                ? "polygon(100% 100%, 0 100%, 100% 0)"
                : "polygon(0 100%, 100% 100%, 0 0)",
            }}
            aria-hidden="true"
          >
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="flex items-center justify-between w-full px-0.5 mt-1.5">
          <span className="text-[10px] sm:text-xs font-bold text-fg truncate">{title}</span>
          <ChevronRight
            className="w-3 h-3 text-muted rtl:rotate-180 transition-colors group-hover:text-brand-red shrink-0"
            aria-hidden="true"
          />
        </div>
      </Link>
    </FadeIn>
  );
}

const GRID_CLASSES =
  "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3";

export default async function Categories({
  locale,
}: {
  locale: string;
}) {
  const t = await getTranslations("categories");
  const isAr = locale === "ar";

  let categories: PartCategory[] = [];
  try {
    categories = await getPartCategories();
  } catch {
    categories = [];
  }

  // Cover image per category: the primary (else first) image of its products.
  // Placeholder hosts (example.com) are skipped so a broken URL never renders
  // as an empty box — the icon fallback takes over instead.
  const coverByCategory = new Map<string, string>();
  if (categories.length > 0) {
    try {
      const productPage = await getProducts({
        pageSize: 100,
        includeInactive: true,
      });
      for (const product of productPage.items) {
        if (!product.partCategoryId || coverByCategory.has(product.partCategoryId)) {
          continue;
        }
        const images = product.images ?? [];
        const url =
          images.find((img) => img.isPrimary)?.url ?? images[0]?.url;
        if (!url || url.includes("example.com")) continue;
        coverByCategory.set(product.partCategoryId, url);
      }
    } catch {
      // No covers available — cards fall back to icons.
    }
  }

  const cards: CategoryCardData[] = categories.map((category) => {
    const title = isAr ? (category.nameAr ?? category.name) : category.name;
    return {
      id: category.id,
      title,
      image: resolvePhoto(coverByCategory.get(category.id) ?? null),
      link: `/${locale}/products?category=${encodeURIComponent(category.slug)}`,
      Icon: getCardIcon(title),
    };
  });

  const fallbackCards: CategoryCardData[] = [
    { id: "new-motorcycles", link: `/${locale}/products`, title: t("items.new-motorcycles.title"), image: null, Icon: Bike },
    { id: "used-motorcycles", link: `/${locale}/products`, title: t("items.used-motorcycles.title"), image: null, Icon: Bike },
    { id: "spare-parts", link: `/${locale}/products`, title: t("items.spare-parts.title"), image: null, Icon: Wrench },
    { id: "accessories", link: `/${locale}/products`, title: t("items.accessories.title"), image: null, Icon: Shield },
  ];

  const list = cards.length > 0 ? cards : fallbackCards;

  return (
    <section id="categories" className="pt-2 sm:pt-4 pb-6 md:pb-12 bg-bg scroll-mt-24">
      <Container size="xl">
        <FadeIn>
          <SectionHeader tag="h2" title={t("title")} />
        </FadeIn>
        <div className={GRID_CLASSES}>
          {list.map((card, index) => (
            <CategoryCard key={card.id} card={card} isAr={isAr} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}
