import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Phone, Package } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { company } from "@/lib/config";
import { getProductByCode, totalStock } from "@motogearsouq/api-client";
import { ProductAddToCart } from "@/components/cart/ProductAddToCart";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "productDetail" });
  const product = await getProductByCode(slug);
  if (!product) return { title: t("metaNotFound") };
  return {
    title: t("metaTitle", { name: product.name }),
    description:
      product.description ??
      t("metaDescription", {
        name: product.name,
        code: product.code,
        oemPart: product.oemCode ? t("metaOem", { oem: product.oemCode }) : "",
      }),
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "productDetail" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const product = await getProductByCode(slug);
  if (!product) notFound();

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const stock = totalStock(product);
  const imageUrl = product.imageUrl || product.images?.[0]?.url;

  const waText = t("whatsappText", { name: product.name, code: product.code });
  const waHref = `${company.whatsappUrl}?text=${encodeURIComponent(waText)}`;

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16">
      <Container>
        <Link
          href={`/${locale}/products`}
          className="mb-6 inline-flex items-center gap-2 font-semibold text-accent hover:underline"
        >
          <span aria-hidden="true">←</span> {t("backToParts")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Column 1: Image / Placeholder */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted/20">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted">
                    <Package className="h-24 w-24 opacity-40" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Text + Details + Tables */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-card px-3 py-1 font-mono text-xs text-muted" dir="ltr">
                  {product.code}
                </span>
                {product.oemCode && (
                  <span className="rounded-full bg-card px-3 py-1 text-xs text-muted">
                    OEM:{" "}
                    <span dir="ltr">{product.oemCode}</span>
                  </span>
                )}
                <span className="rounded-full bg-card px-3 py-1 text-xs text-muted">
                  {product.unitOfMeasure}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-fg" dir="auto">
                {product.name}
              </h1>
              {product.nameEn && locale === "ar" && (
                <p className="text-muted" dir="ltr">
                  {product.nameEn}
                </p>
              )}
              {(product.brand || product.partCategory) && (
                <p className="text-sm text-muted">
                  {[product.brand?.nameAr, product.partCategory?.nameAr]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>

            {product.description && (
              <section aria-labelledby="product-desc">
                <h2 id="product-desc" className="mb-2 text-lg font-bold text-fg">
                  {t("descriptionTitle")}
                </h2>
                <p className="leading-relaxed text-muted text-sm">{product.description}</p>
              </section>
            )}

            {product.compatibilities && product.compatibilities.length > 0 && (
              <section aria-labelledby="product-fit">
                <h2 id="product-fit" className="mb-3 text-lg font-bold text-fg">
                  {t("fitsTitle")}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {product.compatibilities.map((compat) => (
                    <li key={compat.id}>
                      {compat.model && compat.model.brand ? (
                        <Link
                          href={`/${locale}/brands/${compat.model.brand.slug}/${compat.model.slug}`}
                          className="inline-block rounded-full border border-border bg-card px-3 py-1.5 text-xs text-fg transition-colors hover:border-accent"
                        >
                          {compat.model.brand.nameAr} {compat.model.nameAr ?? compat.model.name}
                        </Link>
                      ) : (
                        <span className="inline-block rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted">
                          {compat.model?.name ?? t("modelFallback")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="product-stock">
              <h2 id="product-stock" className="mb-3 text-lg font-bold text-fg">
                {t("stockTitle")}
              </h2>
              {!product.inventory || product.inventory.length === 0 ? (
                <p className="rounded-xl border border-border bg-card px-4 py-6 text-muted text-sm">
                  {t("noInventory")}
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted">
                        <th className="px-3 py-2 font-medium text-start">{t("inventoryBranch")}</th>
                        <th className="px-3 py-2 font-medium text-start">{t("inventoryQty")}</th>
                        <th className="px-3 py-2 font-medium text-start">{t("inventoryStatus")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.inventory.map((row) => (
                        <tr key={row.id} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-2.5 text-fg">
                            {row.branch?.nameAr ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 text-fg" dir="ltr">
                            {nf.format(row.quantity)}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.quantity <= 0 ? (
                              <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">
                                {tCommon("stock.outOfStock")}
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                                {tCommon("stock.inStock")}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Column 3: Price + CTA Card */}
          <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-24 lg:self-start">
            <ProductAddToCart product={{ id: product.id, code: product.code, name: product.name, retailPrice: product.retailPrice, taxRate: product.taxRate }} />

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    stock > 0 ? "bg-emerald-400" : "bg-red-400"
                  }`}
                  aria-hidden="true"
                />
                <span className={stock > 0 ? "text-fg" : "text-red-400"}>
                  {stock > 0
                    ? t("stockAvailable", { qty: nf.format(stock), unit: product.unitOfMeasure })
                    : t("stockUnavailable")}
                </span>
              </div>

              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#20bd5a]"
              >
                <Phone className="w-4 h-4" />
                {t("whatsappCta")}
              </a>
              <p className="mt-3 text-center text-xs text-muted">
                {t("branchPrompt")}{" "}
                <Link href={`/${locale}/#branches`} className="text-accent hover:underline">
                  {t("branchesLink")}
                </Link>
              </p>
            </div>

            {product.tags && product.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-card px-3 py-1 text-xs text-muted"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </Container>
    </main>
  );
}
