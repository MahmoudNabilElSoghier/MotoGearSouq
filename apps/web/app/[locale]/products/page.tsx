import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { getBrands, getPartCategories, getProducts, totalStock } from "@motogearsouq/api-client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; brand?: string; cat?: string; page?: string }>;
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

const selectClass =
  "rounded-lg border border-border bg-card px-4 py-3 text-fg focus:border-accent focus:outline-none";

function stockBadge(stock: number, reorderLevel: number, locale: string) {
  if (stock <= 0) return { label: locale === "ar" ? "غير متوفر" : "Out of stock", classes: "bg-red-500/15 text-red-400" };
  if (stock <= reorderLevel)
    return { label: locale === "ar" ? "كمية محدودة" : "Low stock", classes: "bg-amber-500/15 text-amber-400" };
  return { label: locale === "ar" ? "متوفر" : "In stock", classes: "bg-emerald-500/15 text-emerald-400" };
}

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { q = "", brand = "", cat = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const [result, brands, categories] = await Promise.all([
    getProducts({
      q: q || undefined,
      brandSlug: brand || undefined,
      categorySlug: cat || undefined,
      page: pageNum,
      pageSize: 12,
    }),
    getBrands(),
    getPartCategories(),
  ]);

  const pageHref = (target: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (brand) p.set("brand", brand);
    if (cat) p.set("cat", cat);
    if (target > 1) p.set("page", String(target));
    const qs = p.toString();
    return `/${locale}/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-fg">{locale === "ar" ? "قطع الغيار" : "Spare Parts"}</h1>
          <p className="mt-2 text-muted">
            <span dir="ltr">{nf.format(result.total)}</span> {locale === "ar" ? "قطعة — ابحث بالاسم أو الكود أو حسب الماركة والتصنيف." : "items — search by name, code, or filter by brand and category."}
          </p>
        </div>

        <form
          action={`/${locale}/products`}
          method="get"
          className="mb-8 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_auto_auto_auto]"
        >
          <Input
            label={locale === "ar" ? "بحث" : "Search"}
            name="q"
            defaultValue={q}
            placeholder={locale === "ar" ? "اسم القطعة أو الكود" : "Part name or code"}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-brand" className="text-sm font-medium text-fg">
              {locale === "ar" ? "الماركة" : "Brand"}
            </label>
            <select
              id="filter-brand"
              name="brand"
              defaultValue={brand}
              className={selectClass}
            >
              <option value="">{locale === "ar" ? "كل الماركات" : "All brands"}</option>
              {brands.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.nameAr ?? item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-cat" className="text-sm font-medium text-fg">
              {locale === "ar" ? "التصنيف" : "Category"}
            </label>
            <select
              id="filter-cat"
              name="cat"
              defaultValue={cat}
              className={selectClass}
            >
              <option value="">{locale === "ar" ? "كل التصنيفات" : "All categories"}</option>
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.parentId ? "└ " : ""}
                  {item.nameAr ?? item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="secondary" className="w-full md:w-auto">
              {locale === "ar" ? "تطبيق" : "Apply"}
            </Button>
          </div>
        </form>

        {result.items.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-12 text-center text-muted">
            {locale === "ar" ? "لا توجد قطع مطابقة لبحثك — جرّب كلمة تانية أو غيّر الفلاتر." : "No matching parts found — try a different search or filter."}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((product) => {
              const stock = totalStock(product);
              const badge = stockBadge(stock, product.reorderLevel, locale);
              return (
                <li key={product.id}>
                  <Link
                    href={`/${locale}/products/${product.code}`}
                    className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent"
                  >
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
                    <h2 className="font-bold text-fg group-hover:text-accent">
                      {product.name}
                    </h2>
                    <p className="text-sm text-muted">
                      {[product.brand?.nameAr, product.partCategory?.nameAr]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <div className="mt-auto flex items-end justify-between pt-2">
                      <p className="text-lg font-extrabold text-fg">
                        {product.retailPrice != null ? (
                          <span dir="ltr">
                            {nf.format(product.retailPrice)} {locale === "ar" ? "ج.م" : "EGP"}
                          </span>
                        ) : (
                          (locale === "ar" ? "عند التواصل" : "Contact for price")
                        )}
                      </p>
                      <span className="text-sm font-semibold text-accent">
                        {locale === "ar" ? "التفاصيل" : "Details"}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {result.totalPages > 1 && (
          <nav
            aria-label={locale === "ar" ? "صفحات المنتجات" : "Product pagination"}
            className="mt-8 flex items-center justify-between text-sm"
          >
            <Link
              href={pageHref(result.page - 1)}
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
              href={pageHref(result.page + 1)}
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

        <p className="mt-6 text-xs text-muted">
          {locale === "ar" ? "الأسعار لا تشمل ضريبة القيمة المضافة (تُضاف عند الفاتورة)." : "Prices do not include VAT (added at checkout)."}
        </p>
      </Container>
    </main>
  );
}
