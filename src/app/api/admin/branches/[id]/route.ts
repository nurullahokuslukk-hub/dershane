import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { resolveWriteTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = checkRoleApi(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  if (!check.ok) return check.response;

  const { id } = await params;
  const { name, address, tenantId } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "Şube adı gerekli." }, { status: 400 });
  }

  const resolved = await resolveWriteTenantId(check.viewer, tenantId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("branch")
    .update({ name, address: address ?? null })
    .eq("id", id)
    .eq("tenant_id", resolved.tenantId);

  if (error) {
    return NextResponse.json(
      {
        error:
          error.code === "23505"
            ? "Bu isimde bir şube zaten var."
            : "Şube güncellenemedi.",
      },
      { status: 400 },
    );
  }

  await logAudit({
    tenantId: resolved.tenantId,
    actorAccountId: check.viewer.account.id,
    action: "branch.update",
    targetTable: "branch",
    targetId: id,
    metadata: { name, address },
  });

  return NextResponse.json({ ok: true });
}
