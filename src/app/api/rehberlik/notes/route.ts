import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { getAssignedStudent } from "@/lib/guidance/access";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const check = checkRoleApi(await getViewer(), ["rehberlik"]);
  if (!check.ok) return check.response;

  const { studentId, kind, text, nextStep } = await request.json();

  if (kind !== "note" && kind !== "session") {
    return NextResponse.json({ error: "Geçersiz kayıt türü." }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Metin boş olamaz." }, { status: 400 });
  }

  // Atama kontrolü sunucuda tekrar yapılıyor — rehberlik yalnızca kendisine
  // atanmış öğrenciye not yazabilir (bkz. AGENTS.md: ince yetki backend'de).
  const student = await getAssignedStudent(check.viewer, studentId);
  if (!student) {
    return NextResponse.json(
      { error: "Bu öğrenciye erişiminiz yok." },
      { status: 403 },
    );
  }

  const tenantId = check.viewer.account.tenant_id;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Hesabınıza bağlı bir dershane yok." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } =
    kind === "note"
      ? await supabase.from("guidance_note").insert({
          tenant_id: tenantId,
          student_id: student.id,
          guidance_user_id: check.viewer.account.id,
          note: text.trim(),
        })
      : await supabase.from("guidance_session").insert({
          tenant_id: tenantId,
          student_id: student.id,
          guidance_user_id: check.viewer.account.id,
          summary: text.trim(),
          next_step:
            typeof nextStep === "string" && nextStep.trim()
              ? nextStep.trim()
              : null,
        });

  if (error) {
    return NextResponse.json({ error: "Kaydedilemedi." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
