import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { company } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowRight, ShoppingBag } from "lucide-react";

export function Hero() {
  const t = useTranslations("hero");
  const tc = useTranslations("categories");
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden scroll-mt-24"
    >
      {/* Background image */}
      <Image
        src="/images/hero-bg.jpg"
        alt="Hero background"
        fill
        sizes="100vw"
        objectFit="cover"
        className="object-cover"
        priority
      />

      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Bottom gradient fade to blend into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      <Container size="xl" className="relative z-10 flex flex-col items-center justify-center py-20 md:py-32 text-center md:text-right">
        <div className="max-w-2xl md:max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-8 text-white">
            <span className="text-brand-red">{isAr ? "أداء" : "Performance"}</span>
            <span className="text-white">{isAr ? "، " : ", "}</span>
            <span className="text-brand-gold">{isAr ? "قطع غيار أصلية" : "genuine parts"}</span>
            <span className="text-white">{isAr ? "، وثقة " : ", "}</span>
            <span className="text-brand-red">{isAr ? "السعد" : "ELSAAD trust"}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-10 max-w-2xl mx-auto md:mx-0">
            {t("subheadline")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
            <Button
              variant="primary"
              size="lg"
              asChild
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold bg-brand-red hover:bg-red-700"
            >
              <Link href={`/${locale}/products`}>
                <ShoppingBag className="w-5 h-5" />
                {tc("cta.enterStore")}
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              asChild
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold bg-black/50 backdrop-blur-sm text-white border border-white/20 hover:bg-black/70 transition-colors"
            >
              <a
                href={company.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ArrowRight className="w-5 h-5" />
                {t("ctaSecondary")}
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
