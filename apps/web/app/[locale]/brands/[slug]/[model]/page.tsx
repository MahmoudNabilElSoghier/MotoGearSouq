import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { getModelBySlug, totalStock } from "@elsaad/api-client";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string; slug: string; model: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug, model: modelSlug } = await params;
  const bikeModel = await getModelBySlug(slug, modelSlug);
  if (!bikeModel) return { title: locale === "ar" ? "موديل غير موجود | MotoGearSouq" : "Model not found | MotoGearSouq" };
  const label = `${bikeModel.nameAr ?? bikeModel.name}${bikeModel.brand ? ` ${bikeModel.brand.nameAr ?? bikeModel.brand.name}` : ""}`;
  return {
    title: locale === "ar" ? `${label} | قطع غيار | MotoGearSouq` : `${label} | Spare Parts | MotoGearSouq`,
    description:
      bikeModel.description ??
      (locale === "ar"
        ? `قطع غيار متوافقة مع ${label} — متاحة في فروع MotoGearSouq.`
        : `Spare parts compatible with ${label} — available at MotoGearSouq.`),
  };
}

export default async function ModelDetailPage({ params }: PageProps) {
  const { locale, slug, model: modelSlug } = await params;
  const bikeModel = await getModelBySlug(slug, modelSlug);
  if (!bikeModel) notFound();

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const brand = bikeModel.brand;
  const products = (bikeModel.compatibilities ?? [])
    .flatMap((compat) => compat.product ?? [])
    .filter((product) => product.active && !product.deletedAt);

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16">
      <Container>
        <nav aria-label={locale === "ar" ? "مسار التنقل" : "Breadcrumb"} className="mb-6 flex flex-wrap gap-2 text-sm">
          <Link href={`/${locale}/brands`} className="text-accent hover:underline">
            {locale === "ar" ? "الماركات" : "Brands"}
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
                <span dir="ltr">{nf.format(bikeModel.engineCc)}</span> {locale === "ar" ? "سي سي" : "CC"}
              </span>
            )}
            {bikeModel.yearFrom && (
              <span className="rounded-full bg-card px-4 py-1.5 text-muted">
                {bikeModel.yearTo
                  ? `${nf.format(bikeModel.yearFrom)} - ${nf.format(bikeModel.yearTo)}`
                  : (locale === "ar" ? `من ${nf.format(bikeModel.yearFrom)}` : `From ${nf.format(bikeModel.yearFrom)}`)}
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
            {locale === "ar" ? "قطع الغيار المتوافقة" : "Compatible Spare Parts"}
          </h2>
          {products.length === 0 ? (
            <p className="rounded-xl border border-border bg-card px-4 py-12 text-center text-muted">
              {locale === "ar" ? (
                <>
                  لا توجد قطع مسجلة لهذا الموديل بعد —{" "}
                  <Link href={`/${locale}/#contact`} className="text-accent hover:underline">
                    كلمنا
                  </Link>{" "}
                  وهنوفّرها لك.
                </>
              ) : (
                <>
                  No parts registered for this model yet —{" "}
                  <Link href={`/${locale}/#contact`} className="text-accent hover:underline">
                    contact us
                  </Link>{" "}
                  and we will source it for you.
                </>
              )}
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
                          {stock > 0 ? (locale === "ar" ? "متوفر" : "In stock") : (locale === "ar" ? "غير متوفر" : "Out of stock")}
                        </span>
                      </div>
                      <h3 className="font-bold text-fg group-hover:text-accent">
                        {product.name}
                      </h3>
                      <p className="mt-auto text-lg font-extrabold text-fg">
                        {product.retailPrice != null ? (
                          <span dir="ltr">
                            {nf.format(product.retailPrice)} {locale === "ar" ? "ج.م" : "EGP"}
                          </span>
                        ) : (
                          (locale === "ar" ? "عند التواصل" : "Contact for price")
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
