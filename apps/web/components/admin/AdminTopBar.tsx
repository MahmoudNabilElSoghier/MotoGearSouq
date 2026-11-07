"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { authApi, type AuthUser } from "@motogearsouq/api-client";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ChevronDown, LogOut, User } from "lucide-react";

function getInitials(email: string): string {
  const local = email.split("@")[0];
  const parts = local.split(/[._\-+]/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function AdminTopBar() {
  const t = useTranslations("admin.topBar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === `/${locale}/admin/login`;

  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoginPage) return;
    let cancelled = false;
    authApi
      .me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isLoginPage]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  if (isLoginPage) return null;

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await authApi.logout();
    } catch {}
    router.push(`/${locale}/admin/login`);
    router.refresh();
  };

  const initials = user?.email ? getInitials(user.email) : "";

  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-bg/60 backdrop-blur-sm px-6 py-4">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-fg">
            {t("title")}
          </span>
          <LocaleSwitcher />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-card"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-strong/20 text-xs font-bold text-accent">
                {initials || <User className="h-4 w-4" />}
              </span>
              {user?.email && (
                <span className="hidden max-w-[180px] truncate text-xs text-muted sm:inline">
                  {user.email}
                </span>
              )}
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute end-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-card p-1 shadow-xl"
                >
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-xs text-muted">{user?.email ?? "—"}</p>
                  </div>
                  <Link
                    role="menuitem"
                    href={`/${locale}/account`}
                    onClick={() => setMenuOpen(false)}
                    className="mt-1 block rounded-md px-3 py-2 text-sm font-semibold text-fg transition-colors hover:bg-bg"
                  >
                    {t("myProfile")}
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
