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
      className="max-w-[14rem] rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground disabled:opacity-50"
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
