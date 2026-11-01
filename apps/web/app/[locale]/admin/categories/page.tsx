"use client";

import { useEffect, useState } from "react";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { getCategoryTree } from "@motogearsouq/api-client";
import type { PartCategory } from "@motogearsouq/shared";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminCategoriesPage() {
  const t = useTranslations("admin.categories");
  const [tree, setTree] = useState<PartCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    getCategoryTree()
      .then(setTree)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("subtitle")}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <CategoryManager tree={tree} onSuccess={refetch} />
      )}
    </div>
  );
}
