import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { listAssignedStudents } from "@/lib/guidance/access";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { table, tableWrap, td, th, trHover } from "@/components/ui/styles";

// Ekran: web-rehberlik.md → "Ekran: Öğrenci Listesi"
// Bilinçli olarak risk rengi/skoru YOK (PDF §16, AGENTS.md felsefe kuralı).
export default async function RehberlikStudentsPage() {
  const viewer = requireRole(await getViewer(), ["rehberlik"]);
  const students = await listAssignedStudents(viewer);

  // Son görüşme tarihleri tek sorguda çekilip bellekte eşleştiriliyor
  // (öğrenci başına ayrı sorgu N+1 olurdu).
  const lastSessionByStudent = new Map<string, string>();
  if (students.length > 0) {
    const supabase = await createClient();
    const { data: sessions } = await supabase
      .from("guidance_session")
      .select("student_id, occurred_at")
      .eq("guidance_user_id", viewer.account.id)
      .in(
        "student_id",
        students.map((s) => s.id),
      )
      .order("occurred_at", { ascending: false })
      .returns<{ student_id: string; occurred_at: string }[]>();

    for (const s of sessions ?? []) {
      if (!lastSessionByStudent.has(s.student_id)) {
        lastSessionByStudent.set(s.student_id, s.occurred_at);
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Öğrencilerim"
        description="Size atanmış öğrenciler. Bir öğrenciye tıklayarak geçmişten bugüne verilerini görebilirsiniz."
      />

      {students.length === 0 ? (
        <EmptyState
          title="Henüz öğrenci atanmamış"
          description="Dershane yöneticiniz size öğrenci atadığında bu listede görünecekler."
        />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Ad Soyad</th>
                <th className={th}>Sınıf</th>
                <th className={th}>Şube</th>
                <th className={th}>Son görüşme</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const last = lastSessionByStudent.get(s.id);
                return (
                  <tr key={s.id} className={trHover}>
                    <td className={`${td} font-medium`}>
                      <Link
                        href={`/rehberlik/students/${s.id}`}
                        className="hover:underline"
                      >
                        {s.fullName}
                      </Link>
                    </td>
                    <td className={td}>{s.className}</td>
                    <td className={`${td} text-muted`}>
                      {s.branchName || "—"}
                    </td>
                    <td className={td}>
                      {last ? (
                        <span className="text-muted">
                          {new Date(last).toLocaleDateString("tr-TR")}
                        </span>
                      ) : (
                        <Badge>henüz görüşme yok</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
