import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { resolveWriteTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const check = checkRoleApi(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  if (!check.ok) return check.response;

  const { name, address, tenantId } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "Şube adı gerekli." }, { status: 400 });
  }

  const resolved = await resolveWriteTenantId(check.viewer, tenantId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: branch, error } = await supabase
    .from("branch")
    .insert({
      tenant_id: resolved.tenantId,
      name,
      address: address ?? null,
    })
    .select("id")
    .single();

  if (error || !branch) {
    return NextResponse.json(
      {
        error:
          error?.code === "23505"
            ? "Bu isimde bir şube zaten var."
            : "Şube oluşturulamadı.",
      },
      { status: 400 },
    );
  }

  await logAudit({
    tenantId: resolved.tenantId,
    actorAccountId: check.viewer.account.id,
    action: "branch.create",
    targetTable: "branch",
    targetId: branch.id,
    metadata: { name, address },
  });

  return NextResponse.json({ ok: true });
}
