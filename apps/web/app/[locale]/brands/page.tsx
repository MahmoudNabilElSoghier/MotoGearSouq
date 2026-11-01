import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getBrands } from "@motogearsouq/api-client";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "الماركات | MotoGearSouq" : "Brands | MotoGearSouq",
    description:
      locale === "ar"
        ? "ماركات الدراجات النارية وقطع غيارها المتوفرة في MotoGearSouq — SYM، Kymco، Haojue وغيرها."
        : "Motorcycle brands and spare parts available at MotoGearSouq.",
  };
}

export default async function BrandsPage({ params }: PageProps) {
  const { locale } = await params;
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");
  const brands = await getBrands();

  return (
    <main id="main-content" className="flex-1 py-12 md:py-16">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-fg">{locale === "ar" ? "الماركات" : "Brands"}</h1>
          <p className="mt-2 text-muted">
            <span dir="ltr">{nf.format(brands.length)}</span> {locale === "ar" ? "ماركة — اختار ماركتك لتشوف الموديلات وقطع غيارها." : "brands — choose your brand to see models and spare parts."}
          </p>
        </div>

        {brands.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-12 text-center text-muted">
            {locale === "ar" ? "الماركات هتظهر هنا قريبًا." : "Brands will appear here soon."}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {brands.map((brand) => (
              <li key={brand.id}>
                <Link
                  href={`/${locale}/brands/${brand.slug}`}
                  className="group flex h-full flex-col items-start gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent"
                >
                  <div>
                    <h2 className="text-xl font-bold text-fg group-hover:text-accent">
                      {brand.nameAr ?? brand.name}
                    </h2>
                  </div>
                  <p className="text-sm text-muted line-clamp-2">
                    {locale === "ar" ? (brand.description ?? "قطع غيار وموديلات متوفرة للأصلية.") : (brand.description ?? "Genuine spare parts and models available.")}
                  </p>
                  <span className="mt-auto text-xs font-semibold text-accent">
                    {locale === "ar" ? "عرض الموديلات ←" : "View models →"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </main>
  );
}
