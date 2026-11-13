import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { getModelBySlug, totalStock } from "@motogearsouq/api-client";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string; slug: string; model: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug, model: modelSlug } = await params;
  const t = await getTranslations({ locale, namespace: "modelDetail" });
  const bikeModel = await getModelBySlug(slug, modelSlug);
  if (!bikeModel) return { title: t("metaNotFound") };
  const label = `${bikeModel.nameAr ?? bikeModel.name}${bikeModel.brand ? ` ${bikeModel.brand.nameAr ?? bikeModel.brand.name}` : ""}`;
  return {
    title: t("metaTitle", { name: label }),
    description: bikeModel.description ?? t("metaDescription", { name: label }),
  };
}

export default async function ModelDetailPage({ params }: PageProps) {
  const { locale, slug, model: modelSlug } = await params;
  const t = await getTranslations({ locale, namespace: "modelDetail" });
  const tBrand = await getTranslations({ locale, namespace: "brandDetail" });
  const tProd = await getTranslations({ locale, namespace: "productDetail" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const bikeModel = await getModelBySlug(slug, modelSlug);
  const isAr = locale === "ar";
  if (!bikeModel) notFound();

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const brand = bikeModel.brand;
  const products = (bikeModel.compatibilities ?? [])
    .flatMap((compat) => compat.product ?? [])
    .filter((product) => product.active && !product.deletedAt);

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16">
      <Container>
        <nav aria-label={t("breadcrumbAria")} className="mb-6 flex flex-wrap gap-2 text-sm">
          <Link href={`/${locale}/brands`} className="text-accent hover:underline">
            {t("crumbBrands")}
          </Link>
          <span className="text-muted" aria-hidden="true">
            /
          </span>
          <Link href={`/${locale}/brands/${slug}`} className="text-accent hover:underline">
            {brand?.nameAr ?? brand?.name ?? slug}
          </Link>
          <span className="text-muted" aria-hidden="true">
            /
          </span>
          <span className="text-muted">{bikeModel.nameAr ?? bikeModel.name}</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-fg">
            {bikeModel.nameAr ?? bikeModel.name}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-card px-4 py-1.5 text-muted">
              {bikeModel.category}
            </span>
            {bikeModel.engineCc && (
              <span className="rounded-full bg-card px-4 py-1.5 text-muted">
                {tBrand("cc", { count: nf.format(bikeModel.engineCc) })}
              </span>
            )}
            {bikeModel.yearFrom && (
              <span className="rounded-full bg-card px-4 py-1.5 text-muted">
                {bikeModel.yearTo
                  ? `${nf.format(bikeModel.yearFrom)} - ${nf.format(bikeModel.yearTo)}`
                  : tBrand("fromYear", { year: nf.format(bikeModel.yearFrom) })}
              </span>
            )}
            {brand && (
              <span className="rounded-full bg-card px-4 py-1.5 text-muted">
                {brand.nameAr ?? brand.name}
              </span>
            )}
          </div>
          {bikeModel.description && (
            <p className="mt-4 max-w-2xl leading-relaxed text-muted">
              {bikeModel.description}
            </p>
          )}
        </header>

        <section aria-labelledby="compatible-parts">
          <h2 id="compatible-parts" className="mb-4 border-b border-border pb-3 text-xl font-bold text-fg">
            {t("compatibleTitle")}
          </h2>
          {products.length === 0 ? (
            <p className="rounded-xl border border-border bg-card px-4 py-12 text-center text-muted">
              {t("emptyBefore")}{" "}
              <Link href={`/${locale}/#contact`} className="text-accent hover:underline">
                {t("emptyContact")}
              </Link>{" "}
              {t("emptyAfter")}
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const stock = totalStock(product);
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
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            stock > 0
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {stock > 0 ? tCommon("stock.inStock") : tCommon("stock.outOfStock")}
                        </span>
                      </div>
                      <h3 className="font-bold text-fg group-hover:text-accent">
                        {product.name}
                      </h3>
                      <p className="mt-auto text-lg font-extrabold text-fg">
                        {product.retailPrice != null ? (
                          <span dir="ltr">
                            {nf.format(product.retailPrice)} {isAr ? "ج.م" : "EGP"}
                          </span>
                        ) : (
                          tCommon("contactPrice")
                        )}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </Container>
    </main>
  );
}
