import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { company } from "@/lib/config";
import { getProductByCode, totalStock } from "@elsaad/api-client";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductByCode(slug);
  if (!product) return { title: locale === "ar" ? "قطعة غير موجودة | MotoGearSouq" : "Part not found | MotoGearSouq" };
  return {
    title: locale === "ar" ? `${product.name} | قطع الغيار | MotoGearSouq` : `${product.name} | Spare Parts | MotoGearSouq`,
    description:
      product.description ??
      (locale === "ar"
        ? `${product.name} — كود ${product.code}${product.oemCode ? `، كود OEM ${product.oemCode}` : ""}. متاح في فروع السعد للدراجات النارية.`
        : `${product.name} — code ${product.code}${product.oemCode ? `, OEM code ${product.oemCode}` : ""}. Available at ELSAAD branches.`),
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const product = await getProductByCode(slug);
  if (!product) notFound();

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const stock = totalStock(product);
  const waText = locale === "ar"
    ? `مرحبًا، عايز أستفسر عن قطعة "${product.name}" (كود ${product.code}) على موقع MotoGearSouq.`
    : `Hello, I would like to inquire about "${product.name}" (code ${product.code}) on MotoGearSouq website.`;
  const waHref = `${company.whatsappUrl}?text=${encodeURIComponent(waText)}`;

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16">
      <Container>
        <Link
          href={`/${locale}/products`}
          className="mb-6 inline-flex items-center gap-2 font-semibold text-accent hover:underline"
        >
          <span aria-hidden="true">←</span> {locale === "ar" ? "كل قطع الغيار" : "All spare parts"}
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
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
              <h1 className="text-3xl md:text-4xl font-extrabold text-fg">
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
                <h2 id="product-desc" className="mb-2 text-xl font-bold text-fg">
                  {locale === "ar" ? "الوصف" : "Description"}
                </h2>
                <p className="leading-relaxed text-muted">{product.description}</p>
              </section>
            )}

            {product.compatibilities && product.compatibilities.length > 0 && (
              <section aria-labelledby="product-fit">
                <h2 id="product-fit" className="mb-3 text-xl font-bold text-fg">
                  {locale === "ar" ? "يركب على" : "Compatible with"}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {product.compatibilities.map((compat) => (
                    <li key={compat.id}>
                      {compat.model && compat.model.brand ? (
                        <Link
                          href={`/${locale}/brands/${compat.model.brand.slug}/${compat.model.slug}`}
                          className="inline-block rounded-full border border-border bg-card px-4 py-2 text-sm text-fg transition-colors hover:border-accent"
                        >
                          {compat.model.brand.nameAr} {compat.model.nameAr ?? compat.model.name}
                        </Link>
                      ) : (
                        <span className="inline-block rounded-full border border-border bg-card px-4 py-2 text-sm text-muted">
                          {compat.model?.name ?? (locale === "ar" ? "موديل" : "Model")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="product-stock">
              <h2 id="product-stock" className="mb-3 text-xl font-bold text-fg">
                {locale === "ar" ? "التوفر حسب الفرع" : "Branch Availability"}
              </h2>
              {!product.inventory || product.inventory.length === 0 ? (
                <p className="rounded-xl border border-border bg-card px-4 py-6 text-muted">
                  {locale === "ar" ? "لا توجد كميات مسجلة حاليًا — تواصل معنا للتوفر أو الطلب مسبقًا." : "No inventory quantities recorded currently — contact us for availability or pre-order."}
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted">
                        <th className="px-4 py-3 font-medium text-start">{locale === "ar" ? "الفرع" : "Branch"}</th>
                        <th className="px-4 py-3 font-medium text-start">{locale === "ar" ? "الكمية" : "Quantity"}</th>
                        <th className="px-4 py-3 font-medium text-start">{locale === "ar" ? "الحالة" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.inventory.map((row) => (
                        <tr key={row.id} className="border-b border-border/50 last:border-0">
                          <td className="px-4 py-3 text-fg">
                            {row.branch?.nameAr ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-fg" dir="ltr">
                            {nf.format(row.quantity)}
                          </td>
                          <td className="px-4 py-3">
                            {row.quantity <= 0 ? (
                              <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
                                {locale === "ar" ? "غير متوفر" : "Out of stock"}
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                                {locale === "ar" ? "متوفر" : "In stock"}
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

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-sm text-muted">{locale === "ar" ? "سعر التجزئة" : "Retail price"}</p>
              <p className="mt-1 text-3xl font-extrabold text-fg">
                {product.retailPrice != null ? (
                  <span dir="ltr">
                    {nf.format(product.retailPrice)} {locale === "ar" ? "ج.م" : "EGP"}
                  </span>
                ) : (
                  (locale === "ar" ? "عند التواصل" : "Contact for price")
                )}
              </p>
              <p className="mt-1 text-xs text-muted">
                {locale === "ar" ? (
                  <>لا يشمل ض.ق.م (<span dir="ltr">{nf.format(Number(product.taxRate) * 100)}</span>%)</>
                ) : (
                  <>Excludes VAT (<span dir="ltr">{nf.format(Number(product.taxRate) * 100)}</span>%)</>
                )}
              </p>

              <div className="mt-4 flex items-center gap-2 text-sm">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    stock > 0 ? "bg-emerald-400" : "bg-red-400"
                  }`}
                  aria-hidden="true"
                />
                <span className={stock > 0 ? "text-fg" : "text-red-400"}>
                  {stock > 0
                    ? (locale === "ar" ? (
                        <>متوفر — <span dir="ltr">{nf.format(stock)}</span> {product.unitOfMeasure} في الفروع</>
                      ) : (
                        <>In stock — <span dir="ltr">{nf.format(stock)}</span> {product.unitOfMeasure} across branches</>
                      ))
                    : (locale === "ar" ? "غير متوفر حاليًا" : "Currently out of stock")}
                </span>
              </div>

              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-strong px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-strong/90"
              >
                {locale === "ar" ? "استعلم على واتساب" : "Inquire on WhatsApp"}
              </a>
              <p className="mt-3 text-center text-xs text-muted">
                {locale === "ar" ? (
                  <>أو زر أقرب فرع من <Link href={`/${locale}/#branches`} className="text-accent hover:underline">الفروع</Link></>
                ) : (
                  <>Or visit our nearest <Link href={`/${locale}/#branches`} className="text-accent hover:underline">branch</Link></>
                )}
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
