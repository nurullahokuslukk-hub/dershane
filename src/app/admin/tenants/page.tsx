import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";

// Ekran: A.0 — Dershane (tenant) listesi. Sadece system_admin.
export default async function TenantsPage() {
  requireRole(await getViewer(), ["system_admin"]);

  const supabase = await createClient();
  const { data: tenants } = await supabase
    .from("tenant")
    .select("id, name, slug, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Dershaneler</h1>
        <Link
          href="/admin/tenants/new"
          className="rounded-md bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
        >
          Yeni Dershane
        </Link>
      </div>

      {(!tenants || tenants.length === 0) && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Henüz dershane yok. &quot;Yeni Dershane&quot; ile başla.
        </p>
      )}

      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {tenants?.map((t) => (
          <li key={t.id} className="py-2 text-sm">
            <span className="font-medium">{t.name}</span>{" "}
            <span className="text-black/50 dark:text-white/50">
              ({t.slug}) · {t.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
