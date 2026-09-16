import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { generateClaimCode } from "@/lib/roster/claim-code";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = checkRoleApi(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  if (!check.ok) return check.response;

  const { id } = await params;
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("account_claim_code")
    .update({
      code: generateClaimCode(),
      status: "active",
      expires_at: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    })
    .eq("user_account_id", id)
    .select("tenant_id")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "Kod yenilenemedi." }, { status: 400 });
  }

  await logAudit({
    tenantId: updated.tenant_id,
    actorAccountId: check.viewer.account.id,
    action: "claim_code.renew",
    targetTable: "account_claim_code",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
