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

  const { name, examDate, examType, tenantId } = await request.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Deneme adı gerekli." }, { status: 400 });
  }
  if (!examDate || !/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
    return NextResponse.json(
      { error: "Geçerli bir sınav tarihi gerekli." },
      { status: 400 },
    );
  }

  const resolved = await resolveWriteTenantId(check.viewer, tenantId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: exam, error } = await supabase
    .from("mock_exam")
    .insert({
      tenant_id: resolved.tenantId,
      name: name.trim(),
      exam_date: examDate,
      exam_type: examType?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !exam) {
    return NextResponse.json(
      {
        error:
          error?.code === "23505"
            ? "Aynı tarihte aynı isimde bir deneme zaten var."
            : "Deneme oluşturulamadı.",
      },
      { status: 400 },
    );
  }

  await logAudit({
    tenantId: resolved.tenantId,
    actorAccountId: check.viewer.account.id,
    action: "mock_exam.create",
    targetTable: "mock_exam",
    targetId: exam.id,
    metadata: { name: name.trim(), examDate },
  });

  return NextResponse.json({ ok: true, id: exam.id });
}
