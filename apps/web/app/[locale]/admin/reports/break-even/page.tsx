"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getBreakEvenAnalysis, getCompanySettings, updateCompanySettings, type BreakEvenAnalysis } from "@motogearsouq/api-client";
import { FormBanner } from "@/components/admin/FormBanner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AdminBreakEvenPage() {
  const t = useTranslations("admin.reports.breakEven");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isAr = locale === "ar";
  const nf = new Intl.NumberFormat(isAr ? "ar-EG-u-nu-latn" : "en-US");
  const currency = (n: number) => `${nf.format(n)} EGP`;

  const [period, setPeriod] = useState("30d");
  const [analysis, setAnalysis] = useState<BreakEvenAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states
  const [rent, setRent] = useState("");
  const [salaries, setSalaries] = useState("");
  const [utilities, setUtilities] = useState("");
  const [marketing, setMarketing] = useState("");
  const [other, setOther] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [be, st] = await Promise.all([getBreakEvenAnalysis(period), getCompanySettings()]);
      setAnalysis(be);
      setRent(String(st.monthlyRent));
      setSalaries(String(st.monthlySalaries));
      setUtilities(String(st.monthlyUtilities));
      setMarketing(String(st.monthlyMarketing));
      setOther(String(st.monthlyOther));
    } catch {
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setBanner(null);
    try {
      await updateCompanySettings({
        monthlyRent: Number(rent) || 0,
        monthlySalaries: Number(salaries) || 0,
        monthlyUtilities: Number(utilities) || 0,
        monthlyMarketing: Number(marketing) || 0,
        monthlyOther: Number(other) || 0,
      });
      setBanner({ type: "success", message: t("saved") });
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : tCommon("errorGeneric");
      setBanner({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const status = analysis?.contribution.status;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">Fixed costs vs contribution margin & break-even revenue</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1">
          {["7d", "30d", "90d", "365d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                period === p ? "bg-accent text-fg shadow-sm" : "text-muted hover:text-fg"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted" />
        </div>
      ) : !analysis ? (
        <div className="p-8 text-center text-muted border border-border rounded-xl bg-card">
          {tCommon("errorGeneric")}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 lg:col-span-1">
            <h2 className="text-lg font-bold text-fg">{t("settings")}</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">{t("rent")}</label>
                <Input type="number" step="0.01" value={rent} onChange={(e) => setRent(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">{t("salaries")}</label>
                <Input type="number" step="0.01" value={salaries} onChange={(e) => setSalaries(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">{t("utilities")}</label>
                <Input type="number" step="0.01" value={utilities} onChange={(e) => setUtilities(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">{t("marketing")}</label>
                <Input type="number" step="0.01" value={marketing} onChange={(e) => setMarketing(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">{t("other")}</label>
                <Input type="number" step="0.01" value={other} onChange={(e) => setOther(e.target.value)} />
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-sm font-bold text-fg">
                <span>{t("totalMonthly")}:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {currency(
                    (Number(rent) || 0) +
                      (Number(salaries) || 0) +
                      (Number(utilities) || 0) +
                      (Number(marketing) || 0) +
                      (Number(other) || 0)
                  )}
                </span>
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t("save")}
              </Button>
            </form>
          </div>

          {/* Break-Even Results Dashboard */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-fg">Analysis Results ({analysis.period})</h2>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
                  status === "above"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : status === "below"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                {status === "above" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{t(`status.${status}`)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-accent/5 space-y-1">
                <div className="text-xs text-muted font-semibold">{t("currentRevenue")}</div>
                <div className="text-xl font-black text-fg">{currency(analysis.contribution.currentRevenue)}</div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-accent/5 space-y-1">
                <div className="text-xs text-muted font-semibold">{t("breakEvenRevenue")}</div>
                <div className="text-xl font-black text-fg">{currency(analysis.contribution.breakEvenRevenue)}</div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-accent/5 space-y-1">
                <div className="text-xs text-muted font-semibold">{t("breakEvenUnits")}</div>
                <div className="text-xl font-black text-fg">{nf.format(analysis.contribution.breakEvenUnitsEstimate)} units</div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-accent/5 space-y-1">
                <div className="text-xs text-muted font-semibold">{t("marginOfSafety")}</div>
                <div
                  className={`text-xl font-black ${
                    analysis.contribution.marginOfSafety >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {(analysis.contribution.marginOfSafety * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Progress / Ratio Bar */}
            <div className="space-y-2 pt-4 border-t border-border">
              <div className="flex justify-between text-xs font-semibold text-muted">
                <span>Revenue vs Break-Even Progress</span>
                <span>
                  {Math.round((analysis.contribution.currentRevenue / (analysis.contribution.breakEvenRevenue || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    analysis.contribution.currentRevenue >= analysis.contribution.breakEvenRevenue
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (analysis.contribution.currentRevenue / (analysis.contribution.breakEvenRevenue || 1)) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-muted pt-2">
              <div>Period Fixed Costs: <span className="font-bold text-fg">{currency(analysis.fixedCosts.periodFixedCosts)}</span></div>
              <div>Contribution Margin Ratio: <span className="font-bold text-fg">{(analysis.contribution.contributionMarginRatio * 100).toFixed(1)}%</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
