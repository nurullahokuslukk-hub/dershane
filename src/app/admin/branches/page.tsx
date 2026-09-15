import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";

// Ekran: web-dershane-admin.md → "Ekran: Şube Listesi"
export default async function BranchesPage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);

  if (!tenantId) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        Önce üstteki menüden bir dershane seç.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: branches } = await supabase
    .from("branch")
    .select("id, name, address, class_group(count)")
    .eq("tenant_id", tenantId)
    .order("name");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Şubeler</h1>
        <Link
          href="/admin/branches/new"
          className="rounded-md bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
        >
          Şube Ekle
        </Link>
      </div>

      {(!branches || branches.length === 0) && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Henüz şube yok.
        </p>
      )}

      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {branches?.map((b) => (
          <li key={b.id} className="py-2 text-sm">
            <Link href={`/admin/branches/${b.id}`} className="hover:underline">
              <span className="font-medium">{b.name}</span>
            </Link>{" "}
            {b.address && (
              <span className="text-black/50 dark:text-white/50">
                · {b.address}
              </span>
            )}{" "}
            <span className="text-black/50 dark:text-white/50">
              · {b.class_group[0]?.count ?? 0} sınıf
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
