import type { Metadata } from "next";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LogIn, Package } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { OrderLookupForm } from "@/components/support/OrderLookupForm";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "ar"
        ? "تتبع طلبك | MotoGearSouq"
        : "Track your order | MotoGearSouq",
  };
}

export default function TrackOrderPage() {
  const locale = useLocale();
  const t = useTranslations("trackOrder");

  return (
    <Container size="md" className="py-12 md:py-16">
      <div className="mx-auto max-w-[500px]">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Package className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-fg md:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 md:p-6">
          <OrderLookupForm
            mode="details"
            submitLabel={t("submitButton")}
            warning={
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                {t("trackingNote")}
              </p>
            }
          />
        </div>

        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wide text-muted">
            {t("or")}
          </span>
          <span className="h-px flex-1 bg-border" aria-hidden="true" />
        </div>

        <Button variant="secondary" fullWidth asChild>
          <Link href={`/${locale}/login`} className="gap-2">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>{t("loginButton")}</span>
          </Link>
        </Button>
        <p className="mt-3 text-center text-sm text-muted">{t("loginNote")}</p>
      </div>
    </Container>
  );
}
