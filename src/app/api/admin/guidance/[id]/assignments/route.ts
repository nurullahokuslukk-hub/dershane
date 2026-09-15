import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { resolveWriteTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = checkRoleApi(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  if (!check.ok) return check.response;

  const { id } = await params;
  const { fullName, studentIds, tenantId } = await request.json();
  if (!fullName) {
    return NextResponse.json({ error: "Ad soyad gerekli." }, { status: 400 });
  }

  const resolved = await resolveWriteTenantId(check.viewer, tenantId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: guidanceUser } = await supabase
    .from("user_account")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", resolved.tenantId)
    .eq("role", "rehberlik")
    .single();
  if (!guidanceUser) {
    return NextResponse.json(
      { error: "Rehberlik kullanıcısı bulunamadı." },
      { status: 404 },
    );
  }

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

  const { error: nameError } = await supabase
    .from("user_account")
    .update({ full_name: fullName })
    .eq("id", id);
  if (nameError) {
    return NextResponse.json(
      { error: "Rehberlik kullanıcısı güncellenemedi." },
      { status: 400 },
    );
  }

  await supabase
    .from("guidance_student_assignment")
    .delete()
    .eq("guidance_user_id", id);

  if (studentIds?.length) {
    const { error: assignError } = await supabase
      .from("guidance_student_assignment")
      .insert(
        studentIds.map((studentId: string) => ({
          tenant_id: resolved.tenantId,
          guidance_user_id: id,
          student_id: studentId,
        })),
      );
    if (assignError) {
      return NextResponse.json(
        { error: "Öğrenci ataması yapılamadı." },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
