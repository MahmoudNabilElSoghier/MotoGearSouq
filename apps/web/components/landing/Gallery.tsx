"use client";

import { useState } from "react";
import { gallery } from "@/lib/content";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Image as ImageIcon } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { Lightbox } from "@/components/ui/Lightbox";

export function Gallery() {
  const t = useTranslations("gallery");
  const tCommon = useTranslations("common");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <section id="gallery" className="py-20 md:py-28 bg-card border-y border-border scroll-mt-24">
      <Container size="xl">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              {t("title")}
            </h2>
            <p className="text-muted text-lg">
              {t("subtitle")}
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gallery.map((item, index) => (
            <FadeIn key={item.id} delay={Math.min(index * 0.05, 0.3)} className="h-full">
              <button
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={t("viewImage", { n: index + 1 })}
                className="group relative block w-full h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <Card
                  padding="none"
                  className="overflow-hidden bg-bg border-border relative aspect-[4/3] flex items-center justify-center"
                >
                  {/* Placeholder graphic until real photos are provided */}
                  <div className="absolute inset-0 bg-gradient-to-br from-bg to-card flex flex-col items-center justify-center p-6 text-center group-hover:scale-105 transition-transform duration-500">
                    <ImageIcon className="w-12 h-12 text-muted mb-3 group-hover:text-accent transition-colors" />
                    <span className="text-sm font-medium text-muted">
                      {tCommon("brandName")}
                    </span>
                  </div>
                  {/* Hover overlay + caption */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <span className="absolute bottom-4 start-4 text-white font-bold translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    {tCommon("brandName")}
                  </span>
                </Card>
              </button>
            </FadeIn>
          ))}
        </div>
      </Container>

      {selectedIndex !== null && (
        <Lightbox
          items={gallery.map((g) => ({ src: g.src, alt: g.alt }))}
          index={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}
    </section>
  );
}
