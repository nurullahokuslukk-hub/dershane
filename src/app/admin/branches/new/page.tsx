import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { BranchForm } from "@/components/admin/BranchForm";

export default async function NewBranchPage() {
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

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Şube Ekle</h1>
      <BranchForm tenantId={tenantId} />
    </div>
  );
}
