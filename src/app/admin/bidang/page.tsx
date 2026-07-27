"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminBidangRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/master-data/kelas");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <p className="text-sm text-zinc-500">Mengalihkan ke master data bidang…</p>
    </div>
  );
}
