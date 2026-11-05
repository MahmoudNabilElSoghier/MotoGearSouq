import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.layout" });
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

// Admin routes stay dynamic: stats/inventory must never be baked at build time,
// and the mock-preview badge reflects the live DATABASE_URL state per request.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin.layout");
  const dbConfigured = !!process.env.DATABASE_URL;

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="w-64 shrink-0 border-e border-border bg-card flex flex-col sticky top-0 h-screen">
        <div className="space-y-2 border-b border-border p-4 shrink-0">
          <Image
            src={locale === "ar" ? "/brand/Logo_Icon_Name_AR_Large.png" : "/brand/Logo_Icon_Name_EN_Large.png"}
            alt={locale === "ar" ? "موتوغير سوق" : "MotoGearSouq"}
            width={120}
            height={48}
            className="max-w-full h-auto max-h-16 object-contain mb-2"
            priority
          />
          <p className="text-lg font-bold text-fg">{t("panelName")}</p>
          {!dbConfigured && (
            <span className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
              {t("demoBadge")}
            </span>
          )}
        </div>
        <AdminLayoutShell locale={locale} />
      </aside>
      <div id="main-content" className="min-w-0 flex-1 p-6 md:p-8">
        <AdminTopBar />
        {children}
      </div>
    </div>
  );
}
