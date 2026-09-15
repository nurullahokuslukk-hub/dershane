import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";

// Ekran: web-dershane-admin.md → "Ekran: Dashboard"
export default async function AdminDashboardPage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  const supabase = await createClient();

  if (!tenantId) {
    const { data: tenants } = await supabase
      .from("tenant")
      .select("id, name")
      .order("name");

    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Üstteki menüden bir dershane seç, veya yeni bir tane oluştur.
        </p>
        <Link
          href="/admin/tenants/new"
          className="inline-block rounded-md bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
        >
          Yeni Dershane
        </Link>
        {tenants && tenants.length > 0 && (
          <ul className="text-sm text-black/60 dark:text-white/60">
            {tenants.map((t) => (
              <li key={t.id}>{t.name}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const [branches, classes, students, teachers, guidance, unclaimed] =
    await Promise.all([
      supabase
        .from("branch")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
      supabase
        .from("class_group")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
      supabase
        .from("student_profile")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
      supabase
        .from("user_account")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("role", "ogretmen"),
      supabase
        .from("user_account")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("role", "rehberlik"),
      supabase
        .from("user_account")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "unclaimed"),
    ]);

  const stats = [
    { label: "Şube", value: branches.count ?? 0, href: "/admin/branches" },
    { label: "Sınıf", value: classes.count ?? 0, href: "/admin/classes" },
    { label: "Öğrenci", value: students.count ?? 0, href: "/admin/classes" },
    { label: "Öğretmen", value: teachers.count ?? 0, href: "/admin/teachers" },
    { label: "Rehberlik", value: guidance.count ?? 0, href: "/admin/guidance" },
    {
      label: "Doğrulanmamış hesap",
      value: unclaimed.count ?? 0,
      href: "/admin/unclaimed",
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border border-black/10 p-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="text-sm text-black/60 dark:text-white/60">
              {s.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
