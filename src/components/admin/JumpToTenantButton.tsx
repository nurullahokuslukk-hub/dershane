"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btnXs } from "@/components/ui/styles";

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
      className={btnXs}
    >
      {loading ? "..." : "Bu dershaneye geç"}
    </button>
  );
}
