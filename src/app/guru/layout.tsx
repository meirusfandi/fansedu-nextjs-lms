"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { GuruSidebar } from "@/components/GuruSidebar";
import { getAuthRole, logout, clearAuthToken } from "@/lib/api";

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const role = getAuthRole();
    if (role !== "trainer") {
      router.replace(role ? "/login?reason=unsupported" : "/login");
    }
  }, [router]);

  const handleLogout = () => {
    logout().catch(() => {});
    clearAuthToken();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <GuruSidebar currentPath={pathname ?? ""} onLogout={handleLogout} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
