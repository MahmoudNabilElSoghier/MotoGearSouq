"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmployeeSchema, type CreateEmployeeInput, type UpdateEmployeeInput } from "@elsaad/shared";
import { createEmployee, updateEmployee, getBranches, ApiError } from "@elsaad/api-client";
import type { Employee, Branch } from "@elsaad/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "./FormBanner";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

interface EmployeeFormProps {
  mode?: "create" | "edit";
  initialData?: Employee;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EDIT_FORBIDDEN = ["id", "employeeNumber", "nationalId", "hireDate", "createdAt", "updatedAt", "baseSalary"] as const;

function pickEditable<T extends Record<string, unknown>>(input: T, forbidden: readonly string[]): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!forbidden.includes(k)) out[k] = v;
  }
  return out as Partial<T>;
}

export function EmployeeForm({ mode = "create", initialData, onSuccess, onCancel }: EmployeeFormProps) {
  const t = useTranslations("admin.employees");
  const tCommon = useTranslations("admin.forms.common");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBranches().then(setBranches).catch(() => {});
  }, []);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) {
      const errBody = err.body as { message?: string; issues?: Array<{ path?: string | string[]; message?: string }> };
      if (errBody?.issues && Array.isArray(errBody.issues)) {
        const details = errBody.issues
          .map((i) => `${Array.isArray(i.path) ? i.path.join(".") : i.path || ""}: ${i.message}`)
          .join("; ");
        return t("form.validationFailed", { details });
      }
      if (err.message) return err.message;
    }
    if (err instanceof Error) return err.message;
    return t("form.saveError");
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: initialData
      ? {
          employeeNumber: initialData.employeeNumber,
          nameAr: initialData.nameAr,
          nameEn: initialData.nameEn ?? "",
          nationalId: initialData.nationalId ?? "",
          phone: initialData.phone,
          email: initialData.email ?? "",
          role: initialData.role,
          branchId: initialData.branchId ?? "",
          active: initialData.active,
        }
      : {
          employeeNumber: `EMP-${Math.floor(100 + Math.random() * 900)}`,
          role: "cashier",
          active: true,
        },
  });

  const onSubmit = async (data: CreateEmployeeInput) => {
    setLoading(true);
    setBanner(null);
    try {
      const payload = {
        ...(initialData ?? {}),
        ...data,
        branchId: data.branchId || null,
        nameEn: data.nameEn || undefined,
        nationalId: data.nationalId || undefined,
        email: data.email || undefined,
      };

      if (mode === "edit" && initialData) {
        const editable = pickEditable(payload, EDIT_FORBIDDEN);
        const updatePayload: UpdateEmployeeInput = {
          nameAr: editable.nameAr as string,
          nameEn: editable.nameEn as string | undefined,
          nationalId: editable.nationalId as string | undefined,
          phone: editable.phone as string,
          email: editable.email as string | undefined,
          role: editable.role as string,
          branchId: editable.branchId as string | null | undefined,
          active: editable.active as boolean | undefined,
        };
        await updateEmployee(initialData.id, updatePayload);
        setBanner({ type: "success", message: t("form.updatedOk") });
      } else {
        await createEmployee(payload);
        setBanner({ type: "success", message: t("form.createdOk") });
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setBanner({
        type: "error",
        message: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
      <h2 className="text-lg font-bold text-fg mb-4">
        {mode === "edit" ? t("form.titleEdit") : t("form.titleNew")}
      </h2>

      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t("form.empNo")} {...register("employeeNumber")} error={errors.employeeNumber?.message} placeholder="EMP-001" disabled={mode === "edit"} />
          <Input label={t("form.nameAr")} {...register("nameAr")} error={errors.nameAr?.message} placeholder={t("form.phNameAr")} />
          <Input label={t("form.nameEn")} {...register("nameEn")} error={errors.nameEn?.message} placeholder="Ahmed Mohamed" />
          <Input label={t("form.nationalId")} {...register("nationalId")} error={errors.nationalId?.message} placeholder="29501010101010" />
          <Input label={t("form.phone")} {...register("phone")} error={errors.phone?.message} placeholder="01001234567" />
          <Input label={t("form.email")} {...register("email")} error={errors.email?.message} placeholder="ahmed@motogearsouq.com" />

          <div>
            <label className="block text-sm font-medium text-fg mb-1">{t("form.role")}</label>
            <select
              {...register("role")}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-fg text-sm focus:border-accent focus:outline-none"
            >
              <option value="cashier">{t("formRoles.cashier")}</option>
              <option value="manager">{t("formRoles.manager")}</option>
              <option value="warehouse">{t("formRoles.warehouse")}</option>
              <option value="admin">{t("formRoles.admin")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-1">{t("form.branchLabel")}</label>
            <select
              {...register("branchId")}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-fg text-sm focus:border-accent focus:outline-none"
            >
              <option value="">{t("form.noBranch")}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="employee-active" {...register("active")} className="w-4 h-4 rounded accent-accent" />
            <label htmlFor="employee-active" className="text-sm font-medium text-fg">{t("form.activeLabel")}</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          {onCancel && (
            <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
              {tCommon("cancel")}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ms-2" />
                <span>{t("form.saving")}</span>
              </>
            ) : (
              <span>{t("form.save")}</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
