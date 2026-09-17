import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { BranchForm } from "@/components/admin/BranchForm";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";

export default async function NewBranchPage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);

  if (!tenantId) return <NoTenantNotice />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Şube Ekle</h1>
      <BranchForm tenantId={tenantId} />
    </div>
  );
}
