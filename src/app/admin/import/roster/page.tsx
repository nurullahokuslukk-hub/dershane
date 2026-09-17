import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { RosterImportClient } from "@/components/admin/RosterImportClient";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";

// Ekran: web-dershane-admin.md → "Ekran: Toplu İçe Aktar"
export default async function RosterImportPage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);

  if (!tenantId) return <NoTenantNotice />;

  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("class_group")
    .select("id, name, branch:branch_id(id, name)")
    .eq("tenant_id", tenantId)
    .order("name")
    .returns<
      { id: string; name: string; branch: { id: string; name: string } | null }[]
    >();

  const classInfos = (classes ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    branchId: c.branch?.id ?? "",
    branchName: c.branch?.name ?? "",
  }));

  if (classInfos.length === 0) {
    return (
      <p className="text-sm text-muted">
        Roster içe aktarmadan önce en az bir şube ve sınıf oluşturman
        gerekiyor.
      </p>
    );
  }

  return <RosterImportClient tenantId={tenantId} classes={classInfos} />;
}
