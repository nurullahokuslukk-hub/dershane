import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";

// Ekran: web-dershane-admin.md → "Ekran: Sınıf Listesi"
export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  const { branch: branchFilter } = await searchParams;

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
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("name");

  const baseQuery = supabase
    .from("class_group")
    .select("id, name, academic_year, branch:branch_id(id, name), student_profile(count)")
    .eq("tenant_id", tenantId);
  const { data: classes } = await (branchFilter
    ? baseQuery.eq("branch_id", branchFilter)
    : baseQuery
  )
    .order("name")
    .returns<
      {
        id: string;
        name: string;
        academic_year: string;
        branch: { id: string; name: string } | null;
        student_profile: { count: number }[];
      }[]
    >();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Sınıflar</h1>
        <Link
          href="/admin/classes/new"
          className="rounded-md bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
        >
          Sınıf Ekle
        </Link>
      </div>

      {branches && branches.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/admin/classes"
            className={!branchFilter ? "font-semibold underline" : "text-black/60 dark:text-white/60"}
          >
            Tümü
          </Link>
          {branches.map((b) => (
            <Link
              key={b.id}
              href={`/admin/classes?branch=${b.id}`}
              className={
                branchFilter === b.id
                  ? "font-semibold underline"
                  : "text-black/60 dark:text-white/60"
              }
            >
              {b.name}
            </Link>
          ))}
        </div>
      )}

      {(!classes || classes.length === 0) && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Henüz sınıf yok.
        </p>
      )}

      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {classes?.map((c) => (
          <li key={c.id} className="py-2 text-sm">
            <Link href={`/admin/classes/${c.id}`} className="hover:underline">
              <span className="font-medium">{c.name}</span>
            </Link>{" "}
            <span className="text-black/50 dark:text-white/50">
              · {c.branch?.name} · {c.academic_year} ·{" "}
              {c.student_profile[0]?.count ?? 0} öğrenci
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
