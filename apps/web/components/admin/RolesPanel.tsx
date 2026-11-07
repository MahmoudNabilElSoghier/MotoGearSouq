"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createRoleSchema,
  type CreateRoleInput,
  type Role,
} from "@motogearsouq/shared";
import {
  ApiError,
  createRole,
  deleteRole,
  getRoles,
  updateRole,
} from "@motogearsouq/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "./FormBanner";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

interface RolesPanelProps {
  onChanged?: () => void;
  onCancel?: () => void;
}

export function RolesPanel({ onChanged, onCancel }: RolesPanelProps) {
  const t = useTranslations("admin.employees");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameAr, setEditNameAr] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { key: "", nameAr: "", nameEn: "" },
  });

  const refresh = useCallback(() => {
    getRoles()
      .then(setRoles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) {
      const errBody = err.body as { message?: string; issues?: Array<{ path?: string | string[]; message?: string }> };
      if (errBody?.issues && Array.isArray(errBody.issues)) {
        const details = errBody.issues
          .map((i) => `${Array.isArray(i.path) ? i.path.join(".") : i.path || ""}: ${i.message}`)
          .join("; ");
        return t("form.validationFailed", { details });
      }
      if (errBody?.message) return errBody.message;
      if (err.message) return err.message;
    }
    if (err instanceof Error) return err.message;
    return t("form.saveError");
  };

  const onCreate = async (data: CreateRoleInput) => {
    setBusy(true);
    setBanner(null);
    try {
      await createRole(data);
      reset();
      setBanner({ type: "success", message: t("rolesPanel.createdOk") });
      refresh();
      onChanged?.();
    } catch (err) {
      setBanner({ type: "error", message: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const onStartEdit = (role: Role) => {
    setBanner(null);
    setEditingId(role.id);
    setEditNameAr(role.nameAr);
    setEditNameEn(role.nameEn);
  };

  const onSaveEdit = async () => {
    if (!editingId) return;
    if (!editNameAr.trim() || !editNameEn.trim()) {
      setBanner({ type: "error", message: t("rolesPanel.namesRequired") });
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      await updateRole(editingId, {
        nameAr: editNameAr.trim(),
        nameEn: editNameEn.trim(),
      });
      setEditingId(null);
      setBanner({ type: "success", message: t("rolesPanel.updatedOk") });
      refresh();
      onChanged?.();
    } catch (err) {
      setBanner({ type: "error", message: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (role: Role) => {
    if (!window.confirm(t("rolesPanel.deleteConfirm"))) return;
    setBusy(true);
    setBanner(null);
    try {
      await deleteRole(role.id);
      setBanner({ type: "success", message: t("rolesPanel.deletedOk") });
      refresh();
      onChanged?.();
    } catch (err) {
      setBanner({ type: "error", message: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-bold text-fg">{t("rolesPanel.title")}</h2>
        {onCancel && (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} className="inline-flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" />
            {t("rolesPanel.close")}
          </Button>
        )}
      </div>

      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      <form onSubmit={handleSubmit(onCreate)} className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-5 border-b border-border">
        <Input label={t("rolesPanel.keyLabel")} {...register("key")} error={errors.key?.message} placeholder={t("rolesPanel.keyPlaceholder")} />
        <Input label={t("rolesPanel.nameArLabel")} {...register("nameAr")} error={errors.nameAr?.message} placeholder={t("rolesPanel.nameArPlaceholder")} />
        <Input label={t("rolesPanel.nameEnLabel")} {...register("nameEn")} error={errors.nameEn?.message} placeholder={t("rolesPanel.nameEnPlaceholder")} />
        <div className="flex items-end">
          <Button type="submit" size="sm" disabled={busy} className="inline-flex items-center gap-1.5">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {t("rolesPanel.add")}
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-3 py-3 font-medium text-start">{t("rolesPanel.nameArLabel")}</th>
              <th className="px-3 py-3 font-medium text-start">{t("rolesPanel.nameEnLabel")}</th>
              <th className="px-3 py-3 font-medium text-start">{t("rolesPanel.keyLabel")}</th>
              <th className="px-3 py-3 font-medium text-start">{t("rolesPanel.typeCol")}</th>
              <th className="px-3 py-3 font-medium text-start">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  <Loader2 className="w-5 h-5 animate-spin inline-block text-accent" />
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">{t("rolesPanel.empty")}</td>
              </tr>
            ) : (
              roles.map((role) => {
                const isEditing = editingId === role.id;
                return (
                  <tr key={role.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2.5 text-fg">
                      {isEditing ? (
                        <input
                          value={editNameAr}
                          onChange={(e) => setEditNameAr(e.target.value)}
                          className="w-full bg-bg border border-border rounded-lg px-3 py-1.5 text-fg text-sm focus:border-accent focus:outline-none"
                          dir="rtl"
                        />
                      ) : (
                        role.nameAr
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-fg">
                      {isEditing ? (
                        <input
                          value={editNameEn}
                          onChange={(e) => setEditNameEn(e.target.value)}
                          className="w-full bg-bg border border-border rounded-lg px-3 py-1.5 text-fg text-sm focus:border-accent focus:outline-none"
                          dir="ltr"
                        />
                      ) : (
                        role.nameEn
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted" dir="ltr">{role.key}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          role.system ? "bg-accent-strong/15 text-accent" : "bg-bg text-muted"
                        }`}
                      >
                        {role.system ? t("rolesPanel.system") : t("rolesPanel.custom")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-3 text-sm">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={onSaveEdit}
                              disabled={busy}
                              className="inline-flex items-center gap-1 font-semibold text-accent hover:underline disabled:opacity-50"
                            >
                              {t("rolesPanel.save")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="font-semibold text-muted hover:underline"
                            >
                              {t("rolesPanel.cancel")}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onStartEdit(role)}
                              className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              {t("rolesPanel.edit")}
                            </button>
                            {!role.system && (
                              <button
                                type="button"
                                onClick={() => onDelete(role)}
                                disabled={busy}
                                className="inline-flex items-center gap-1 font-semibold text-red-400 hover:underline disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {t("rolesPanel.delete")}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
