import { notFound } from "next/navigation";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { GuidanceForm } from "@/components/admin/GuidanceForm";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";

export default async function EditGuidancePage({
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
  const [{ data: guidanceUser }, { data: classes }, { data: assignments }] =
    await Promise.all([
      supabase
        .from("user_account")
        .select("id, full_name")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .eq("role", "rehberlik")
        .single(),
      supabase
        .from("class_group")
        .select("id, name, student_profile(id, user_account(full_name))")
        .eq("tenant_id", tenantId)
        .order("name")
        .returns<
          {
            id: string;
            name: string;
            student_profile: {
              id: string;
              user_account: { full_name: string } | null;
            }[];
          }[]
        >(),
      supabase
        .from("guidance_student_assignment")
        .select("student_id")
        .eq("guidance_user_id", id),
    ]);

  if (!guidanceUser) notFound();

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
      <h1 className="text-xl font-semibold tracking-tight">Rehberlik Kullanıcısı Düzenle</h1>
      <GuidanceForm
        guidanceId={guidanceUser.id}
        tenantId={tenantId}
        classes={classesWithStudents}
        initial={{
          full_name: guidanceUser.full_name,
          studentIds: assignments?.map((a) => a.student_id) ?? [],
        }}
      />
    </div>
  );
}
