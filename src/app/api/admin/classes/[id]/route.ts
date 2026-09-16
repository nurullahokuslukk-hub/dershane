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
  const { name, branchId, academicYear, tenantId } = await request.json();
  if (!name || !branchId || !academicYear) {
    return NextResponse.json(
      { error: "Sınıf adı, şube ve akademik yıl gerekli." },
      { status: 400 },
    );
  }

  const resolved = await resolveWriteTenantId(check.viewer, tenantId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: branch } = await supabase
    .from("branch")
    .select("id")
    .eq("id", branchId)
    .eq("tenant_id", resolved.tenantId)
    .single();
  if (!branch) {
    return NextResponse.json({ error: "Geçersiz şube." }, { status: 400 });
  }

  const { error } = await supabase
    .from("class_group")
    .update({ name, branch_id: branchId, academic_year: academicYear })
    .eq("id", id)
    .eq("tenant_id", resolved.tenantId);

  if (error) {
    return NextResponse.json(
      {
        error:
          error.code === "23505"
            ? "Bu şubede bu isimde bir sınıf zaten var."
            : "Sınıf güncellenemedi.",
      },
      { status: 400 },
    );
  }

  await logAudit({
    tenantId: resolved.tenantId,
    actorAccountId: check.viewer.account.id,
    action: "class_group.update",
    targetTable: "class_group",
    targetId: id,
    metadata: { name, branchId, academicYear },
  });

  return NextResponse.json({ ok: true });
}
