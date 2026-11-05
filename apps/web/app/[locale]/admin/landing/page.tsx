"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  getLandingSections,
  updateLandingSection,
  addLandingCard,
  updateLandingCard,
  removeLandingCard,
  type LandingSectionRow,
  type LandingCardRow,
} from "@motogearsouq/api-client";
import { Loader2, Trash2, Plus, Save, ChevronRight, Tag, Link as LinkIcon, Globe, Text, ArrowRight } from "lucide-react";

export default function AdminLandingPage() {
  const t = useTranslations("admin.landing");
  const [sections, setSections] = useState<LandingSectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

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
        titleAr: section.titleAr,
        titleEn: section.titleEn,
        subtitleAr: section.subtitleAr ?? undefined,
        subtitleEn: section.subtitleEn ?? undefined,
        ctaLabelAr: section.ctaLabelAr,
        ctaLabelEn: section.ctaLabelEn,
        ctaLink: section.ctaLink,
        order: section.order,
      });
      console.log("Section saved:", id);
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
    } finally {
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

  const handleSaveCard = async (
    sectionId: string,
    cardId: string,
    card: LandingCardRow,
  ) => {
    setSaving((prev) => new Set(prev).add(cardId));
    try {
      await updateLandingCard(cardId, {
        titleAr: card.titleAr,
        titleEn: card.titleEn,
        descAr: card.descAr,
        descEn: card.descEn,
        link: card.link,
        order: card.order,
      });
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
        <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>

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