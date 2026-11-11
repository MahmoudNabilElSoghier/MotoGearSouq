import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";

export function Hero() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section
      id="hero"
      className="relative min-h-[35vh] sm:min-h-[45vh] flex items-center overflow-hidden scroll-mt-24"
    >
      {/* Background image */}
      <Image
        src="/images/hero-bg.jpg"
        alt={t("bgAlt")}
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />

      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Bottom gradient fade to blend into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      <Container size="xl" className="relative z-10 flex flex-col items-center justify-center py-12 md:py-16 text-center md:text-right">
        <div className="max-w-2xl md:max-w-3xl">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-8 text-white">
            {t("headlinePrefix")}
            <span className="text-brand-red">{isAr ? "السعد" : "ELSAAD"}</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed mb-0 max-w-2xl mx-auto md:mx-0">
            {t("subheadline")}
          </p>
        </div>
      </Container>
    </section>
  );
}
