"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminBidangRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/kelas");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <p className="text-sm text-zinc-500">Mengalihkan ke Management Kelas...</p>
    </div>
  );
}
