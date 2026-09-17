import { notFound } from "next/navigation";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { TeacherForm } from "@/components/admin/TeacherForm";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";

export default async function EditTeacherPage({
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
  const [{ data: teacher }, { data: classes }, { data: assignments }] =
    await Promise.all([
      supabase
        .from("user_account")
        .select("id, full_name")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .eq("role", "ogretmen")
        .single(),
      supabase.from("class_group").select("id, name").eq("tenant_id", tenantId).order("name"),
      supabase
        .from("teacher_class_assignment")
        .select("class_group_id")
        .eq("teacher_user_id", id),
    ]);

  if (!teacher) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Öğretmen Düzenle</h1>
      <TeacherForm
        teacherId={teacher.id}
        tenantId={tenantId}
        classes={classes ?? []}
        initial={{
          full_name: teacher.full_name,
          classIds: assignments?.map((a) => a.class_group_id) ?? [],
        }}
      />
    </div>
  );
}
