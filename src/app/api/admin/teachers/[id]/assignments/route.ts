import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { resolveWriteTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";

// Öğretmenin ad soyad + sınıf atamalarını tamamen yeni sete göre günceller
// (ekle/çıkar yerine tek seferde "olması gereken hal" gönderilir).
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
  const { fullName, classIds, tenantId } = await request.json();
  if (!fullName) {
    return NextResponse.json({ error: "Ad soyad gerekli." }, { status: 400 });
  }

  const resolved = await resolveWriteTenantId(check.viewer, tenantId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("user_account")
    .select("id")
    .eq("id", id)
    .eq("tenant_id", resolved.tenantId)
    .eq("role", "ogretmen")
    .single();
  if (!teacher) {
    return NextResponse.json({ error: "Öğretmen bulunamadı." }, { status: 404 });
  }

  if (classIds?.length) {
    const { count } = await supabase
      .from("class_group")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", resolved.tenantId)
      .in("id", classIds);
    if (count !== classIds.length) {
      return NextResponse.json(
        { error: "Geçersiz sınıf seçimi." },
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
      { error: "Öğretmen güncellenemedi." },
      { status: 400 },
    );
  }

  await supabase.from("teacher_class_assignment").delete().eq("teacher_user_id", id);

  if (classIds?.length) {
    const { error: assignError } = await supabase
      .from("teacher_class_assignment")
      .insert(
        classIds.map((classId: string) => ({
          tenant_id: resolved.tenantId,
          teacher_user_id: id,
          class_group_id: classId,
        })),
      );
    if (assignError) {
      return NextResponse.json(
        { error: "Sınıf ataması yapılamadı." },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
