import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const sections = ["acceptance", "usage", "ip", "liability", "external", "changes", "law"] as const;

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const lastUpdated = new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main id="main-content" className="flex-1 py-16 md:py-24">
      <Container size="md">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
          {t("heading")}
        </h1>
        <p className="text-muted mb-12">{t("lastUpdated", { date: lastUpdated })}</p>

        <div className="space-y-10">
          {sections.map((key) => (
            <section key={key}>
              <h2 className="text-xl font-bold text-fg mb-3">{t(`sections.${key}.title`)}</h2>
              <p className="text-muted leading-relaxed">{t(`sections.${key}.body`)}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-accent font-semibold hover:underline"
          >
            <span aria-hidden="true">←</span> {tCommon("backToHome")}
          </Link>
        </div>
      </Container>
    </main>
  );
}
