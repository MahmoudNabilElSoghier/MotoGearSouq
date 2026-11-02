"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { company } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CartIcon } from "@/components/cart/CartIcon";

export function StoreHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const tNav = useTranslations("navigation");
  const tHeader = useTranslations("header");

  const navItems = [
    { label: tNav("home"), href: `/${locale}/products` },
    { label: tNav("brands"), href: `/${locale}/brands` },
    { label: tNav("contact"), href: `/${locale}#contact` },
  ];

  const isActive = (href: string) =>
    !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

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
          <nav aria-label={tHeader("navAria")} className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`relative text-lg font-semibold transition-colors after:absolute after:-bottom-1 after:start-0 after:h-[2px] after:w-full after:origin-left rtl:after:origin-right after:bg-accent after:transition-transform after:duration-300 focus-visible:outline-none ${
                  isActive(item.href)
                    ? "text-accent after:scale-x-100"
                    : "text-fg/90 hover:text-fg after:scale-x-0 hover:after:scale-x-100 focus-visible:after:scale-x-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <CartIcon />
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
            {navItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`text-base font-medium transition-colors px-2 py-1 rounded-md hover:bg-bg/50 ${
                  isActive(item.href) ? "text-accent" : "text-muted hover:text-fg"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <CartIcon />
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
