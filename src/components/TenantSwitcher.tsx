"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

// Sadece system_admin için gösterilir (bkz. src/app/admin/layout.tsx).
// tenantId asla yetki kararı için kullanılmaz — sadece hangi dershanenin
// gösterileceğini belirler (bkz. src/lib/tenant-context.ts).
export function TenantSwitcher({
  tenants,
  activeTenantId,
}: {
  tenants: { id: string; name: string }[];
  activeTenantId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tenantId = e.target.value;
    await fetch("/api/admin/active-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <select
      value={activeTenantId ?? ""}
      onChange={handleChange}
      disabled={pending}
      className="rounded-md border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/15"
    >
      <option value="" disabled>
        Dershane seç
      </option>
      {tenants.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
