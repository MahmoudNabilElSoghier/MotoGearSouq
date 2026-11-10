import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MessageSquare, Truck, RotateCcw } from "lucide-react";
import { Container } from "@/components/ui/Container";

export default function SupportPage() {
  const locale = useLocale();
  const t = useTranslations("support");

  return (
    <Container size="md" className="py-14 md:py-20">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent">
          <MessageSquare className="h-10 w-10" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-fg md:text-4xl">{t("title")}</h1>
        <p className="mt-3 max-w-md text-muted">{t("subtitle")}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:gap-6">
        <Link
          href={`/${locale}/support/where-is-my-order`}
          className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="rounded-lg bg-accent/10 p-2.5 text-accent">
            <Truck className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-bold text-fg group-hover:text-accent">
            {t("whereOrderTitle")}
          </h2>
          <p className="text-sm text-muted">{t("whereOrderDesc")}</p>
        </Link>

        <Link
          href={`/${locale}/support/return-exchange`}
          className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="rounded-lg bg-accent/10 p-2.5 text-accent">
            <RotateCcw className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-bold text-fg group-hover:text-accent">
            {t("returnTitle")}
          </h2>
          <p className="text-sm text-muted">{t("returnDesc")}</p>
        </Link>
      </div>
    </Container>
  );
}
