import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Package } from "lucide-react";
import { getBrands, getPartCategories, getProducts, totalStock } from "@motogearsouq/api-client";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string | string[];
    search?: string | string[];
    brand?: string | string[];
    cat?: string | string[];
    category?: string | string[];
    type?: string | string[];
    featured?: string | string[];
    priceMin?: string;
    priceMax?: string;
    page?: string;
  }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "قطع الغيار | MotoGearSouq" : "Spare Parts | MotoGearSouq",
    description:
      locale === "ar"
        ? "كتالوج قطع الغيار الأصلية — فلاتر، كابلات، بوجيهات، سلاسل وأكثر لكل ماركات الدراجات النارية."
        : "Genuine spare parts catalog for all motorcycle brands.",
  };
}

type ChipDef = { key: string; label: string; href: string };

function toList(value?: string | string[]): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function toFirst(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toFiniteNumber(value?: string): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function removeValue(params: URLSearchParams, key: string, value: string): void {
  const remaining = params.getAll(key).filter((item) => item !== value);
  params.delete(key);
  remaining.forEach((item) => params.append(key, item));
}

function stockBadge(stock: number, reorderLevel: number, locale: string) {
  if (stock <= 0) return { label: locale === "ar" ? "غير متوفر" : "Out of stock", classes: "bg-red-500/15 text-red-400" };
  if (stock <= reorderLevel)
    return { label: locale === "ar" ? "كمية محدودة" : "Low stock", classes: "bg-amber-500/15 text-amber-400" };
  return { label: locale === "ar" ? "متوفر" : "In stock", classes: "bg-emerald-500/15 text-emerald-400" };
}

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "products" });
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const search = toFirst(sp.search) || toFirst(sp.q);
  const typeFilter = toFirst(sp.type);
  const brandList = toList(sp.brand);
  const catList = toList(sp.category ?? sp.cat);
  const featured = toFirst(sp.featured) === "true";
  const priceMin = toFiniteNumber(sp.priceMin);
  const priceMax = toFiniteNumber(sp.priceMax);
  const pageNum = Math.max(1, Number(toFirst(sp.page)) || 1);

  const [result, brands, categories] = await Promise.all([
    getProducts({
      q: search || undefined,
      brandSlug: brandList.length ? brandList : undefined,
      categorySlug: catList.length ? catList : undefined,
      type: typeFilter || undefined,
      featured,
      priceMin,
      priceMax,
      page: pageNum,
      pageSize: 12,
    }),
    getBrands(),
    getPartCategories(),
  ]);

  const buildHref = (mutate?: (params: URLSearchParams) => void, target?: number): string => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (typeFilter) p.set("type", typeFilter);
    brandList.forEach((slug) => p.append("brand", slug));
    catList.forEach((slug) => p.append("category", slug));
    if (featured) p.set("featured", "true");
    if (priceMin != null) p.set("priceMin", String(priceMin));
    if (priceMax != null) p.set("priceMax", String(priceMax));
    mutate?.(p);
    if (target && target > 1) p.set("page", String(target));
    const qs = p.toString();
    return `/${locale}/products${qs ? `?${qs}` : ""}`;
  };

  const typeLabels: Record<string, string> = {
    new: t("filters.typeNew"),
    used: t("filters.typeUsed"),
    "spare-parts": t("filters.typeSpareParts"),
    accessories: t("filters.typeAccessories"),
  };

  const chips: ChipDef[] = [];
  if (search) {
    chips.push({ key: "search", label: `${t("searchLabel")}: ${search}`, href: buildHref((p) => p.delete("search")) });
  }
  if (typeFilter) {
    chips.push({
      key: "type",
      label: `${t("filters.type")}: ${typeLabels[typeFilter] ?? typeFilter}`,
      href: buildHref((p) => p.delete("type")),
    });
  }
  brandList.forEach((slug) => {
    const brand = brands.find((item) => item.slug === slug);
    chips.push({
      key: `brand-${slug}`,
      label: `${t("filters.brand")}: ${brand?.nameAr ?? brand?.name ?? slug}`,
      href: buildHref((p) => removeValue(p, "brand", slug)),
    });
  });
  catList.forEach((slug) => {
    const category = categories.find((item) => item.slug === slug);
    chips.push({
      key: `category-${slug}`,
      label: `${t("filters.category")}: ${category?.nameAr ?? category?.name ?? slug}`,
      href: buildHref((p) => removeValue(p, "category", slug)),
    });
  });
  if (featured) {
    chips.push({ key: "featured", label: t("filters.featured"), href: buildHref((p) => p.delete("featured")) });
  }
  if (priceMin != null || priceMax != null) {
    const parts: string[] = [];
    if (priceMin != null) parts.push(`${t("filters.priceMin")} ${nf.format(priceMin)}`);
    if (priceMax != null) parts.push(`${t("filters.priceMax")} ${nf.format(priceMax)}`);
    chips.push({
      key: "price",
      label: parts.join(" – "),
      href: buildHref((p) => {
        p.delete("priceMin");
        p.delete("priceMax");
      }),
    });
  }

  const typeOptions: Array<{ value: string; label: string }> = [
    { value: "", label: t("filters.typeAll") },
    { value: "new", label: t("filters.typeNew") },
    { value: "used", label: t("filters.typeUsed") },
    { value: "spare-parts", label: t("filters.typeSpareParts") },
    { value: "accessories", label: t("filters.typeAccessories") },
  ];

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16">
      <Container size="xl" className="max-w-[1600px] w-full">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-fg">{t("heading")}</h1>
        </div>

        {chips.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <Link
                key={chip.key}
                href={chip.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-fg transition-colors hover:border-accent"
              >
                {chip.label}
                <span aria-hidden="true">×</span>
              </Link>
            ))}
            <Link
              href={`/${locale}/products`}
              className="text-xs font-semibold text-accent hover:underline"
            >
              {t("filters.clearAll")}
            </Link>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <aside className="sticky top-24 hidden md:block w-72 shrink-0">
            <form
              action={`/${locale}/products`}
              method="get"
              className="space-y-6 rounded-xl border border-border bg-card p-4"
            >
              {search && <input type="hidden" name="search" value={search} />}
              {featured && <input type="hidden" name="featured" value="true" />}
              {priceMin != null && <input type="hidden" name="priceMin" value={String(priceMin)} />}
              {priceMax != null && <input type="hidden" name="priceMax" value={String(priceMax)} />}

              <fieldset>
                <legend className="text-sm font-semibold text-fg">{t("filters.type")}</legend>
                <div className="mt-2 space-y-1.5">
                  {typeOptions.map((option) => (
                    <label key={option.value || "all"} className="flex items-center gap-2 text-sm text-muted">
                      <input
                        type="radio"
                        name="type"
                        value={option.value}
                        defaultChecked={typeFilter === option.value}
                        className="h-4 w-4 accent-accent"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-fg">{t("filters.brand")}</legend>
                <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                  {brands.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-sm text-muted">
                      <input
                        type="checkbox"
                        name="brand"
                        value={item.slug}
                        defaultChecked={brandList.includes(item.slug)}
                        className="h-4 w-4 accent-accent"
                      />
                      {item.nameAr ?? item.name}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-fg">{t("filters.category")}</legend>
                <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                  {categories.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-sm text-muted">
                      <input
                        type="checkbox"
                        name="category"
                        value={item.slug}
                        defaultChecked={catList.includes(item.slug)}
                        className="h-4 w-4 accent-accent"
                      />
                      {item.parentId ? "└ " : ""}
                      {item.nameAr ?? item.name}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label={t("filters.priceMin")}
                  name="priceMin"
                  inputMode="numeric"
                  className="w-full"
                  defaultValue={priceMin != null ? String(priceMin) : ""}
                />
                <Input
                  label={t("filters.priceMax")}
                  name="priceMax"
                  inputMode="numeric"
                  className="w-full"
                  defaultValue={priceMax != null ? String(priceMax) : ""}
                />
              </div>

              <Button type="submit" variant="secondary" fullWidth>
                {t("filters.apply")}
              </Button>
            </form>
          </aside>

          <div className="flex-1 min-w-0 w-full">
            <form
              action={`/${locale}/products`}
              method="get"
              className="mb-4 flex items-end gap-2"
            >
              <div className="flex-1">
                <Input
                  label={t("searchLabel")}
                  name="search"
                  defaultValue={search}
                  placeholder={t("searchPlaceholder")}
                />
              </div>
              {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
              {brandList.map((slug) => (
                <input key={slug} type="hidden" name="brand" value={slug} />
              ))}
              {catList.map((slug) => (
                <input key={slug} type="hidden" name="category" value={slug} />
              ))}
              {featured && <input type="hidden" name="featured" value="true" />}
              {priceMin != null && <input type="hidden" name="priceMin" value={String(priceMin)} />}
              {priceMax != null && <input type="hidden" name="priceMax" value={String(priceMax)} />}
              <Button type="submit" variant="primary">
                {t("searchLabel")}
              </Button>
            </form>

            <p className="mb-4 text-sm text-muted" aria-live="polite">
              {t("filters.resultsCount", { count: nf.format(result.total) })}
            </p>

            {result.items.length === 0 ? (
              <div className="rounded-xl border border-border bg-card px-4 py-12 text-center">
                <p className="text-muted">{t("filters.empty")}</p>
                <Button asChild variant="secondary" className="mt-4">
                  <Link href={`/${locale}/products`}>{t("filters.viewAll")}</Link>
                </Button>
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                {result.items.map((product) => {
                  const stock = totalStock(product);
                  const badge = stockBadge(stock, product.reorderLevel, locale);
                  const imageUrl = product.imageUrl || product.images?.[0]?.url;
                  return (
                    <li key={product.id} className="h-full">
                      <Link
                        href={`/${locale}/products/${product.code}`}
                        className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent"
                      >
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted/50">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted">
                              <Package className="h-10 w-10 opacity-40" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs text-muted" dir="ltr">
                            {product.code}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <h2 className="font-bold text-fg group-hover:text-accent line-clamp-2" dir="auto">
                          {product.name}
                        </h2>
                        <p className="text-sm text-muted">
                          {[product.brand?.nameAr, product.partCategory?.nameAr]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <p className="text-lg font-extrabold text-fg">
                            {product.retailPrice != null ? (
                              <span dir="ltr">
                                {nf.format(product.retailPrice)} {locale === "ar" ? "ج.م" : "EGP"}
                              </span>
                            ) : (
                              (locale === "ar" ? "عند التواصل" : "Contact for price")
                            )}
                          </p>
                          <AddToCartButton product={{ id: product.id, code: product.code, name: product.name, retailPrice: product.retailPrice, taxRate: product.taxRate }} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {result.totalPages > 1 && (
              <nav
                aria-label={t("paginationAria")}
                className="mt-8 flex items-center justify-between text-sm"
              >
                <Link
                  href={buildHref(undefined, result.page - 1)}
                  aria-disabled={result.page <= 1}
                  className={`rounded-lg border border-border px-4 py-2 font-semibold ${
                    result.page <= 1
                      ? "pointer-events-none opacity-40"
                      : "text-fg hover:border-accent"
                  }`}
                >
                  {locale === "ar" ? "السابق" : "Previous"}
                </Link>
                <span className="text-muted">
                  {locale === "ar" ? (
                    <>صفحة <span dir="ltr">{nf.format(result.page)}</span> من <span dir="ltr">{nf.format(result.totalPages)}</span></>
                  ) : (
                    <>Page <span dir="ltr">{nf.format(result.page)}</span> of <span dir="ltr">{nf.format(result.totalPages)}</span></>
                  )}
                </span>
                <Link
                  href={buildHref(undefined, result.page + 1)}
                  aria-disabled={result.page >= result.totalPages}
                  className={`rounded-lg border border-border px-4 py-2 font-semibold ${
                    result.page >= result.totalPages
                      ? "pointer-events-none opacity-40"
                      : "text-fg hover:border-accent"
                  }`}
                >
                  {locale === "ar" ? "التالي" : "Next"}
                </Link>
              </nav>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-muted">{t("vatNote")}</p>
      </Container>
    </main>
  );
}
