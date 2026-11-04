"use client";

import Image from "next/image";
import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { Lightbox } from "@/components/ui/Lightbox";

const SHOWROOM_IMAGES = [
  "/images/showroom-1.jpg",
  "/images/showroom-2.jpg",
  "/images/showroom-3.jpg",
  "/images/showroom-4.jpg",
  "/images/showroom-5.jpg",
  "/images/showroom-6.jpg",
];

export function ShowroomGallery() {
  const t = useTranslations("gallery");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <section
      id="showroom"
      className="py-20 md:py-28 bg-brand-dark border-y border-brand-silver/20 scroll-mt-24"
    >
      {/* Subtle radial gradient decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(252,163,17,0.10),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(217,4,41,0.08),transparent_70%)] pointer-events-none" />

      <Container size="xl" className="relative z-10">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-fg mb-4">
              {t("title")}
            </h2>
            <p className="text-muted text-lg">
              {t("subtitle")}
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {SHOWROOM_IMAGES.map((src, index) => (
            <FadeIn
              key={src}
              delay={Math.min(index * 0.05, 0.3)}
              className="h-full"
            >
              <button
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={t("viewImage", { n: index + 1 })}
                className="group relative block w-full h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark"
              >
                <div className="overflow-hidden rounded-xl border border-white/10 group-hover:border-brand-gold/50 transition-colors duration-300 aspect-[4/3] bg-brand-dark">
                  <Image
                    src={src}
                    alt={t("viewImage", { n: index + 1 })}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    objectFit="cover"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    priority={index < 2}
                  />
                  {/* Bottom dark gradient overlay for text readability */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                  {/* Image icon overlay for accessibility */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ImageIcon className="w-12 h-12 text-brand-gold/50" />
                  </div>
                </div>
              </button>
            </FadeIn>
          ))}
        </div>

        {selectedIndex !== null && (
          <Lightbox
            items={SHOWROOM_IMAGES.map((src) => ({ src, alt: t("placeholder") }))}
            index={selectedIndex}
            onClose={() => setSelectedIndex(null)}
            onNavigate={setSelectedIndex}
          />
        )}
      </Container>
    </section>
  );
}
