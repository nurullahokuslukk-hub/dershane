import { notFound } from "next/navigation";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { ClassForm } from "@/components/admin/ClassForm";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  if (!tenantId) return <NoTenantNotice />;

  const supabase = await createClient();
  const [{ data: classGroup }, { data: branches }] = await Promise.all([
    supabase
      .from("class_group")
      .select("id, name, branch_id, academic_year")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single(),
    supabase.from("branch").select("id, name").eq("tenant_id", tenantId).order("name"),
  ]);

  if (!classGroup) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Sınıf Düzenle</h1>
      <ClassForm
        classId={classGroup.id}
        tenantId={tenantId}
        branches={branches ?? []}
        initial={classGroup}
      />
    </div>
  );
}
