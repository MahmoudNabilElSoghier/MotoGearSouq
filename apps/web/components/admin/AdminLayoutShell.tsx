"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

export function AdminLayoutShell({
  locale,
  collapsed,
}: {
  locale: string;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === `/${locale}/admin/login`;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {!isLoginPage && <AdminNav collapsed={collapsed} />}
    </div>
  );
}
