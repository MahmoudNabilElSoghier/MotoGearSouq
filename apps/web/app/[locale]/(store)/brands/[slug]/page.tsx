import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { getBrandBySlug } from "@motogearsouq/api-client";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "brandDetail" });
  const brand = await getBrandBySlug(slug);
  if (!brand) return { title: t("metaNotFound") };
  const brandName = brand.nameAr ?? brand.name;
  return {
    title: t("metaTitle", { name: brandName }),
    description: brand.description ?? t("metaDescription", { name: brandName }),
  };
}

export default async function BrandDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "brandDetail" });
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const models = brand.models ?? [];
  const grouped = new Map<string, typeof models>();
  for (const model of models) {
    const list = grouped.get(model.category) ?? [];
    list.push(model);
    grouped.set(model.category, list);
  }

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16">
      <Container>
        <Link
          href={`/${locale}/brands`}
          className="mb-6 inline-flex items-center gap-2 font-semibold text-accent hover:underline"
        >
          <span aria-hidden="true">←</span> {t("backToBrands")}
        </Link>

        <header className="mb-10 flex flex-wrap items-start gap-5">
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-strong/15 text-3xl font-extrabold text-accent"
            aria-hidden="true"
          >
            {(brand.nameAr ?? brand.name).charAt(0)}
          </span>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-fg">
              {brand.nameAr ?? brand.name}
            </h1>
            {brand.description && (
              <p className="mt-3 max-w-2xl leading-relaxed text-muted">
                {brand.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
              <span>{t("modelsCount", { count: nf.format(models.length) })}</span>
              <span>{t("partsCount", { count: nf.format(brand._count?.products ?? 0) })}</span>
              <Link
                href={`/${locale}/products?brand=${brand.slug}`}
                className="font-semibold text-accent hover:underline"
              >
                {t("viewParts")}
              </Link>
            </div>
          </div>
        </header>

        {models.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-12 text-center text-muted">
            {t("empty")}
          </p>
        ) : (
          <div className="space-y-10">
            {[...grouped.entries()].map(([category, list]) => (
              <section key={category} aria-labelledby={`cat-${category}`}>
                <h2
                  id={`cat-${category}`}
                  className="mb-4 border-b border-border pb-3 text-xl font-bold text-fg"
                >
                  {category}
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((model) => (
                    <li key={model.id}>
                      <Link
                        href={`/${locale}/brands/${brand.slug}/${model.slug}`}
                        className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent"
                      >
                        <div>
                          <h3 className="font-bold text-fg group-hover:text-accent">
                            {model.nameAr ?? model.name}
                          </h3>
                        </div>
                        <div className="mt-auto flex flex-wrap gap-2 text-xs">
                          {model.engineCc && (
                            <span className="rounded-full bg-bg px-2.5 py-1 text-muted">
                              {t("cc", { count: nf.format(model.engineCc) })}
                            </span>
                          )}
                          {model.yearFrom && (
                            <span className="rounded-full bg-bg px-2.5 py-1 text-muted">
                              {t("fromYear", { year: nf.format(model.yearFrom) })}
                            </span>
                          )}
                          <span className="rounded-full bg-bg px-2.5 py-1 text-muted">
                            {t("compatibleParts", { count: nf.format(model._count?.compatibilities ?? 0) })}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
