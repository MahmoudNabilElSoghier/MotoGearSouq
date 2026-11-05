"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

export function AdminLayoutShell({ locale }: { locale: string }) {
  const pathname = usePathname();
  const isLoginPage = pathname === `/${locale}/admin/login`;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {!isLoginPage && <AdminNav />}
    </div>
  );
}
