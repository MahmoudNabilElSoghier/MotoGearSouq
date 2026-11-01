import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getBrands, getPartCategories, getProductById } from "@motogearsouq/api-client";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.products" });
  return {
    title: t("metaEdit"),
  };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "admin.products" });
  const [product, brands, categories] = await Promise.all([
    getProductById(id),
    getBrands(),
    getPartCategories(),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/${locale}/admin/products`}
          className="inline-flex items-center gap-2 font-semibold text-accent hover:underline"
        >
          <span aria-hidden="true">←</span> {t("backToList")}
        </Link>
        <h1 className="text-2xl font-extrabold text-fg">{t("editTitle")}</h1>
        <span className="font-mono text-sm text-muted" dir="ltr">
          {product.code}
        </span>
      </div>
      <ProductForm product={product} brands={brands} categories={categories} />
    </div>
  );
}
