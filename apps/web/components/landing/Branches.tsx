"use client";

import { useState } from "react";
import { branches } from "@/lib/content";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

function mapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function embedUrl(address: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

export function Branches() {
  const t = useTranslations("branches");
  const [selectedBranch, setSelectedBranch] = useState(branches[0]);

  const selectedName = t(`items.${selectedBranch.id}.name`);
  const selectedAddress = t(`items.${selectedBranch.id}.address`);

  return (
    <section id="branches" className="py-20 md:py-28 bg-card border-y border-border scroll-mt-24">
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

        {/* Mobile: map on top; desktop: cards left, sticky map right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="md:order-2 md:sticky md:top-24">
            <FadeIn delay={0.1}>
              <div className="aspect-video rounded-lg overflow-hidden border border-border bg-bg">
                <iframe
                  key={selectedBranch.id}
                  src={embedUrl(selectedAddress)}
                  title={t("mapTitle", { name: selectedName })}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full border-0"
                />
              </div>
              <p className="mt-3 text-sm text-muted text-center">
                {selectedName}
              </p>
            </FadeIn>
          </div>

          <div className="md:order-1 space-y-4">
            {branches.map((branch, index) => {
              const isSelected = branch.id === selectedBranch.id;
              const branchName = t(`items.${branch.id}.name`);
              const branchAddress = t(`items.${branch.id}.address`);
              const branchHours = t(`items.${branch.id}.hours`);

              return (
                <FadeIn key={branch.id} delay={Math.min(index * 0.05, 0.3)}>
                  <Card
                    padding="lg"
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedBranch(branch)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedBranch(branch);
                      }
                    }}
                    className={`bg-bg/50 flex flex-col justify-between cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isSelected
                        ? "border-accent"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <div>
                      <h3 className="text-xl font-bold text-accent mb-4">
                        {branchName}
                      </h3>
                      <div className="space-y-3 text-sm text-muted">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                          <span>{branchAddress}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-accent shrink-0" />
                          <span dir="ltr">{branch.phone}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-accent shrink-0" />
                          <span>{branchHours}</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={mapsSearchUrl(branchAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-fg hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm self-start"
                    >
                      <span>{t("openInMaps")}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
