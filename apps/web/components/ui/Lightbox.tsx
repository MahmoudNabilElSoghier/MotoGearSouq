"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from "lucide-react";
import { useLocale } from "next-intl";

export type LightboxItem = {
  src: string;
  alt?: string;
};

type LightboxProps = {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

/**
 * Dependency-free lightbox: backdrop click, Escape, X button, prev/next
 * arrows (RTL-aware), basic focus management (close button focused on open).
 * Falls back to a placeholder graphic when the image src fails to load
 * (gallery placeholders have no real files yet).
 */
export function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [imgFailed, setImgFailed] = React.useState(false);
  const locale = useLocale();

  const item = items[index];
  const prev = () => onNavigate((index - 1 + items.length) % items.length);
  const next = () => onNavigate((index + 1) % items.length);

  React.useEffect(() => {
    closeRef.current?.focus();
  }, []);

  React.useEffect(() => {
    setImgFailed(false);
  }, [index]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // RTL: ArrowLeft advances (visual next is on the left)
      else if (e.key === "ArrowLeft") next();
      else if (e.key === "ArrowRight") prev();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length, onClose]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="عرض صورة المعرض"
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close: physical top-right (universal UX) */}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="إغلاق"
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X className="w-6 h-6" />
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="الصورة السابقة"
            className="absolute end-4 md:end-8 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {locale === "ar" ? <ChevronRight className="w-7 h-7" /> : <ChevronLeft className="w-7 h-7" />}
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="الصورة التالية"
            className="absolute start-4 md:start-8 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {locale === "ar" ? <ChevronLeft className="w-7 h-7" /> : <ChevronRight className="w-7 h-7" />}
          </button>
        </>
      )}

      <div className="relative w-full max-w-4xl aspect-[4/3] max-h-[85vh]">
        {imgFailed ? (
          /* Placeholder graphic until real photos are provided */
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-bg to-card border border-border flex flex-col items-center justify-center gap-4 text-center">
            <ImageIcon className="w-16 h-16 text-muted" />
            <span className="text-muted font-medium">
              {/* TODO: Use common.siteName from messages once Lightbox accepts
                  i18n context (currently hardcoded) */}
              {item.alt || "MotoGearSouq"}
            </span>
          </div>
        ) : (
          <Image
            src={item.src}
            alt={item.alt || ""}
            fill
            sizes="100vw"
            className="object-contain"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium tabular-nums" dir="ltr">
        {index + 1} / {items.length}
      </div>
    </div>
  );
}
