import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { TeacherForm } from "@/components/admin/TeacherForm";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";

export default async function NewTeacherPage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);

  if (!tenantId) return <NoTenantNotice />;

  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("class_group")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Öğretmen Ekle</h1>
      <TeacherForm tenantId={tenantId} classes={classes ?? []} />
    </div>
  );
}
