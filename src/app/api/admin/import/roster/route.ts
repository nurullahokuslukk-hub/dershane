import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { resolveWriteTenantId } from "@/lib/tenant-context";
import { generateClaimCode } from "@/lib/roster/claim-code";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { StudentRowData, TeacherRowData } from "@/lib/import/roster-schema";

export async function POST(request: Request) {
  const check = checkRoleApi(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  if (!check.ok) return check.response;

  const { tenantId, kind, rows } = await request.json();

  if (kind !== "ogrenci" && kind !== "ogretmen") {
    return NextResponse.json({ error: "Geçersiz kind." }, { status: 400 });
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "İçe aktarılacak satır yok." },
      { status: 400 },
    );
  }

  const resolved = await resolveWriteTenantId(check.viewer, tenantId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const supabase = await createClient();

  // İstemci tarafında çözülen class_group id'lerini sunucuda yeniden
  // doğrula — bu tenant'a ait olmayan bir id gönderilmiş olabilir.
  const allClassIds = new Set<string>();
  if (kind === "ogrenci") {
    for (const r of rows as StudentRowData[]) allClassIds.add(r.classId);
  } else {
    for (const r of rows as TeacherRowData[]) {
      for (const id of r.classIds) allClassIds.add(id);
    }
  }
  const classIdList = [...allClassIds];
  const { count: validClassCount } = await supabase
    .from("class_group")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", resolved.tenantId)
    .in("id", classIdList);
  if (validClassCount !== classIdList.length) {
    return NextResponse.json(
      { error: "Bazı sınıflar bu dershaneye ait değil." },
      { status: 400 },
    );
  }

  const accountsToInsert = (
    kind === "ogrenci"
      ? (rows as StudentRowData[]).map((r) => r.fullName)
      : (rows as TeacherRowData[]).map((r) => r.fullName)
  ).map((fullName) => ({
    tenant_id: resolved.tenantId,
    role: kind === "ogrenci" ? "ogrenci" : "ogretmen",
    full_name: fullName,
    status: "unclaimed" as const,
  }));

  const { data: createdAccounts, error: accountsError } = await supabase
    .from("user_account")
    .insert(accountsToInsert)
    .select("id");

  if (accountsError || !createdAccounts || createdAccounts.length !== rows.length) {
    return NextResponse.json(
      { error: "Hesaplar oluşturulamadı." },
      { status: 400 },
    );
  }

  const createdIds = createdAccounts.map((a) => a.id);

  async function rollback() {
    await supabase.from("user_account").delete().in("id", createdIds);
  }

  if (kind === "ogrenci") {
    const studentProfiles = (rows as StudentRowData[]).map((r, i) => ({
      tenant_id: resolved.tenantId,
      user_id: createdIds[i],
      class_group_id: r.classId,
      branch_id: r.branchId,
      birth_date: r.birthDate,
    }));
    const { error } = await supabase.from("student_profile").insert(studentProfiles);
    if (error) {
      await rollback();
      return NextResponse.json(
        { error: "Öğrenci profilleri oluşturulamadı." },
        { status: 400 },
      );
    }
  } else {
    const assignments = (rows as TeacherRowData[]).flatMap((r, i) =>
      r.classIds.map((classId) => ({
        tenant_id: resolved.tenantId,
        teacher_user_id: createdIds[i],
        class_group_id: classId,
      })),
    );
    const { error } = await supabase
      .from("teacher_class_assignment")
      .insert(assignments);
    if (error) {
      await rollback();
      return NextResponse.json(
        { error: "Sınıf atamaları oluşturulamadı." },
        { status: 400 },
      );
    }
  }

  const claimCodes = createdIds.map((id) => ({
    tenant_id: resolved.tenantId,
    user_account_id: id,
    code: generateClaimCode(),
  }));
  const { error: claimError } = await supabase
    .from("account_claim_code")
    .insert(claimCodes);
  if (claimError) {
    await rollback();
    return NextResponse.json(
      { error: "Doğrulama kodları oluşturulamadı." },
      { status: 400 },
    );
  }

  await logAudit({
    tenantId: resolved.tenantId,
    actorAccountId: check.viewer.account.id,
    action: "roster.import",
    targetTable: "user_account",
    metadata: { kind, createdCount: createdIds.length },
  });

  return NextResponse.json({ ok: true, createdCount: createdIds.length });
}
