import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { AUDIT_ACTION_LABEL } from "@/lib/audit-labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";
import { table, tableWrap, td, th, trHover } from "@/components/ui/styles";

// Ekran: 2026-09-16 kullanıcıyla konuşulan "ölçek/karışıklık" iyileştirmesi —
// admin mutasyonlarının izlenebilirliği.
export default async function AuditLogPage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);

  if (!tenantId) return <NoTenantNotice />;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("audit_log")
    .select(
      "id, action, target_table, target_id, metadata, created_at, actor:actor_user_account_id(full_name)",
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<
      {
        id: string;
        action: string;
        target_table: string;
        target_id: string | null;
        metadata: Record<string, unknown>;
        created_at: string;
        actor: { full_name: string } | null;
      }[]
    >();

  return (
    <>
      <PageHeader
        title="İşlem Kayıtları"
        description="Bu dershanede yapılan yönetim işlemlerinin son 100 kaydı."
      />

      {!rows || rows.length === 0 ? (
        <EmptyState
          title="Henüz kayıt yok"
          description="Şube, sınıf, personel oluşturma ve toplu içe aktarma işlemleri burada listelenir."
        />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Tarih</th>
                <th className={th}>İşlem</th>
                <th className={th}>Detay</th>
                <th className={th}>Yapan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={trHover}>
                  <td className={`${td} whitespace-nowrap text-muted`}>
                    {new Date(r.created_at).toLocaleString("tr-TR")}
                  </td>
                  <td className={`${td} font-medium`}>
                    {AUDIT_ACTION_LABEL[r.action] ?? r.action}
                  </td>
                  <td className={`${td} text-muted`}>{describe(r.metadata)}</td>
                  <td className={`${td} text-muted`}>
                    {r.actor?.full_name ?? "(silinmiş kullanıcı)"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function describe(metadata: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof metadata?.name === "string") parts.push(metadata.name);
  if (typeof metadata?.createdCount === "number") {
    parts.push(`${metadata.createdCount} kayıt`);
  }
  if (typeof metadata?.rowCount === "number") {
    parts.push(`${metadata.rowCount} satır`);
  }
  if (typeof metadata?.kind === "string") parts.push(metadata.kind);
  return parts.join(" · ") || "—";
}
