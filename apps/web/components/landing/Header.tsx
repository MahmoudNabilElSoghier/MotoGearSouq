"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingCart, Home, Bike, Wrench, Tag, MapPin, Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CartIcon } from "@/components/cart/CartIcon";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations("landing.nav");
  const tHeader = useTranslations("header");

  const isLanding = pathname === `/${locale}` || pathname === `/${locale}/`;

  const NAV_ICONS: Record<string, React.ElementType> = {
    hero: Home,
    models: Bike,
    "spare-parts": Wrench,
    brands: Tag,
    branches: MapPin,
    contact: Mail,
  };

  const navItems = [
    { id: "hero", label: tNav("home") },
    { id: "models", label: tNav("models") },
    { id: "spare-parts", label: tNav("spareParts") },
    { id: "brands", label: tNav("brands") },
    { id: "branches", label: tNav("branches") },
    { id: "contact", label: tNav("contact") },
  ];

  const storeButton = (onClick?: () => void) => (
    <Button variant="primary" size="sm" asChild>
      <Link
        href={`/${locale}/products`}
        onClick={onClick}
        className="inline-flex items-center gap-2"
      >
        <ShoppingCart className="w-4 h-4" />
        <span>{tNav("store")}</span>
      </Link>
    </Button>
  );

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur border-b border-border">
      <Container size="xl" as="div">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex flex-col items-start">
            <Image
              src={locale === "ar" ? "/brand/Logo_Icon_Name_AR_Large.png" : "/brand/Logo_Icon_Name_EN_Large.png"}
              alt={locale === "ar" ? "موتوغير سوق" : "MotoGearSouq"}
              width={150}
              height={60}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav aria-label={tHeader("navAria")} className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = NAV_ICONS[item.id];
              return isLanding ? (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="relative inline-flex items-center gap-2 text-lg font-semibold text-fg/90 hover:text-fg transition-colors after:absolute after:-bottom-1 after:start-0 after:h-[2px] after:w-full after:origin-left rtl:after:origin-right after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100 focus-visible:outline-none"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.id}
                  href={`/${locale}#${item.id}`}
                  className="relative inline-flex items-center gap-2 text-lg font-semibold text-fg/90 hover:text-fg transition-colors after:absolute after:-bottom-1 after:start-0 after:h-[2px] after:w-full after:origin-left rtl:after:origin-right after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100 focus-visible:outline-none"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions (Switchers + Store CTA) */}
          <div className="hidden md:flex items-center gap-3">
            <CartIcon />
            <LocaleSwitcher />
            <ThemeToggle />
            {storeButton()}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={tHeader("menuToggle")}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
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
          id="mobile-menu"
          className="md:hidden bg-card border-b border-border px-4 pt-4 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <nav aria-label={tHeader("navAria")} className="flex flex-col space-y-3">
            {navItems.map((item) => {
              const Icon = NAV_ICONS[item.id];
              return isLanding ? (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-2 text-base font-medium text-muted hover:text-fg transition-colors px-2 py-1 rounded-md hover:bg-bg/50"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.id}
                  href={`/${locale}#${item.id}`}
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-2 text-base font-medium text-muted hover:text-fg transition-colors px-2 py-1 rounded-md hover:bg-bg/50"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <CartIcon />
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            {storeButton(() => setIsOpen(false))}
          </div>
        </div>
      )}
    </header>
  );
}
