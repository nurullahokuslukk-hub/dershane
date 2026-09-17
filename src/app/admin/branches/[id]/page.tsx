import { notFound } from "next/navigation";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { BranchForm } from "@/components/admin/BranchForm";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";

export default async function EditBranchPage({
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
  const { data: branch } = await supabase
    .from("branch")
    .select("id, name, address")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (!branch) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Şube Düzenle</h1>
      <BranchForm branchId={branch.id} tenantId={tenantId} initial={branch} />
    </div>
  );
}
