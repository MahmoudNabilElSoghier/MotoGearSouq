"use client";

import { useEffect, useState } from "react";
import { getEmployees, getRoles } from "@motogearsouq/api-client";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { RolesPanel } from "@/components/admin/RolesPanel";
import { FormBanner } from "@/components/admin/FormBanner";
import type { Employee, Role } from "@motogearsouq/shared";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Pencil, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const roleStyles: Record<string, string> = {
  admin: "bg-red-500/15 text-red-400",
  manager: "bg-amber-500/15 text-amber-400",
  cashier: "bg-sky-500/15 text-sky-400",
  warehouse: "bg-violet-500/15 text-violet-400",
};

export default function AdminEmployeesPage() {
  const t = useTranslations("admin.employees");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesKey, setRolesKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setLoading(true);
    getEmployees()
      .then(setEmployees)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  useEffect(() => {
    getRoles()
      .then(setRoles)
      .catch(() => {});
  }, [rolesKey]);

  const roleLabels: Record<string, string> = {
    admin: t("roles.admin"),
    manager: t("roles.manager"),
    cashier: t("roles.cashier"),
    warehouse: t("roles.warehouse"),
    ...Object.fromEntries(
      roles.map((r) => [r.key, locale === "ar" ? r.nameAr : r.nameEn]),
    ),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-fg">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? tCommon("loading") : t("countLine", { count: nf.format(employees.length) })}
          </p>
        </div>
        <div className="flex gap-3">
          {!showRoles && !showCreate && (
            <Button size="sm" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {t("add")}
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            aria-pressed={showRoles}
            onClick={() => {
              setShowCreate(false);
              setEditingEmployee(null);
              setShowRoles((v) => !v);
            }}
            className="inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {showRoles ? t("rolesPanel.close") : t("manageRoles")}
          </Button>
        </div>
      </div>

      {banner && <FormBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}

      {showRoles && (
        <RolesPanel onChanged={() => setRolesKey((k) => k + 1)} />
      )}

      {!showRoles && showCreate && (
        <EmployeeForm
          mode="create"
          onSuccess={() => {
            setShowCreate(false);
            setBanner({ type: "success", message: t("createdOk") });
            refetch();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {!showRoles && editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <EmployeeForm
              mode="edit"
              initialData={editingEmployee}
              onSuccess={() => {
                setEditingEmployee(null);
                setBanner({ type: "success", message: t("updatedOk") });
                refetch();
              }}
              onCancel={() => setEditingEmployee(null)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-4 py-3 font-medium text-start">{t("empNo")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("name")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("mobile")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("role")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("branchCol")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("ordersCol")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("statusCol")}</th>
                  <th className="px-4 py-3 font-medium text-start">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted">
                      {t("empty")}
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-fg" dir="ltr">
                        {employee.employeeNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-fg">
                        {locale === "ar" ? employee.nameAr : (employee.nameEn ?? employee.nameAr)}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`tel:${employee.phone}`}
                          className="text-fg hover:text-accent"
                          dir="ltr"
                        >
                          {employee.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            roleStyles[employee.role] ?? "bg-bg text-muted"
                          }`}
                        >
                          {roleLabels[employee.role] ?? employee.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {locale === "ar" ? (employee.branch?.nameAr ?? "—") : (employee.branch?.nameEn ?? employee.branch?.nameAr ?? "—")}
                      </td>
                      <td className="px-4 py-3 text-muted font-mono">
                        {nf.format(employee._count?.orders ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            employee.active
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-bg text-muted"
                          }`}
                        >
                          {employee.active ? tCommon("active") : tCommon("inactive")}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-3 text-sm">
                        <button
                          type="button"
                          onClick={() => setEditingEmployee(employee)}
                          className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          {tCommon("edit")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
