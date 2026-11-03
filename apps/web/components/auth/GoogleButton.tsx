"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";

interface GoogleButtonProps {
  mode: "login" | "register";
  next?: string;
}

export function GoogleButton({ mode, next }: GoogleButtonProps) {
  const t = useTranslations("customerAuth.google");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setLoading(true);
      setError(null);
      const redirectUri = `${window.location.origin}/api/auth/customer/google/callback`;
      const state = crypto.randomUUID();
      sessionStorage.setItem("google_oauth_state", state);
      sessionStorage.setItem("google_oauth_next", next || `/${locale}/account`);

      const res = await fetch(
        `/api/auth/customer/google/start?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
      );
      const json = await res.json();
      if (!res.ok || !json.data?.authUrl) {
        throw new Error(json.message || "Failed to start Google OAuth");
      }

      window.location.href = json.data.authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-2.5 font-medium border-border bg-card hover:bg-card/80 text-fg transition-colors"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.15 21.32 7.23 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.6H1.18C.43 8.13 0 9.87 0 12s.43 3.87 1.18 5.4l4.09-3.16z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.15 2.68 1.18 6.6l4.09 3.15c.95-2.85 3.6-4.95 6.73-4.95z"
          />
        </svg>
        <span>{mode === "login" ? t("loginButton") : t("registerButton")}</span>
      </Button>
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
