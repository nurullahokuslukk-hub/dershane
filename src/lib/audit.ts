import { createClient } from "@/lib/supabase/server";

// Best-effort: audit log yazımı başarısız olursa asıl işlemi engellemez,
// sadece konsola yazar. Her mutasyon Route Handler'ının sonunda çağrılır.
export async function logAudit(entry: {
  tenantId: string;
  actorAccountId: string;
  action: string;
  targetTable: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("audit_log").insert({
      tenant_id: entry.tenantId,
      actor_user_account_id: entry.actorAccountId,
      action: entry.action,
      target_table: entry.targetTable,
      target_id: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
    });
    if (error) {
      console.error("audit_log insert failed:", error.message);
    }
  } catch (err) {
    console.error("audit_log insert threw:", err);
  }
}
