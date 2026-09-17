import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";
import { ExamForm } from "@/components/admin/ExamForm";

export default async function NewExamPage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  if (!tenantId) return <NoTenantNotice />;

  return (
    <>
      <PageHeader
        title="Yeni Deneme"
        description="Önce denemeyi oluştur, sonra sonuç dosyasını bu denemeye yükle."
      />
      <ExamForm tenantId={tenantId} />
    </>
  );
}
