import type { Metadata } from "next";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Truck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { OrderLookupForm } from "@/components/support/OrderLookupForm";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "support" });
  return {
    title: t("whereMetaTitle"),
  };
}

export default function WhereIsMyOrderPage() {
  const locale = useLocale();
  const t = useTranslations("support");

  return (
    <Container size="md" className="py-12 md:py-16">
      <Link
        href={`/${locale}/support`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        {t("back")}
      </Link>

      <h1 className="mt-6 text-2xl font-extrabold text-fg md:text-3xl">
        {t("whichOrder")}
      </h1>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="shrink-0 rounded-lg bg-accent/10 p-2.5 text-accent">
            <Truck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold text-fg">{t("findOrder")}</h2>
            <p className="mt-1 text-sm text-muted">{t("findOrderDesc")}</p>
          </div>
        </div>
        <OrderLookupForm mode="details" submitLabel={t("submitButton")} />
      </div>
    </Container>
  );
}
