"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  addLandingCard,
  addLandingSection,
  deleteSection,
  getLandingSections,
  updateLandingSection,
  updateLandingCard,
  removeLandingCard,
  uploadDocument,
  type LandingSectionRow,
  type LandingCardRow,
} from "@motogearsouq/api-client";
import { compressImage } from "@/lib/compressImage";
import { Loader2, Trash2, Plus, Save, ChevronRight, Tag, Link as LinkIcon, Globe, Text, ArrowRight, AlertCircle, CheckCircle, Image as ImageIcon } from "lucide-react";

export default function AdminLandingPage() {
  const t = useTranslations("admin.landing");
  const [sections, setSections] = useState<LandingSectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    getLandingSections()
      .then((data) => {
        setSections(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const isOpen = (id: string) => openSectionId === id;
  const toggleSection = (id: string) =>
    setOpenSectionId((prev) => (prev === id ? null : id));

  const handleSaveSection = async (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    setSaving((prev) => new Set(prev).add(id));
    try {
      await updateLandingSection(id, {
        titleAr: section.titleAr.trim(),
        titleEn: section.titleEn.trim(),
        subtitleAr: section.subtitleAr?.trim() ? section.subtitleAr : undefined,
        subtitleEn: section.subtitleEn?.trim() ? section.subtitleEn : undefined,
        ctaLabelAr: section.ctaLabelAr.trim(),
        ctaLabelEn: section.ctaLabelEn.trim(),
        ctaLink: section.ctaLink.trim(),
        order: Number(section.order),
      });
      setBanner({ type: "success", message: t("saved") });
    } catch (error: unknown) {
      const msg =
        error &&
        typeof error === "object" &&
        "body" in error &&
        (error as { body?: { message?: string } }).body?.message
          ? (error as { body: { message: string } }).body.message
          : error instanceof Error
            ? error.message
            : String(error);
      console.error("Save failed:", msg);
      setBanner({ type: "error", message: msg });
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleAddCard = async (sectionId: string) => {
    setSaving((prev) => new Set(prev).add(sectionId));
    try {
      await addLandingCard({
        sectionId,
        titleAr: "بطاقة جديدة",
        titleEn: "New card",
        link: "#",
      });
      const data = await getLandingSections();
      setSections(data);
    } catch {
      // error handled by toast-like state; keep simple
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
    }
  };

  const handleDeleteSection = async (id: string) => {
    setSaving((prev) => new Set(prev).add(id));
    try {
      await deleteSection(id);
      const data = await getLandingSections();
      setSections(data);
      setOpenSectionId(null);
      setBanner({
        type: "success",
        message: t("deleted"),
      });
    } catch {
      setBanner({
        type: "error",
        message: t("errorDelete"),
      });
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleAddSection = async () => {
    setSaving((prev) => new Set(prev).add("new"));
    try {
      await addLandingSection({
        slug: `section-${Date.now()}`,
        titleAr: "قسم جديد",
        titleEn: "New section",
        subtitleAr: "",
        subtitleEn: "",
        ctaLabelAr: "اقرأ المزيد",
        ctaLabelEn: "Read more",
        ctaLink: "#",
        order: 0,
      });
      const data = await getLandingSections();
      setSections(data);
      setBanner({ type: "success", message: t("created") });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : String(err);
      setBanner({ type: "error", message: msg });
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete("new");
        return next;
      });
    }
  };

  const handleCloseBanner = () => setBanner(null);

  // Auto-dismiss banner after 3 seconds
  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 3000);
    return () => clearTimeout(timer);
  }, [banner]);

  const [removePhotoMap, setRemovePhotoMap] = useState<Record<string, boolean>>({});

  const handleCardImageUpload = async (cardId: string, file: File) => {
    setSaving((prev) => new Set(prev).add(cardId));
    try {
      const compressed = await compressImage(file);
      const res = await uploadDocument(compressed, "LANDING_CARD", cardId);
      const url = res.data.url;
      if (url) {
        setSections((prev) =>
          prev.map((s) => ({
            ...s,
            cards: s.cards.map((c) =>
              c.id === cardId ? { ...c, photo: url } : c
            ),
          }))
        );
        setRemovePhotoMap((prev) => ({ ...prev, [cardId]: false }));
      }
      setBanner({ type: "success", message: t("saved") });
    } catch (err: unknown) {
      setBanner({
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }
  };

  const handleSaveCard = async (
    sectionId: string,
    cardId: string,
    card: LandingCardRow,
  ) => {
    const shouldRemove = removePhotoMap[cardId] ?? false;
    setSaving((prev) => new Set(prev).add(cardId));
    try {
      await updateLandingCard(cardId, {
        titleAr: card.titleAr.trim(),
        titleEn: card.titleEn.trim(),
        descAr: card.descAr?.trim() ? card.descAr : undefined,
        descEn: card.descEn?.trim() ? card.descEn : undefined,
        link: card.link.trim(),
        photo: shouldRemove ? null : (card.photo ?? undefined),
        order: Number(card.order),
      });
      setBanner({ type: "success", message: t("saved") });
    } catch {
      // keep simple
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    await removeLandingCard(cardId);
    const data = await getLandingSections();
    setSections(data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          <p className="text-sm text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleAddSection}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {t("addSection")}
          </Button>
        </div>
      </div>
      {banner && (
        <div className={`rounded-lg border p-4 flex items-center gap-3 ${
          banner.type === "success" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center gap-2">
            {banner.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">{banner.message}</span>
          </div>
          <button type="button" className="text-xs text-muted hover:text-fg hover:underline" onClick={handleCloseBanner}>
            {t("dismiss")}
          </button>
        </div>
      )}

      {sections.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <section
              key={section.id}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-fg">{section.titleAr}</h2>
                  <p className="text-xs text-muted">
                    {section.slug} · {t("cardCount", { count: section.cards.length })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isOpen(section.id) ? "secondary" : "ghost"}
                    onClick={() => toggleSection(section.id)}
                    disabled={saving.has(section.id)}
                  >
                    {isOpen(section.id) ? t("collapse") : t("edit")}
                    <ChevronRight
                      className={`w-4 h-4 ${
                        isOpen(section.id) ? "rotate-90" : ""
                      }`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSection(section.id)}
                    disabled={saving.has(section.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleSaveSection(section.id)}
                    disabled={saving.has(section.id)}
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {t("save")}
                  </Button>
                </div>
              </div>

              {isOpen(section.id) && (
                <div className="p-5 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-muted" />
                        {t("fields.titleAr")}
                      </label>
                      <Input
                        value={section.titleAr}
                        onChange={(e) => {
                          setSections((prev) =>
                            prev.map((s) =>
                              s.id === section.id
                                ? { ...s, titleAr: e.target.value }
                                : s
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-muted" />
                        {t("fields.titleEn")}
                      </label>
                      <Input
                        value={section.titleEn}
                        onChange={(e) => {
                          setSections((prev) =>
                            prev.map((s) =>
                              s.id === section.id
                                ? { ...s, titleEn: e.target.value }
                                : s
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-muted" />
                        {t("fields.ctaLabelAr")}
                      </label>
                      <Input
                        value={section.ctaLabelAr}
                        onChange={(e) => {
                          setSections((prev) =>
                            prev.map((s) =>
                              s.id === section.id
                                ? { ...s, ctaLabelAr: e.target.value }
                                : s
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-muted" />
                        {t("fields.ctaLabelEn")}
                      </label>
                      <Input
                        value={section.ctaLabelEn}
                        onChange={(e) => {
                          setSections((prev) =>
                            prev.map((s) =>
                              s.id === section.id
                                ? { ...s, ctaLabelEn: e.target.value }
                                : s
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                        <LinkIcon className="w-3 h-3 text-muted" />
                        {t("fields.ctaLink")}
                      </label>
                      <Input
                        value={section.ctaLink}
                        onChange={(e) => {
                          setSections((prev) =>
                            prev.map((s) =>
                              s.id === section.id
                                ? { ...s, ctaLink: e.target.value }
                                : s
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                        <Text className="w-3 h-3 text-muted" />
                        {t("fields.subtitleAr")}
                      </label>
                      <Input
                        value={section.subtitleAr ?? ""}
                        onChange={(e) => {
                          setSections((prev) =>
                            prev.map((s) =>
                              s.id === section.id
                                ? {
                                    ...s,
                                    subtitleAr: e.target.value || null,
                                  }
                                : s
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                        <Text className="w-3 h-3 text-muted" />
                        {t("fields.subtitleEn")}
                      </label>
                      <Input
                        value={section.subtitleEn ?? ""}
                        onChange={(e) => {
                          setSections((prev) =>
                            prev.map((s) =>
                              s.id === section.id
                                ? {
                                    ...s,
                                    subtitleEn: e.target.value || null,
                                  }
                                : s
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3 text-muted" />
                        {t("fields.order")}
                      </label>
                      <Input
                        type="number"
                        value={String(section.order)}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setSections((prev) =>
                            prev.map((s) =>
                              s.id === section.id
                                ? { ...s, order: Number.isNaN(v) ? 0 : v }
                                : s
                            ),
                          );
                        }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4">
                    <h3 className="text-sm font-semibold text-fg mb-3">
                      {t("cards.title")}
                    </h3>
                    <div className="space-y-3">
                      {section.cards.map((card) => (
                        <div
                          key={card.id}
                          className="flex flex-wrap items-center gap-3 border border-border/50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3 w-full">
                            {card.photo && !removePhotoMap[card.id] && (
                              <div className="relative w-12 h-12 rounded overflow-hidden bg-muted/20 flex-shrink-0 border border-border">
                                <img
                                  src={card.photo}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex flex-col gap-1 flex-1">
                              <label className="text-xs font-semibold text-muted flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                {t("cards.image")}
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="text-xs text-muted file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-fg hover:file:bg-secondary/80"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                      handleCardImageUpload(card.id, file);
                                  }}
                                  disabled={saving.has(card.id)}
                                />
                                {card.photo && (
                                  <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={
                                        removePhotoMap[card.id] ?? false
                                      }
                                      onChange={(e) =>
                                        setRemovePhotoMap((prev) => ({
                                          ...prev,
                                          [card.id]: e.target.checked,
                                        }))
                                      }
                                    />
                                    {t("cards.removeImage")}
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3 text-muted" />
                              <label className="text-xs font-semibold text-muted">
                                {t("cards.titleAr")}
                              </label>
                            </div>
                            <Input
                              value={card.titleAr}
                              onChange={(e) => {
                                setSections((prev) =>
                                  prev.map((s) =>
                                    s.id === section.id
                                      ? {
                                          ...s,
                                          cards: s.cards.map((c) =>
                                            c.id === card.id
                                              ? { ...c, titleAr: e.target.value }
                                              : c
                                          ),
                                        }
                                      : s
                                  ),
                                );
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3 text-muted" />
                              <label className="text-xs font-semibold text-muted">
                                {t("cards.titleEn")}
                              </label>
                            </div>
                            <Input
                              value={card.titleEn}
                              onChange={(e) => {
                                setSections((prev) =>
                                  prev.map((s) =>
                                    s.id === section.id
                                      ? {
                                          ...s,
                                          cards: s.cards.map((c) =>
                                            c.id === card.id
                                              ? { ...c, titleEn: e.target.value }
                                              : c
                                          ),
                                        }
                                      : s
                                  ),
                                );
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3 text-muted" />
                              <label className="text-xs font-semibold text-muted">
                                {t("cards.link")}
                              </label>
                            </div>
                            <Input
                              value={card.link}
                              onChange={(e) => {
                                setSections((prev) =>
                                  prev.map((s) =>
                                    s.id === section.id
                                      ? {
                                          ...s,
                                          cards: s.cards.map((c) =>
                                            c.id === card.id
                                              ? { ...c, link: e.target.value }
                                              : c
                                          ),
                                        }
                                      : s
                                  ),
                                );
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-muted" />
                              <label className="text-xs font-semibold text-muted">
                                {t("cards.descAr")}
                              </label>
                            </div>
                            <Input
                              value={card.descAr ?? ""}
                              onChange={(e) => {
                                setSections((prev) =>
                                  prev.map((s) =>
                                    s.id === section.id
                                      ? {
                                          ...s,
                                          cards: s.cards.map((c) =>
                                            c.id === card.id
                                              ? {
                                                  ...c,
                                                  descAr:
                                                    e.target.value || null,
                                                }
                                              : c
                                          ),
                                        }
                                      : s
                                  ),
                                );
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-muted" />
                              <label className="text-xs font-semibold text-muted">
                                {t("cards.descEn")}
                              </label>
                            </div>
                            <Input
                              value={card.descEn ?? ""}
                              onChange={(e) => {
                                setSections((prev) =>
                                  prev.map((s) =>
                                    s.id === section.id
                                      ? {
                                          ...s,
                                          cards: s.cards.map((c) =>
                                            c.id === card.id
                                              ? {
                                                  ...c,
                                                  descEn:
                                                    e.target.value || null,
                                                }
                                              : c
                                          ),
                                        }
                                      : s
                                  ),
                                );
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2 ms-auto">
                            <Button
                              variant="secondary"
                              onClick={() =>
                                handleSaveCard(section.id, card.id, card)
                              }
                              disabled={saving.has(card.id)}
                            >
                              {saving.has(card.id) ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleDeleteCard(card.id)}
                              className="text-red-400 hover:bg-red-500/5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        onClick={() => handleAddCard(section.id)}
                        disabled={saving.has(section.id)}
                        className="w-full inline-flex items-center justify-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t("cards.add")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}