import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminSidebarProvider } from "@/components/admin/AdminSidebarProvider";
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
  const dbConfigured = !!process.env.DATABASE_URL;

  return (
    <AdminSidebarProvider>
      <div className="flex min-h-screen flex-1">
        <AdminSidebar locale={locale} dbConfigured={dbConfigured} />
        <div id="main-content" className="min-w-0 flex-1 p-6 md:p-8">
          <AdminTopBar />
          {children}
        </div>
      </div>
    </AdminSidebarProvider>
  );
}
