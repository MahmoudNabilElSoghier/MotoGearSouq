"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Home } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="flex-1 flex items-center">
      <Container size="md" className="py-24 text-center">
        <p className="text-6xl font-extrabold text-accent mb-4">404</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-4">
          {t("heading")}
        </h1>
        <p className="text-muted mb-8">{t("text")}</p>
        <Button size="lg" asChild>
          <Link href="/" className="inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            {t("button")}
          </Link>
        </Button>
      </Container>
    </main>
  );
}
