import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";

const ACTION_LABEL: Record<string, string> = {
  "tenant.create": "Dershane oluşturuldu",
  "branch.create": "Şube oluşturuldu",
  "branch.update": "Şube güncellendi",
  "class_group.create": "Sınıf oluşturuldu",
  "class_group.update": "Sınıf güncellendi",
  "teacher.create": "Öğretmen eklendi",
  "teacher.update": "Öğretmen güncellendi",
  "guidance.create": "Rehberlik kullanıcısı eklendi",
  "guidance.update": "Rehberlik kullanıcısı güncellendi",
  "claim_code.renew": "Doğrulama kodu yenilendi",
  "roster.import": "Roster toplu içe aktarıldı",
};

// Ekran: 2026-09-16 kullanıcıyla konuşulan "ölçek/karışıklık" iyileştirmesi —
// admin mutasyonlarının izlenebilirliği.
export default async function AuditLogPage() {
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
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">İşlem Kayıtları</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Bu dershanede yapılan yönetim işlemlerinin son 100 kaydı.
      </p>

      {(!rows || rows.length === 0) && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Henüz kayıt yok.
        </p>
      )}

      <ul className="divide-y divide-black/10 text-sm dark:divide-white/10">
        {rows?.map((r) => (
          <li key={r.id} className="py-2">
            <span className="text-black/50 dark:text-white/50">
              {new Date(r.created_at).toLocaleString("tr-TR")} ·{" "}
            </span>
            <span className="font-medium">
              {ACTION_LABEL[r.action] ?? r.action}
            </span>{" "}
            {typeof r.metadata?.createdCount === "number" && (
              <span className="text-black/50 dark:text-white/50">
                ({r.metadata.createdCount} kayıt)
              </span>
            )}{" "}
            <span className="text-black/50 dark:text-white/50">
              · {r.actor?.full_name ?? "(silinmiş kullanıcı)"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
