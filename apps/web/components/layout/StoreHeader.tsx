"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  UserCircle,
  LogIn,
  LogOut,
  ChevronDown,
  House,
  Tag,
  Mail,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { company } from "@/lib/config";
import { useCustomerAuth } from "@/lib/customer-auth-store";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CartIcon } from "@/components/cart/CartIcon";

export function StoreHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations("navigation");
  const tHeader = useTranslations("header");
  const tLogin = useTranslations("customerAuth.login");
  const tAccount = useTranslations("customerAuth.account");
  const tCart = useTranslations("cart");
  const customer = useCustomerAuth((s) => s.customer);

  useEffect(() => {
    useCustomerAuth.getState().init();
  }, []);

  const handleLogout = async () => {
    setAccountOpen(false);
    await useCustomerAuth.getState().logout();
    router.push(`/${locale}`);
    router.refresh();
  };

  const navItems = [
    { label: tNav("home"), href: `/${locale}/products`, Icon: House },
    { label: tNav("brands"), href: `/${locale}/brands`, Icon: Tag },
    { label: tNav("contact"), href: `/${locale}#contact`, Icon: Mail },
  ];

  const isActive = (href: string) =>
    !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  const accountControl = customer ? (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAccountOpen((v) => !v)}
        aria-expanded={accountOpen}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-fg transition-colors hover:bg-card"
      >
        <UserCircle className="h-5 w-5 text-accent" />
        <span className="hidden max-w-[10ch] truncate sm:inline">{customer.name}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform ${accountOpen ? "rotate-180" : ""}`}
        />
      </button>
      {accountOpen && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setAccountOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute end-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-card p-1 shadow-xl"
          >
            <Link
              role="menuitem"
              href={`/${locale}/account`}
              onClick={() => setAccountOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-semibold text-fg transition-colors hover:bg-bg"
            >
              {tAccount("title")}
            </Link>
            <Link
              role="menuitem"
              href={`/${locale}/account/orders`}
              onClick={() => setAccountOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-semibold text-fg transition-colors hover:bg-bg"
            >
              {tAccount("sidebar.orders")}
            </Link>
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              {tAccount("sidebar.logout")}
            </button>
          </div>
        </>
      )}
    </div>
  ) : (
    <Link
      href={`/${locale}/login`}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-fg transition-colors hover:bg-card"
    >
      <LogIn className="h-5 w-5 text-accent" />
      <span className="hidden sm:inline">{tLogin("signinShort")}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-border">
      <Container size="xl" as="div">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex flex-col">
            <span className="text-xl md:text-2xl font-extrabold tracking-wider text-accent">
              {company.name}
            </span>
            <span className="text-xs text-muted font-medium">
              {tHeader("logoSubtitle")}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav aria-label={tHeader("navAria")} className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.Icon;
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`relative inline-flex items-center gap-2 text-base font-semibold transition-colors after:absolute after:-bottom-1 after:-start-1 after:h-[2px] after:w-full after:origin-left rtl:after:origin-right after:bg-accent after:transition-transform after:duration-300 focus-visible:outline-none ${
                    isActive(item.href)
                      ? "text-accent after:scale-x-100"
                      : "text-fg/90 hover:text-fg after:scale-x-0 hover:after:scale-x-100 focus-visible:after:scale-x-100"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {accountControl}
            <CartIcon label={tCart("label")} />
            <LocaleSwitcher />
            <ThemeToggle />
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={tHeader("menuToggle")}
              aria-expanded={isOpen}
              aria-controls="store-mobile-menu"
              className="p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          id="store-mobile-menu"
          className="md:hidden bg-card border-b border-border px-4 pt-4 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <nav aria-label={tHeader("navAria")} className="flex flex-col space-y-3">
            {navItems.map((item) => {
              const Icon = item.Icon;
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex items-center gap-2 text-base font-medium transition-colors px-2 py-1 rounded-md hover:bg-bg/50 ${
                    isActive(item.href) ? "text-accent" : "text-muted hover:text-fg"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            {accountControl}
            <CartIcon label={tCart("label")} />
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
