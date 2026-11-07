"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingCart, Home, Tag, Mail, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CartIcon } from "@/components/cart/CartIcon";
import { getLandingSections } from "@motogearsouq/api-client";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations("landing.nav");
  const tHeader = useTranslations("header");

  const isAr = locale === "ar";
  const [sections, setSections] = useState<{ id: string; slug: string; titleAr: string; titleEn: string }[]>([]);

  useEffect(() => {
    getLandingSections().then((data) => {
      setSections(data);
    });
  }, []);

  const isLanding = pathname === `/${locale}` || pathname === `/${locale}/`;

  // Navigation items come from CMS sections
  // Home link is hardcoded, sections come from CMS, Brands/Brands/Contact are hardcoded at the end


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
            <Link
              href={`/${locale}#hero`}
              className="relative inline-flex items-center gap-2 text-lg font-semibold text-fg/90 hover:text-fg transition-colors after:absolute after:-bottom-1 after:start-0 after:h-[2px] after:w-full after:origin-left rtl:after:origin-right after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100 focus-visible:outline-none"
            >
              <Home className="w-4 h-4 shrink-0" />
              {tNav("home")}
            </Link>
            {sections.map((section) => (
              <Link
                key={section.slug}
                href={`/${locale}#${section.slug}`}
                className="relative inline-flex items-center gap-2 text-lg font-semibold text-fg/90 hover:text-fg transition-colors after:absolute after:-bottom-1 after:start-0 after:h-[2px] after:w-full after:origin-left rtl:after:origin-right after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100 focus-visible:outline-none"
              >
                {isLanding ? (
                  <a
                    key={section.slug}
                    href={`#${section.slug}`}
                    className="relative inline-flex items-center gap-2 text-lg font-semibold text-fg/90 hover:text-fg transition-colors after:absolute after:-bottom-1 after:start-0 after:h-[2px] after:w-full after:origin-left rtl:after:origin-right after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100 focus-visible:outline-none"
                  >
                    {isAr ? section.titleAr : section.titleEn}
                  </a>
                ) : (
                  <Link
                    key={section.slug}
                    href={`/${locale}#${section.slug}`}
                    className="relative inline-flex items-center gap-2 text-lg font-semibold text-fg/90 hover:text-fg transition-colors after:absolute after:-bottom-1 after:start-0 after:h-[2px] after:w-full after:origin-left rtl:after:origin-right after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100 focus-visible:outline-none"
                  >
                    {isAr ? section.titleAr : section.titleEn}
                  </Link>
                )}
              </Link>
            ))}
              <Link href="#brands" className="relative inline-flex items-center gap-2 text-lg font-semibold text-fg/90 hover:text-fg transition-colors after:absolute after:-bottom-1 after:start-0 after:h-[2px] after:w-full after:origin-left rtl:after:origin-right after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100 focus-visible:outline-none">
              <Tag className="w-4 h-4 shrink-0" />
              {tNav("brands")}
            </Link>
            <Link href="#branches" className="relative inline-flex items-center gap-2 text-lg font-semibold text-fg/90 hover:text-fg transition-colors after:absolute after:-bottom-1 after:start-0 after:h-[2px] after:w-full after:origin-left rtl:after:origin-right after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100 focus-visible:outline-none">
              <MapPin className="w-4 h-4 shrink-0" />
              {tNav("branches")}
            </Link>
            <Link href="#contact" className="relative inline-flex items-center gap-2 text-lg font-semibold text-fg/90 hover:text-fg transition-colors after:absolute after:-bottom-1 after:start-0 after:h-[2px] after:w-full after:origin-left rtl:after:origin-right after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100 focus-visible:outline-none">
              <Mail className="w-4 h-4 shrink-0" />
              {tNav("contact")}
            </Link>
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
            {sections.map((section) => (
              <Link
                key={section.slug}
                href={`/${locale}#${section.slug}`}
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-2 text-base font-medium text-muted hover:text-fg transition-colors px-2 py-1 rounded-md hover:bg-bg/50"
              >
                {isAr ? section.titleAr : section.titleEn}
              </Link>
            ))}
            <Link href="#brands" className="inline-flex items-center gap-2 text-base font-medium text-muted hover:text-fg transition-colors px-2 py-1 rounded-md hover:bg-bg/50">
              <Tag className="w-4 h-4 shrink-0" />
              {tNav("brands")}
            </Link>
            <Link href="#branches" className="inline-flex items-center gap-2 text-base font-medium text-muted hover:text-fg transition-colors px-2 py-1 rounded-md hover:bg-bg/50">
              <MapPin className="w-4 h-4 shrink-0" />
              {tNav("branches")}
            </Link>
            <Link href="#contact" className="inline-flex items-center gap-2 text-base font-medium text-muted hover:text-fg transition-colors px-2 py-1 rounded-md hover:bg-bg/50">
              <Mail className="w-4 h-4 shrink-0" />
              {tNav("contact")}
            </Link>
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
