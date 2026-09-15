import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { GuidanceForm } from "@/components/admin/GuidanceForm";

export default async function NewGuidancePage() {
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
  const { data: classes } = await supabase
    .from("class_group")
    .select("id, name, student_profile(id, user_account(full_name))")
    .eq("tenant_id", tenantId)
    .order("name")
    .returns<
      {
        id: string;
        name: string;
        student_profile: { id: string; user_account: { full_name: string } | null }[];
      }[]
    >();

  const classesWithStudents = (classes ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    students: c.student_profile.map((sp) => ({
      id: sp.id,
      full_name: sp.user_account?.full_name ?? "(isimsiz)",
    })),
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Rehberlik Kullanıcısı Ekle</h1>
      <GuidanceForm tenantId={tenantId} classes={classesWithStudents} />
    </div>
  );
}
