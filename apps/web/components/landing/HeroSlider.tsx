"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getLandingSlides,
  type LandingSlideRow,
} from "@motogearsouq/api-client";
import { Container } from "@/components/ui/Container";
import { Hero } from "./Hero";

const resolveLink = (link: string, locale: string): string =>
  link.includes("{locale}") ? link.replace("{locale}", locale) : link;

export function HeroSlider() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const isAr = locale === "ar";

  const [slides, setSlides] = useState<LandingSlideRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    getLandingSlides()
      .then((data) => {
        if (!cancelled) setSlides(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setSlides([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const plugins = useMemo(
    () => [
      Autoplay({
        delay: 5000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        stopOnFocusIn: true,
      }),
    ],
    [],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, direction: isAr ? "rtl" : "ltr" },
    plugins,
  );

  const [selected, setSelected] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Static Hero while slides load, and as the fallback when the API
  // returned no active slides (or is unreachable).
  if (slides.length === 0) return <Hero />;

  return (
    <section
      id="hero"
      className="relative min-h-[400px] sm:min-h-[500px] md:min-h-[600px] overflow-hidden scroll-mt-24"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => {
            const title = isAr ? slide.titleAr : slide.titleEn;
            const subtitle = isAr ? slide.subtitleAr : slide.subtitleEn;
            const primaryLabel = isAr
              ? slide.ctaPrimaryLabelAr
              : slide.ctaPrimaryLabelEn;
            const secondaryLabel = isAr
              ? slide.ctaSecondaryLabelAr
              : slide.ctaSecondaryLabelEn;
            const primaryLink = slide.ctaPrimaryLink
              ? resolveLink(slide.ctaPrimaryLink, locale)
              : null;
            const secondaryLink = slide.ctaSecondaryLink
              ? resolveLink(slide.ctaSecondaryLink, locale)
              : null;

            return (
              <div
                key={slide.id}
                className="relative shrink-0 w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center"
              >
                {/* Background: image when set, otherwise a dark gradient */}
                {slide.image ? (
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
                )}

                {/* Dark overlay for text legibility */}
                <div className="absolute inset-0 bg-black/60" />

                {/* Bottom gradient fade to blend into next section */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                <Container
                  size="xl"
                  className="relative z-10 flex flex-col items-center justify-center py-12 md:py-16 text-center md:text-right w-full"
                >
                  <div className="max-w-2xl md:max-w-3xl">
                    {(slide.titleAr.includes("قريباً") || slide.titleEn.toLowerCase().includes("coming soon")) && (
                      <span className="inline-block mb-4 px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-brand-red text-white shadow-lg">
                        {isAr ? "قريباً جداً" : "Coming Soon"}
                      </span>
                    )}
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-8 text-white">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed mb-0 max-w-2xl mx-auto md:mx-0">
                        {subtitle}
                      </p>
                    )}
                    {(primaryLabel && primaryLink) ||
                    (secondaryLabel && secondaryLink) ? (
                      <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center md:justify-start">
                        {primaryLabel && primaryLink && (
                          <Link
                            href={primaryLink}
                            className="rounded-lg font-semibold inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold bg-brand-red hover:bg-red-700 text-white"
                          >
                            {primaryLabel}
                          </Link>
                        )}
                        {secondaryLabel && secondaryLink && (
                          <Link
                            href={secondaryLink}
                            {...(secondaryLink.startsWith("http")
                              ? { target: "_blank", rel: "noopener noreferrer" }
                              : {})}
                            className="rounded-lg font-semibold inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold bg-white/5 backdrop-blur-sm border border-white/20 text-white hover:bg-white/10 transition-colors"
                          >
                            {secondaryLabel}
                          </Link>
                        )}
                      </div>
                    ) : null}
                  </div>
                </Container>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prev / next arrows — md+ only; sides and icons flip in RTL */}
      <button
        type="button"
        onClick={scrollPrev}
        aria-label={t("prevSlide")}
        className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 transition-colors backdrop-blur-sm ${
          isAr ? "right-4" : "left-4"
        }`}
      >
        {isAr ? (
          <ChevronRight className="w-6 h-6" aria-hidden="true" />
        ) : (
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={scrollNext}
        aria-label={t("nextSlide")}
        className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 transition-colors backdrop-blur-sm ${
          isAr ? "left-4" : "right-4"
        }`}
      >
        {isAr ? (
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        ) : (
          <ChevronRight className="w-6 h-6" aria-hidden="true" />
        )}
      </button>

      {/* Dots — active one is a brand-red pill */}
      <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={t("goToSlide", { index: index + 1 })}
            aria-current={index === selected ? "true" : undefined}
            className={`h-2 rounded-full transition-all ${
              index === selected
                ? "w-6 bg-brand-red"
                : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
