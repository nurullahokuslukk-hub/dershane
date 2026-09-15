import { notFound } from "next/navigation";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { ClassForm } from "@/components/admin/ClassForm";

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
  if (!tenantId) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        Önce üstteki menüden bir dershane seç.
      </p>
    );
  }

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
      <h1 className="text-lg font-semibold">Sınıf Düzenle</h1>
      <ClassForm
        classId={classGroup.id}
        tenantId={tenantId}
        branches={branches ?? []}
        initial={classGroup}
      />
    </div>
  );
}
