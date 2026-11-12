"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  createLandingSlide,
  deleteLandingSlide,
  getAllLandingSlides,
  updateLandingSlide,
  uploadDocument,
  ApiError,
  type LandingSlideRow,
} from "@motogearsouq/api-client";
import { compressImage } from "@/lib/compressImage";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  GripVertical,
  ImageIcon,
  LayoutGrid,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Plus,
  Save,
  Tag,
  Text,
  Trash2,
  X,
} from "lucide-react";

interface SlideForm {
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  ctaPrimaryLabelAr: string;
  ctaPrimaryLabelEn: string;
  ctaPrimaryLink: string;
  ctaSecondaryLabelAr: string;
  ctaSecondaryLabelEn: string;
  ctaSecondaryLink: string;
  order: number;
  isActive: boolean;
  image: string | null;
  removeImage: boolean;
}

interface ModalState {
  mode: "add" | "edit";
  id?: string;
  form: SlideForm;
}

const emptyForm = (order: number): SlideForm => ({
  titleAr: "",
  titleEn: "",
  subtitleAr: "",
  subtitleEn: "",
  ctaPrimaryLabelAr: "",
  ctaPrimaryLabelEn: "",
  ctaPrimaryLink: "",
  ctaSecondaryLabelAr: "",
  ctaSecondaryLabelEn: "",
  ctaSecondaryLink: "",
  order,
  isActive: true,
  image: null,
  removeImage: false,
});

const formFromSlide = (slide: LandingSlideRow): SlideForm => ({
  titleAr: slide.titleAr,
  titleEn: slide.titleEn,
  subtitleAr: slide.subtitleAr ?? "",
  subtitleEn: slide.subtitleEn ?? "",
  ctaPrimaryLabelAr: slide.ctaPrimaryLabelAr ?? "",
  ctaPrimaryLabelEn: slide.ctaPrimaryLabelEn ?? "",
  ctaPrimaryLink: slide.ctaPrimaryLink ?? "",
  ctaSecondaryLabelAr: slide.ctaSecondaryLabelAr ?? "",
  ctaSecondaryLabelEn: slide.ctaSecondaryLabelEn ?? "",
  ctaSecondaryLink: slide.ctaSecondaryLink ?? "",
  order: slide.order,
  isActive: slide.isActive,
  image: slide.image,
  removeImage: false,
});

export function SlidesManager() {
  const t = useTranslations("admin.landing");
  const tCommon = useTranslations("common");
  const [slides, setSlides] = useState<LandingSlideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    preview: string;
  } | null>(null);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) {
      const errBody = err.body as {
        message?: string;
        issues?: Array<{ path?: string | string[]; message?: string }>;
      };
      if (
        errBody?.issues &&
        Array.isArray(errBody.issues) &&
        errBody.issues.length > 0
      ) {
        const details = errBody.issues
          .map(
            (i) =>
              `${Array.isArray(i.path) ? i.path.join(".") : i.path || ""}: ${i.message}`,
          )
          .join("; ");
        return tCommon("validationFailed", { details });
      }
      if (errBody?.message) return errBody.message;
      if (err.message) return err.message;
    }
    if (err instanceof Error) return err.message;
    return String(err);
  };

  const refresh = useCallback(async () => {
    const data = await getAllLandingSlides();
    setSlides(data);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 3000);
    return () => clearTimeout(timer);
  }, [banner]);

  const clearPendingFile = useCallback(() => {
    setPendingFile((prev) => {
      if (prev) URL.revokeObjectURL(prev.preview);
      return null;
    });
  }, []);

  const closeModal = () => {
    clearPendingFile();
    setModal(null);
  };

  const openAdd = () => {
    clearPendingFile();
    setModal({ mode: "add", form: emptyForm(slides.length) });
  };

  const openEdit = (slide: LandingSlideRow) => {
    clearPendingFile();
    setModal({ mode: "edit", id: slide.id, form: formFromSlide(slide) });
  };

  const setForm = (patch: Partial<SlideForm>) => {
    setModal((prev) =>
      prev ? { ...prev, form: { ...prev.form, ...patch } } : prev,
    );
  };

  const markSaving = (key: string) =>
    setSaving((prev) => new Set(prev).add(key));
  const clearSaving = (key: string) =>
    setSaving((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

  const handleSave = async () => {
    if (!modal) return;
    const { mode, id, form } = modal;
    if (!form.titleAr.trim() || !form.titleEn.trim()) {
      setBanner({ type: "error", message: t("heroSlides.titleRequired") });
      return;
    }
    const key = mode === "add" ? "new" : id ?? "edit";
    markSaving(key);
    try {
      const payload = {
        titleAr: form.titleAr.trim(),
        titleEn: form.titleEn.trim(),
        subtitleAr: form.subtitleAr.trim() || null,
        subtitleEn: form.subtitleEn.trim() || null,
        ctaPrimaryLabelAr: form.ctaPrimaryLabelAr.trim() || null,
        ctaPrimaryLabelEn: form.ctaPrimaryLabelEn.trim() || null,
        ctaPrimaryLink: form.ctaPrimaryLink.trim() || null,
        ctaSecondaryLabelAr: form.ctaSecondaryLabelAr.trim() || null,
        ctaSecondaryLabelEn: form.ctaSecondaryLabelEn.trim() || null,
        ctaSecondaryLink: form.ctaSecondaryLink.trim() || null,
        order: Number(form.order) || 0,
        isActive: form.isActive,
      };

      let slideId: string;
      if (mode === "add") {
        const res = await createLandingSlide(payload);
        // The API answers with { isMock: true } and a tmp- id when withDb
        // swallowed a DB error and served its fallback — the slide was NOT
        // persisted, so never report success for it.
        if (
          res.isMock ||
          !res.data?.id ||
          res.data.id.startsWith("tmp-")
        ) {
          throw new Error(t("heroSlides.errorCreate"));
        }
        slideId = res.data.id;
        setBanner({ type: "success", message: t("heroSlides.created") });
      } else {
        await updateLandingSlide(id!, {
          ...payload,
          image: form.removeImage ? null : undefined,
        });
        slideId = id!;
        setBanner({ type: "success", message: t("heroSlides.saved") });
      }

      if (pendingFile) {
        const compressed = await compressImage(pendingFile.file);
        const uploaded = await uploadDocument(
          compressed,
          "LANDING_SLIDE",
          slideId,
        );
        if (uploaded.data.url) {
          await updateLandingSlide(slideId, { image: uploaded.data.url });
        }
      }

      clearPendingFile();
      setModal(null);
      await refresh();
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      console.error("Save slide failed:", msg);
      setBanner({ type: "error", message: msg });
    } finally {
      clearSaving(key);
    }
  };

  const handleToggleActive = async (slide: LandingSlideRow) => {
    const key = `active-${slide.id}`;
    markSaving(key);
    try {
      await updateLandingSlide(slide.id, { isActive: !slide.isActive });
      await refresh();
      setBanner({ type: "success", message: t("heroSlides.saved") });
    } catch (err: unknown) {
      setBanner({ type: "error", message: getErrorMessage(err) });
    } finally {
      clearSaving(key);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    markSaving(id);
    try {
      await deleteLandingSlide(id);
      await refresh();
      setBanner({ type: "success", message: t("heroSlides.deleted") });
    } catch (err: unknown) {
      setBanner({ type: "error", message: getErrorMessage(err) });
    } finally {
      clearSaving(id);
    }
  };

  const fieldLabel = (label: ReactNode) => (
    <span className="text-xs font-semibold text-muted flex items-center gap-1.5">
      {label}
    </span>
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-fg">{t("heroSlides.title")}</h2>
            <p className="text-xs text-muted">{t("subtitle")}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={openAdd}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {t("heroSlides.add")}
        </Button>
      </div>

      {banner && (
        <div
          className={`m-4 rounded-lg border p-4 flex items-center justify-between gap-3 ${
            banner.type === "success"
              ? "bg-emerald-50 border-emerald-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium text-fg">
              {banner.message}
            </span>
          </div>
          <button
            type="button"
            className="text-xs text-muted hover:text-fg hover:underline"
            onClick={() => setBanner(null)}
          >
            {t("dismiss")}
          </button>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title={t("heroSlides.delete")}
          message={t("heroSlides.deleteConfirm", {
            title:
              slides.find((s) => s.id === confirmDeleteId)?.titleAr ?? "",
          })}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            const id = confirmDeleteId;
            setConfirmDeleteId(null);
            void handleDeleteSlide(id);
          }}
        />
      )}

      {slides.length === 0 ? (
        <div className="p-8 text-center text-muted text-sm">
          {t("heroSlides.empty")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted border-b border-border/50">
                <th className="px-4 py-3 text-start font-semibold">
                  {t("heroSlides.fields.order")}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {t("heroSlides.fields.titleAr")}
                </th>
                <th className="px-4 py-3 text-start font-semibold">
                  {t("heroSlides.fields.image")}
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  {t("heroSlides.fields.isActive")}
                </th>
                <th className="px-4 py-3 text-end font-semibold">
                  {t("heroSlides.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {slides.map((slide) => (
                <tr
                  key={slide.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <GripVertical className="w-4 h-4" />
                      {slide.order}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-fg block">
                      {slide.titleAr}
                    </span>
                    <span className="text-xs text-muted">{slide.titleEn}</span>
                  </td>
                  <td className="px-4 py-3">
                    {slide.image ? (
                      <div className="w-16 h-10 rounded overflow-hidden bg-muted/20 border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote storage URL */}
                        <img
                          src={slide.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-10 rounded bg-muted/20 border border-border flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-muted" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={slide.isActive}
                      disabled={saving.has(`active-${slide.id}`)}
                      onChange={() => void handleToggleActive(slide)}
                      aria-label={t("heroSlides.fields.isActive")}
                      className="w-4 h-4 accent-accent cursor-pointer disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(slide)}
                        disabled={saving.has(slide.id)}
                        aria-label={t("heroSlides.edit")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteId(slide.id)}
                        disabled={saving.has(slide.id)}
                        aria-label={t("heroSlides.delete")}
                        className="text-red-400 hover:bg-red-500/5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-fg">
                {modal.mode === "add"
                  ? t("heroSlides.add")
                  : t("heroSlides.edit")}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label={t("heroSlides.cancel")}
                className="p-1.5 rounded-md text-muted hover:text-fg hover:bg-muted/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                {fieldLabel(
                  <>
                    <Tag className="w-3 h-3" />
                    {t("heroSlides.fields.titleAr")}
                  </>,
                )}
                <Input
                  value={modal.form.titleAr}
                  onChange={(e) => setForm({ titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                {fieldLabel(
                  <>
                    <Tag className="w-3 h-3" />
                    {t("heroSlides.fields.titleEn")}
                  </>,
                )}
                <Input
                  value={modal.form.titleEn}
                  onChange={(e) => setForm({ titleEn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                {fieldLabel(
                  <>
                    <Text className="w-3 h-3" />
                    {t("heroSlides.fields.subtitleAr")}
                  </>,
                )}
                <textarea
                  value={modal.form.subtitleAr}
                  onChange={(e) => setForm({ subtitleAr: e.target.value })}
                  rows={2}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-fg placeholder:text-muted focus:border-accent focus:outline-none resize-y"
                />
              </div>
              <div className="space-y-2">
                {fieldLabel(
                  <>
                    <Text className="w-3 h-3" />
                    {t("heroSlides.fields.subtitleEn")}
                  </>,
                )}
                <textarea
                  value={modal.form.subtitleEn}
                  onChange={(e) => setForm({ subtitleEn: e.target.value })}
                  rows={2}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-fg placeholder:text-muted focus:border-accent focus:outline-none resize-y"
                />
              </div>
              <div className="space-y-2">
                {fieldLabel(
                  <>
                    <LinkIcon className="w-3 h-3" />
                    {t("heroSlides.fields.ctaPrimaryLabelAr")}
                  </>,
                )}
                <Input
                  value={modal.form.ctaPrimaryLabelAr}
                  onChange={(e) =>
                    setForm({ ctaPrimaryLabelAr: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                {fieldLabel(
                  <>
                    <LinkIcon className="w-3 h-3" />
                    {t("heroSlides.fields.ctaPrimaryLabelEn")}
                  </>,
                )}
                <Input
                  value={modal.form.ctaPrimaryLabelEn}
                  onChange={(e) =>
                    setForm({ ctaPrimaryLabelEn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                {fieldLabel(
                  <>
                    <ArrowRight className="w-3 h-3" />
                    {t("heroSlides.fields.ctaPrimaryLink")}
                  </>,
                )}
                <Input
                  value={modal.form.ctaPrimaryLink}
                  onChange={(e) => setForm({ ctaPrimaryLink: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                {fieldLabel(
                  <>
                    <LinkIcon className="w-3 h-3" />
                    {t("heroSlides.fields.ctaSecondaryLabelAr")}
                  </>,
                )}
                <Input
                  value={modal.form.ctaSecondaryLabelAr}
                  onChange={(e) =>
                    setForm({ ctaSecondaryLabelAr: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                {fieldLabel(
                  <>
                    <LinkIcon className="w-3 h-3" />
                    {t("heroSlides.fields.ctaSecondaryLabelEn")}
                  </>,
                )}
                <Input
                  value={modal.form.ctaSecondaryLabelEn}
                  onChange={(e) =>
                    setForm({ ctaSecondaryLabelEn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                {fieldLabel(
                  <>
                    <ArrowRight className="w-3 h-3" />
                    {t("heroSlides.fields.ctaSecondaryLink")}
                  </>,
                )}
                <Input
                  value={modal.form.ctaSecondaryLink}
                  onChange={(e) =>
                    setForm({ ctaSecondaryLink: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                {fieldLabel(
                  <>
                    <ImageIcon className="w-3 h-3" />
                    {t("heroSlides.fields.image")}
                  </>,
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {(modal.form.image || pendingFile) && (
                    <div className="w-24 h-14 rounded overflow-hidden bg-muted/20 border border-border flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                      <img
                        src={
                          pendingFile
                            ? pendingFile.preview
                            : (modal.form.image ?? "")
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="text-xs text-muted file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-fg hover:file:bg-secondary/80"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        clearPendingFile();
                        setPendingFile({
                          file,
                          preview: URL.createObjectURL(file),
                        });
                      }
                      e.target.value = "";
                    }}
                  />
                  {modal.form.image && !pendingFile && (
                    <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modal.form.removeImage}
                        onChange={(e) =>
                          setForm({ removeImage: e.target.checked })
                        }
                      />
                      {t("heroSlides.removeImage")}
                    </label>
                  )}
                  {pendingFile && (
                    <button
                      type="button"
                      onClick={clearPendingFile}
                      className="text-xs text-muted hover:text-fg hover:underline"
                    >
                      {t("heroSlides.cancel")}
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {fieldLabel(
                  <>
                    <ArrowRight className="w-3 h-3" />
                    {t("heroSlides.fields.order")}
                  </>,
                )}
                <Input
                  type="number"
                  value={String(modal.form.order)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setForm({ order: Number.isNaN(v) ? 0 : v });
                  }}
                />
              </div>
              <div className="space-y-2 flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-fg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modal.form.isActive}
                    onChange={(e) => setForm({ isActive: e.target.checked })}
                    className="w-4 h-4 accent-accent cursor-pointer"
                  />
                  {t("heroSlides.fields.isActive")}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
              <Button variant="secondary" size="sm" onClick={closeModal}>
                {t("heroSlides.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSave()}
                disabled={saving.has(
                  modal.mode === "add" ? "new" : (modal.id ?? "edit"),
                )}
              >
                {saving.has(
                  modal.mode === "add" ? "new" : (modal.id ?? "edit"),
                ) ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                {t("heroSlides.save")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
