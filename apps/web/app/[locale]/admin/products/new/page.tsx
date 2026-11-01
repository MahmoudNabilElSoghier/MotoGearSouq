import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { getBrands, getPartCategories } from "@motogearsouq/api-client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.products" });
  return {
    title: t("metaNew"),
  };
}

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.products" });
  const [brands, categories] = await Promise.all([
    getBrands(),
    getPartCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/${locale}/admin/products`}
          className="inline-flex items-center gap-2 font-semibold text-accent hover:underline"
        >
          <span aria-hidden="true">←</span> {t("backToList")}
        </Link>
        <h1 className="text-2xl font-extrabold text-fg">{t("newTitle")}</h1>
      </div>
      <ProductForm brands={brands} categories={categories} />
    </div>
  );
}
