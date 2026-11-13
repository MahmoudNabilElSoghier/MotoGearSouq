"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormBanner } from "@/components/admin/FormBanner";
import { bulkImportProducts, type BulkImportResult } from "@motogearsouq/api-client";
import { Upload, Loader2, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";

export default function AdminProductImportPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bulkImportProducts(file);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">
            {isAr ? "استيراد المنتجات (Excel / CSV)" : "Bulk Import Products (Excel / CSV)"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isAr
              ? "قم برفع ملف المنتجات بصيغة CSV أو Excel لتحديث أو إضافة المنتجات تلقائياً."
              : "Upload an Excel or CSV file containing product records to upsert products, brands, models, and categories."}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/admin/products`} className="inline-flex items-center gap-2">
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isAr ? "العودة للمنتجات" : "Back to Products"}
          </Link>
        </Button>
      </div>

      {error && <FormBanner type="error" message={error} onClose={() => setError(null)} />}

      <Card className="p-6 space-y-6 bg-card border border-border">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-muted mb-3" />
            <label className="block text-sm font-medium text-fg mb-1">
              {isAr ? "اختر ملف المنتجات (.csv, .xlsx)" : "Select products file (.csv, .xlsx)"}
            </label>
            <p className="text-xs text-muted mb-4">
              {isAr ? "يجب أن يحتوي الملف على أعمدة: SKU, Product Name AR, Brand, Model, Retail Price, إلخ." : "Columns expected: SKU, Product Name AR, Product Name EN, Brand, Model, Retail Price, Wholesale Price, Stock Quantity, etc."}
            </p>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer mx-auto max-w-xs"
            />
          </div>

          {file && (
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg text-sm">
              <span className="font-medium text-fg truncate">{file.name}</span>
              <span className="text-muted text-xs">({Math.round(file.size / 1024)} KB)</span>
            </div>
          )}

          <Button type="submit" disabled={!file || loading} className="w-full">
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isAr ? "بدء الاستيراد" : "Start Import"}
          </Button>
        </form>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 bg-card border border-border flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted">{isAr ? "تم استيراد بنجاح" : "Successfully Imported"}</p>
                <p className="text-2xl font-bold text-fg">{result.successCount}</p>
              </div>
            </Card>
            <Card className="p-5 bg-card border border-border flex items-center gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted">{isAr ? "أخطاء التسجيل" : "Import Errors"}</p>
                <p className="text-2xl font-bold text-fg">{result.errorCount}</p>
              </div>
            </Card>
          </div>

          {result.errors.length > 0 && (
            <Card className="p-6 space-y-4 bg-card border border-border">
              <h2 className="text-lg font-bold text-fg">
                {isAr ? "تفاصيل الأخطاء" : "Error Details"}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 text-muted">
                    <tr>
                      <th className="px-4 py-3">{isAr ? "السطر" : "Row"}</th>
                      <th className="px-4 py-3">{isAr ? "رمز SKU" : "SKU"}</th>
                      <th className="px-4 py-3">{isAr ? "الخطأ" : "Error"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono">{err.row}</td>
                        <td className="px-4 py-3 font-mono font-semibold">{err.sku || "—"}</td>
                        <td className="px-4 py-3 text-destructive">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
