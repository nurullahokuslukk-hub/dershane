"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Global aramada bir sonuca tıklayınca system_admin'in aktif dershanesini
// değiştirip o dershanenin panosuna atlamasını sağlar.
export function JumpToTenantButton({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch("/api/admin/active-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    router.push("/admin");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border border-black/15 px-2 py-0.5 text-xs hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/5"
    >
      {loading ? "..." : "Bu dershaneye geç"}
    </button>
  );
}
