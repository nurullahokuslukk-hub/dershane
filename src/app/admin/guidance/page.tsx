import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";

// Ekran: web-dershane-admin.md → "Ekran: Rehberlik Listesi"
export default async function GuidancePage() {
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
  const { data: guidanceUsers } = await supabase
    .from("user_account")
    .select("id, full_name, status, guidance_student_assignment(count)")
    .eq("tenant_id", tenantId)
    .eq("role", "rehberlik")
    .order("full_name")
    .returns<
      {
        id: string;
        full_name: string;
        status: string;
        guidance_student_assignment: { count: number }[];
      }[]
    >();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Rehberlik</h1>
        <Link
          href="/admin/guidance/new"
          className="rounded-md bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
        >
          Rehberlik Kullanıcısı Ekle
        </Link>
      </div>

      {(!guidanceUsers || guidanceUsers.length === 0) && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Henüz rehberlik kullanıcısı yok.
        </p>
      )}

      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {guidanceUsers?.map((g) => (
          <li key={g.id} className="py-2 text-sm">
            <Link href={`/admin/guidance/${g.id}`} className="hover:underline">
              <span className="font-medium">{g.full_name}</span>
            </Link>{" "}
            <span className="text-black/50 dark:text-white/50">
              · {g.guidance_student_assignment[0]?.count ?? 0} öğrenci ·{" "}
              {g.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
