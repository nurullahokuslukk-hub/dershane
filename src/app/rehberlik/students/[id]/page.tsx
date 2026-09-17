import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getAssignedStudent } from "@/lib/guidance/access";
import { createClient } from "@/lib/supabase/server";
import { groupResultsByExam, formatNet } from "@/lib/exams/summary";
import type { PresenceRow } from "@/lib/guidance/presence";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PresenceSection } from "@/components/guidance/PresenceSection";
import { GuidanceNoteForm } from "@/components/guidance/GuidanceNoteForm";
import { table, tableWrap, td, th } from "@/components/ui/styles";

const PRESENCE_WINDOW_DAYS = 30;

// Ekran: web-rehberlik.md → "Ekran: Öğrenci Profili"
export default async function GuidanceStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = requireRole(await getViewer(), ["rehberlik"]);

  // Yetki: URL'deki id'ye güvenilmez, atama gerçekten var mı diye bakılır.
  const student = await getAssignedStudent(viewer, id);
  if (!student) notFound();

  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - (PRESENCE_WINDOW_DAYS - 1));
  const sinceIso = since.toISOString().slice(0, 10);

  const [presenceRes, resultsRes, notesRes, sessionsRes] = await Promise.all([
    supabase
      .from("daily_dershane_presence")
      .select("attendance_date, attended, arrived_at, departed_at, report_source")
      .eq("student_id", student.id)
      .gte("attendance_date", sinceIso)
      .order("attendance_date", { ascending: false })
      .returns<PresenceRow[]>(),
    supabase
      .from("mock_exam_subject_result")
      .select(
        "id, subject, correct_count, wrong_count, blank_count, net, mock_exam:mock_exam_id(id, name, exam_date)",
      )
      .eq("student_id", student.id)
      .returns<
        {
          id: string;
          subject: string;
          correct_count: number;
          wrong_count: number;
          blank_count: number;
          net: number;
          mock_exam: { id: string; name: string; exam_date: string } | null;
        }[]
      >(),
    supabase
      .from("guidance_note")
      .select("id, note, created_at")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("guidance_session")
      .select("id, summary, next_step, occurred_at")
      .eq("student_id", student.id)
      .order("occurred_at", { ascending: false })
      .limit(20),
  ]);

  // Sorgu hatasını YUTMUYORUZ. İlk sürümde yalnızca "tablo yok" kodlarına
  // bakılıyordu; şema ile sütun adı uyuşmazlığı (PGRST204) sessizce boş
  // liste gibi görünüp "bu öğrenci hiç bildirim girmemiş" yazdırıyordu —
  // rehberliğe yanlış bilgi vermek, bölümü hiç göstermemekten kötü.
  if (presenceRes.error) {
    console.error(
      "daily_dershane_presence okunamadı:",
      presenceRes.error.code,
      presenceRes.error.message,
    );
  }

  const exams = groupResultsByExam(resultsRes.data ?? []);

  return (
    <>
      <PageHeader
        title={student.fullName}
        description={
          student.branchName
            ? `${student.className} · ${student.branchName}`
            : student.className
        }
        action={
          <Link
            href="/rehberlik"
            className="text-sm text-muted hover:underline"
          >
            ← Öğrencilerim
          </Link>
        }
      />

      {presenceRes.error ? (
        <Card>
          <CardHeader title="Dershane düzeni" />
          <CardBody>
            <p className="text-sm text-muted">
              Bu bölüm şu an yüklenemedi, bu yüzden hiçbir şey göstermiyoruz —
              &quot;veri yok&quot; demek yanıltıcı olurdu. Sorun sürerse sistem
              yöneticisine iletin.
            </p>
            <p className="mt-1 font-mono text-xs text-muted">
              {presenceRes.error.code}: {presenceRes.error.message}
            </p>
          </CardBody>
        </Card>
      ) : (
        <PresenceSection
          rows={presenceRes.data ?? []}
          windowDays={PRESENCE_WINDOW_DAYS}
        />
      )}

      <Card>
        <CardHeader
          title="Deneme sonuçları"
          description="En yeni deneme en üstte. Netler yüklenen dosyadaki değerlerdir; sıralama veya başarı puanı üretilmez."
        />
        <CardBody>
          {exams.length === 0 ? (
            <p className="text-sm text-muted">
              Bu öğrenci için henüz deneme sonucu yüklenmemiş.
            </p>
          ) : (
            <div className="space-y-5">
              {exams.map((exam) => (
                <div key={exam.examId} className="space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{exam.examName}</span>
                    <span className="text-xs text-muted">
                      {new Date(exam.examDate).toLocaleDateString("tr-TR")} ·
                      toplam net{" "}
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatNet(exam.totalNet)}
                      </span>
                    </span>
                  </div>
                  <div className={tableWrap}>
                    <table className={table}>
                      <thead>
                        <tr>
                          <th className={th}>Ders</th>
                          <th className={th}>Doğru</th>
                          <th className={th}>Yanlış</th>
                          <th className={th}>Boş</th>
                          <th className={th}>Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exam.subjects.map((s) => (
                          <tr key={s.id}>
                            <td className={td}>{s.subject}</td>
                            <td className={`${td} tabular-nums`}>
                              {s.correct_count}
                            </td>
                            <td className={`${td} tabular-nums`}>
                              {s.wrong_count}
                            </td>
                            <td className={`${td} tabular-nums`}>
                              {s.blank_count}
                            </td>
                            <td className={`${td} font-medium tabular-nums`}>
                              {formatNet(s.net)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Görüşmeler ve notlar"
          description="Öğrenciyle konuştuklarınızı buraya kaydedin; bir sonraki görüşmede bağlam kaybolmasın."
        />
        <CardBody className="space-y-4">
          <GuidanceNoteForm studentId={student.id} />

          {(sessionsRes.data?.length ?? 0) === 0 &&
          (notesRes.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted">Henüz kayıt yok.</p>
          ) : (
            <ul className="space-y-3">
              {sessionsRes.data?.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs font-medium text-brand-soft-fg">
                      Görüşme
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(s.occurred_at).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{s.summary}</p>
                  {s.next_step && (
                    <p className="mt-1 text-xs text-muted">
                      Sonraki adım: {s.next_step}
                    </p>
                  )}
                </li>
              ))}
              {notesRes.data?.map((n) => (
                <li
                  key={n.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs font-medium text-muted">Not</span>
                    <span className="text-xs text-muted">
                      {new Date(n.created_at).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{n.note}</p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
