import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { ClassForm } from "@/components/admin/ClassForm";

export default async function NewClassPage() {
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
  const { data: branches } = await supabase
    .from("branch")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("name");

  if (!branches || branches.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        Sınıf eklemeden önce en az bir şube oluşturman gerekiyor.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Sınıf Ekle</h1>
      <ClassForm tenantId={tenantId} branches={branches} />
    </div>
  );
}
