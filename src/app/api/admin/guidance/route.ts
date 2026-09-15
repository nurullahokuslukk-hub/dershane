import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { resolveWriteTenantId } from "@/lib/tenant-context";
import { generateClaimCode } from "@/lib/roster/claim-code";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const check = checkRoleApi(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  if (!check.ok) return check.response;

  const { fullName, studentIds, tenantId } = await request.json();
  if (!fullName) {
    return NextResponse.json({ error: "Ad soyad gerekli." }, { status: 400 });
  }

  const resolved = await resolveWriteTenantId(check.viewer, tenantId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const supabase = await createClient();

  if (studentIds?.length) {
    const { count } = await supabase
      .from("student_profile")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", resolved.tenantId)
      .in("id", studentIds);
    if (count !== studentIds.length) {
      return NextResponse.json(
        { error: "Geçersiz öğrenci seçimi." },
        { status: 400 },
      );
    }
  }

  const { data: account, error: accountError } = await supabase
    .from("user_account")
    .insert({
      tenant_id: resolved.tenantId,
      role: "rehberlik",
      full_name: fullName,
      status: "unclaimed",
    })
    .select("id")
    .single();

  if (accountError || !account) {
    return NextResponse.json(
      { error: "Rehberlik kullanıcısı oluşturulamadı." },
      { status: 400 },
    );
  }

  if (studentIds?.length) {
    const { error: assignError } = await supabase
      .from("guidance_student_assignment")
      .insert(
        studentIds.map((studentId: string) => ({
          tenant_id: resolved.tenantId,
          guidance_user_id: account.id,
          student_id: studentId,
        })),
      );
    if (assignError) {
      await supabase.from("user_account").delete().eq("id", account.id);
      return NextResponse.json(
        { error: "Öğrenci ataması yapılamadı." },
        { status: 400 },
      );
    }
  }

  const { error: claimError } = await supabase
    .from("account_claim_code")
    .insert({
      tenant_id: resolved.tenantId,
      user_account_id: account.id,
      code: generateClaimCode(),
    });

  if (claimError) {
    await supabase.from("user_account").delete().eq("id", account.id);
    return NextResponse.json(
      { error: "Doğrulama kodu oluşturulamadı." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, id: account.id });
}
