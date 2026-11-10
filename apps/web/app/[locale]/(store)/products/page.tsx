import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Check,
  Package,
  Repeat,
  Scooter,
} from "lucide-react";
import {
  getBrands,
  getModels,
  getPartCategories,
  getProducts,
  totalStock,
  type ProductPage,
} from "@motogearsouq/api-client";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { MachineModel } from "@motogearsouq/shared";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string | string[];
    search?: string | string[];
    category?: string | string[];
    cat?: string | string[];
    brand?: string | string[];
    type?: string | string[];
    model?: string | string[];
    page?: string;
  }>;
};

// Vehicle Finder URL shape: /products?category=...&brand=...&type=...&model=...
type Flow = { category?: string; brand?: string; type?: string; model?: string };
type View = "category" | "brand" | "type" | "model" | "results";

const VEHICLE_TYPES = ["motorcycle", "scooter"];

type Nameable = { name: string; nameAr?: string | null };

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

function toFirst(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
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
  const isAr = locale === "ar";
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  const search = toFirst(sp.search) || toFirst(sp.q);
  const categorySlug = toFirst(sp.category) || toFirst(sp.cat);
  const brandSlug = toFirst(sp.brand);
  const vehicleType = toFirst(sp.type);
  const modelSlug = toFirst(sp.model);
  const pageNum = Math.max(1, Number(toFirst(sp.page)) || 1);

  const [categories, brands] = await Promise.all([getPartCategories(), getBrands()]);

  const category = categorySlug ? categories.find((item) => item.slug === categorySlug) : undefined;
  const brand = brandSlug ? brands.find((item) => item.slug === brandSlug) : undefined;
  const vehicleOk = !!vehicleType && VEHICLE_TYPES.includes(vehicleType);

  let models: MachineModel[] = [];
  let model: MachineModel | undefined;
  let result: ProductPage | undefined;
  let view: View;

  if (!category) {
    view = "category";
  } else if (!brand) {
    view = "brand";
  } else if (!vehicleOk) {
    view = "type";
  } else {
    models = await getModels({ brandSlug: brand.slug, type: vehicleType });
    model = modelSlug ? models.find((item) => item.slug === modelSlug) : undefined;
    if (!model) {
      view = "model";
    } else {
      result = await getProducts({
        q: search || undefined,
        categorySlug: category.slug,
        modelId: model.id,
        page: pageNum,
        pageSize: 12,
      });
      view = "results";
    }
  }

  const localize = (item: Nameable): string => (isAr ? (item.nameAr ?? item.name) : item.name);
  const localizeAlt = (item: Nameable): string | null =>
    isAr ? (item.name === item.nameAr ? null : item.name) : item.nameAr ?? null;
  const typeLabel = vehicleType === "scooter" ? t("finder.scooter") : t("finder.motorcycle");

  const buildHref = (flow: Flow, page?: number): string => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (flow.category) p.set("category", flow.category);
    if (flow.brand) p.set("brand", flow.brand);
    if (flow.type) p.set("type", flow.type);
    if (flow.model) p.set("model", flow.model);
    if (page && page > 1) p.set("page", String(page));
    const qs = p.toString();
    return `/${locale}/products${qs ? `?${qs}` : ""}`;
  };

  const currentFlow: Flow = {
    category: category?.slug,
    brand: brand?.slug,
    type: vehicleOk ? vehicleType : undefined,
    model: model?.slug,
  };

  // stepHrefs[i] = URL that renders step i (used by the stepper and Back buttons).
  const stepHrefs = [
    buildHref({}),
    category ? buildHref({ category: category.slug }) : "",
    category && brand ? buildHref({ category: category.slug, brand: brand.slug }) : "",
    category && brand && vehicleOk
      ? buildHref({ category: category.slug, brand: brand.slug, type: vehicleType })
      : "",
  ];

  const steps = [
    { key: "category", label: t("finder.stepCategory"), value: category ? localize(category) : null },
    { key: "brand", label: t("finder.stepBrand"), value: brand ? localize(brand) : null },
    { key: "type", label: t("finder.stepType"), value: vehicleOk ? typeLabel : null },
    { key: "model", label: t("finder.stepModel"), value: model ? localize(model) : null },
  ];
  const stepIndex: Record<View, number> = { category: 0, brand: 1, type: 2, model: 3, results: 4 };

  const cardBase =
    "flex min-h-[88px] flex-col justify-center rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent hover:bg-accent/5";

  const stepHeader = (title: string, backHref: string | null) => (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-extrabold text-fg md:text-2xl">{title}</h2>
      {backHref && (
        <Button asChild variant="secondary" size="sm">
          <Link href={backHref} className="min-h-11 gap-2">
            <BackIcon className="h-4 w-4" aria-hidden="true" />
            {t("finder.back")}
          </Link>
        </Button>
      )}
    </div>
  );

  let body: ReactNode;

  if (view === "category") {
    body = (
      <section>
        {stepHeader(t("finder.selectCategory"), null)}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {categories.map((item) => (
            <li key={item.id}>
              <Link href={buildHref({ category: item.slug })} className={`${cardBase} gap-1`}>
                <span className="font-bold text-fg" dir="auto">
                  {localize(item)}
                </span>
                {localizeAlt(item) && (
                  <span className="text-xs text-muted" dir="auto">
                    {localizeAlt(item)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  } else if (view === "brand") {
    body = (
      <section>
        {stepHeader(t("finder.selectBrand"), stepHrefs[0])}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {brands.map((item) => (
            <li key={item.id}>
              <Link
                href={buildHref({ category: category?.slug, brand: item.slug })}
                className={`${cardBase} gap-2`}
              >
                {item.logoUrl ? (
                  <Image
                    src={item.logoUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-lg object-contain"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-base font-extrabold text-accent"
                  >
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="font-bold text-fg" dir="auto">
                  {localize(item)}
                </span>
                {localizeAlt(item) && (
                  <span className="text-xs text-muted" dir="auto">
                    {localizeAlt(item)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  } else if (view === "type") {
    const typeCards = [
      { value: "motorcycle", label: t("finder.motorcycle"), Icon: Bike },
      { value: "scooter", label: t("finder.scooter"), Icon: Scooter },
    ];
    body = (
      <section>
        {stepHeader(t("finder.selectType"), stepHrefs[1])}
        <ul className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {typeCards.map(({ value, label, Icon }) => (
            <li key={value}>
              <Link
                href={buildHref({
                  category: category?.slug,
                  brand: brand?.slug,
                  type: value,
                })}
                className={`${cardBase} min-h-[120px] items-center gap-3 text-center`}
              >
                <Icon className="h-10 w-10 text-accent" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-lg font-extrabold text-fg">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  } else if (view === "model") {
    body = (
      <section>
        {stepHeader(t("finder.selectModel"), stepHrefs[2])}
        {models.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-12 text-center">
            <p className="text-muted">{t("finder.noModels")}</p>
            <Button asChild variant="secondary" className="mt-4 min-h-11">
              <Link href={stepHrefs[2]}>{t("finder.back")}</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {models.map((item) => {
              const meta = [
                item.engineCc ? `${nf.format(item.engineCc)}cc` : null,
                item.yearFrom ? `${item.yearFrom}${item.yearTo ? `–${item.yearTo}` : ""}` : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={item.id}>
                  <Link
                    href={buildHref({
                      category: category?.slug,
                      brand: brand?.slug,
                      type: vehicleType,
                      model: item.slug,
                    })}
                    className={`${cardBase} gap-1`}
                  >
                    <span className="font-bold text-fg" dir="auto">
                      {localize(item)}
                    </span>
                    {meta && <span className="text-xs text-muted">{meta}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  } else {
    body = result ? (
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg" dir="auto">
              {[
                category ? localize(category) : null,
                brand ? localize(brand) : null,
                vehicleOk ? typeLabel : null,
                model ? localize(model) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="mt-1 text-sm text-muted" aria-live="polite">
              {t("filters.resultsCount", { count: nf.format(result.total) })}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href={buildHref({})} className="min-h-11 gap-2">
              <Repeat className="h-4 w-4" aria-hidden="true" />
              {t("finder.changeVehicle")}
            </Link>
          </Button>
        </div>

        {result.items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-12 text-center">
            <p className="text-muted">{t("filters.empty")}</p>
            <Button asChild variant="secondary" className="mt-4 min-h-11">
              <Link href={buildHref({})}>{t("finder.changeVehicle")}</Link>
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
                            {nf.format(product.retailPrice)} {isAr ? "ج.م" : "EGP"}
                          </span>
                        ) : (
                          (isAr ? "عند التواصل" : "Contact for price")
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
              href={buildHref(currentFlow, result.page - 1)}
              aria-disabled={result.page <= 1}
              className={`rounded-lg border border-border px-4 py-2 font-semibold ${
                result.page <= 1
                  ? "pointer-events-none opacity-40"
                  : "text-fg hover:border-accent"
              }`}
            >
              {isAr ? "السابق" : "Previous"}
            </Link>
            <span className="text-muted">
              {isAr ? (
                <>صفحة <span dir="ltr">{nf.format(result.page)}</span> من <span dir="ltr">{nf.format(result.totalPages)}</span></>
              ) : (
                <>Page <span dir="ltr">{nf.format(result.page)}</span> of <span dir="ltr">{nf.format(result.totalPages)}</span></>
              )}
            </span>
            <Link
              href={buildHref(currentFlow, result.page + 1)}
              aria-disabled={result.page >= result.totalPages}
              className={`rounded-lg border border-border px-4 py-2 font-semibold ${
                result.page >= result.totalPages
                  ? "pointer-events-none opacity-40"
                  : "text-fg hover:border-accent"
              }`}
            >
              {isAr ? "التالي" : "Next"}
            </Link>
          </nav>
        )}
      </section>
    ) : null;
  }

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16">
      <Container size="xl" className="max-w-[1600px] w-full">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-fg">{t("heading")}</h1>
          <p className="mt-2 text-muted">{t("finder.heading")}</p>
        </div>

        <form
          action={`/${locale}/products`}
          method="get"
          className="mb-6 flex items-end gap-2"
        >
          <div className="flex-1">
            <Input
              label={t("searchLabel")}
              name="search"
              defaultValue={search}
              placeholder={t("searchPlaceholder")}
            />
          </div>
          {category && <input type="hidden" name="category" value={category.slug} />}
          {brand && <input type="hidden" name="brand" value={brand.slug} />}
          {vehicleOk && <input type="hidden" name="type" value={vehicleType} />}
          {model && <input type="hidden" name="model" value={model.slug} />}
          <Button type="submit" variant="primary">
            {t("searchLabel")}
          </Button>
        </form>

        <ol className="mb-6 flex items-center gap-1 sm:gap-2">
          {steps.map((step, index) => {
            const state =
              index < stepIndex[view] ? "done" : index === stepIndex[view] ? "current" : "todo";
            const href = index < stepIndex[view] ? stepHrefs[index] : "";
            const circle =
              state === "current"
                ? "border-accent bg-accent/15 text-accent ring-2 ring-accent/30"
                : state === "done"
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-border bg-card text-muted";
            const label = state === "todo" ? "text-muted" : "text-fg";
            const inner = (
              <>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold sm:h-9 sm:w-9 ${circle}`}
                >
                  {state === "done" ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block truncate text-[11px] font-semibold sm:text-xs ${label}`}
                  >
                    {step.label}
                  </span>
                  {step.value && (
                    <span className="block truncate text-[10px] text-muted" dir="auto">
                      {step.value}
                    </span>
                  )}
                </span>
              </>
            );
            return (
              <li key={step.key} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
                {state === "done" && href ? (
                  <Link
                    href={href}
                    className="flex min-w-0 items-center gap-1.5 transition-opacity hover:opacity-75 sm:gap-2"
                  >
                    {inner}
                  </Link>
                ) : (
                  <span
                    aria-current={state === "current" ? "step" : undefined}
                    className="flex min-w-0 items-center gap-1.5 sm:gap-2"
                  >
                    {inner}
                  </span>
                )}
                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`h-px min-w-3 flex-1 sm:min-w-6 ${
                      index + 1 < stepIndex[view] ? "bg-accent/50" : "bg-border"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>

        {body}

        <p className="mt-6 text-xs text-muted">{t("vatNote")}</p>
      </Container>
    </main>
  );
}
