import { NextResponse } from "next/server";
import { getViewer, checkRoleApi } from "@/lib/auth/viewer";
import { resolveWriteTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { ExamResultRowData } from "@/lib/import/exam-schema";

// Tek istekte kabul edilen üst sınır. Bir dershanenin tek denemesi tipik
// olarak (öğrenci sayısı × ders sayısı) satır üretir — 500 öğrenci × 8 ders
// = 4000. Daha büyük dosyalarda kullanıcıya dosyayı bölmesini söylüyoruz,
// çünkü tek bir dev istek hem zaman aşımına düşüyor hem kısmi başarısızlıkta
// neyin yazıldığını belirsizleştiriyor.
const MAX_ROWS = 5000;
const CHUNK_SIZE = 500;

export async function POST(request: Request) {
  const check = checkRoleApi(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  if (!check.ok) return check.response;

  const { tenantId, mockExamId, rows } = await request.json();

  if (!mockExamId || typeof mockExamId !== "string") {
    return NextResponse.json({ error: "Deneme seçilmedi." }, { status: 400 });
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "İçe aktarılacak satır yok." },
      { status: 400 },
    );
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      {
        error: `Tek seferde en fazla ${MAX_ROWS} satır yüklenebilir. Dosyayı bölüp tekrar dene.`,
      },
      { status: 400 },
    );
  }

  const resolved = await resolveWriteTenantId(check.viewer, tenantId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const supabase = await createClient();

  // Deneme gerçekten bu dershaneye mi ait? (İstemciden gelen id'ye güvenmiyoruz.)
  const { data: exam } = await supabase
    .from("mock_exam")
    .select("id, name")
    .eq("id", mockExamId)
    .eq("tenant_id", resolved.tenantId)
    .single();
  if (!exam) {
    return NextResponse.json(
      { error: "Deneme bu dershaneye ait değil." },
      { status: 400 },
    );
  }

  // Öğrenci id'leri de aynı şekilde sunucuda yeniden doğrulanıyor —
  // eşleştirme istemcide yapıldığı için buraya başka bir dershanenin
  // öğrenci id'si gönderilmiş olabilir.
  const typedRows = rows as ExamResultRowData[];
  const studentIds = [...new Set(typedRows.map((r) => r.studentId))];
  const { count: validStudentCount } = await supabase
    .from("student_profile")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", resolved.tenantId)
    .in("id", studentIds);
  if (validStudentCount !== studentIds.length) {
    return NextResponse.json(
      { error: "Bazı öğrenciler bu dershaneye ait değil." },
      { status: 400 },
    );
  }

  const payload = typedRows.map((r) => ({
    tenant_id: resolved.tenantId,
    mock_exam_id: exam.id,
    student_id: r.studentId,
    subject: r.subject,
    correct_count: r.correct,
    wrong_count: r.wrong,
    blank_count: r.blank,
    net: r.net,
  }));

  // (mock_exam_id, student_id, subject) tekil olduğu için aynı dosyanın
  // düzeltilip tekrar yüklenmesi çift kayıt değil güncelleme yapıyor.
  for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
    const chunk = payload.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from("mock_exam_subject_result")
      .upsert(chunk, { onConflict: "mock_exam_id,student_id,subject" });
    if (error) {
      return NextResponse.json(
        {
          error: `Sonuçlar yazılamadı (${i + 1}. satırdan itibaren): ${error.message}`,
          writtenCount: i,
        },
        { status: 400 },
      );
    }
  }

  await logAudit({
    tenantId: resolved.tenantId,
    actorAccountId: check.viewer.account.id,
    action: "exam_results.import",
    targetTable: "mock_exam_subject_result",
    targetId: exam.id,
    metadata: { name: exam.name, rowCount: payload.length },
  });

  return NextResponse.json({ ok: true, rowCount: payload.length });
}
