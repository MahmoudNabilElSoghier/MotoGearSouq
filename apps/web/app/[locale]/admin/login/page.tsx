"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@elsaad/shared";
import { authApi } from "@elsaad/api-client";
import { useTranslations } from "next-intl";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.login(data);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loginError"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-fg mb-2">{t("heading")}</h1>
          <p className="text-sm text-muted">{t("subtitle")}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">{t("emailLabel")}</label>
            <div className="relative">
              <span className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-muted">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                {...register("email")}
                className="w-full bg-bg border border-border rounded-lg py-2.5 ps-10 pe-4 text-fg text-sm focus:outline-none focus:border-accent transition-colors"
                placeholder="admin@motogearsouq.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">{t("passwordLabel")}</label>
            <div className="relative">
              <span className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-muted">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                {...register("password")}
                className="w-full bg-bg border border-border rounded-lg py-2.5 ps-10 pe-4 text-fg text-sm focus:outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-strong text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("loggingIn")}</span>
              </>
            ) : (
              <span>{t("submit")}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
