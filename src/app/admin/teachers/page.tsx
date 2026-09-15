import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";

// Ekran: web-dershane-admin.md → "Ekran: Öğretmen Listesi"
export default async function TeachersPage() {
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
  const { data: teachers } = await supabase
    .from("user_account")
    .select(
      "id, full_name, status, teacher_class_assignment(class_group(name))",
    )
    .eq("tenant_id", tenantId)
    .eq("role", "ogretmen")
    .order("full_name")
    .returns<
      {
        id: string;
        full_name: string;
        status: string;
        teacher_class_assignment: { class_group: { name: string } | null }[];
      }[]
    >();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Öğretmenler</h1>
        <Link
          href="/admin/teachers/new"
          className="rounded-md bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
        >
          Öğretmen Ekle
        </Link>
      </div>

      {(!teachers || teachers.length === 0) && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Henüz öğretmen yok.
        </p>
      )}

      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {teachers?.map((t) => (
          <li key={t.id} className="py-2 text-sm">
            <Link href={`/admin/teachers/${t.id}`} className="hover:underline">
              <span className="font-medium">{t.full_name}</span>
            </Link>{" "}
            <span className="text-black/50 dark:text-white/50">
              ·{" "}
              {t.teacher_class_assignment
                .map((a) => a.class_group?.name)
                .filter(Boolean)
                .join(", ") || "sınıf atanmadı"}{" "}
              · {t.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
