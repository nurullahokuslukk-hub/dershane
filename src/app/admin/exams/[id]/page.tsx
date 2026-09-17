import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";
import { formatNet, toNumber } from "@/lib/exams/summary";
import {
  btnPrimary,
  table,
  tableWrap,
  td,
  th,
  trHover,
} from "@/components/ui/styles";

type ResultRow = {
  subject: string;
  net: number;
  student: {
    id: string;
    user_id: string;
    class_group: { name: string } | null;
    account: { full_name: string } | null;
  } | null;
};

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  if (!tenantId) return <NoTenantNotice />;

  const supabase = await createClient();
  const { data: exam } = await supabase
    .from("mock_exam")
    .select("id, name, exam_date, exam_type")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (!exam) notFound();

  const { data: results } = await supabase
    .from("mock_exam_subject_result")
    .select(
      "subject, net, student:student_id(id, user_id, class_group:class_group_id(name), account:user_id(full_name))",
    )
    .eq("tenant_id", tenantId)
    .eq("mock_exam_id", exam.id)
    .limit(10000)
    .returns<ResultRow[]>();

  const rows = results ?? [];

  // Ders sütunlarını ve öğrenci satırlarını tek geçişte çıkarıyoruz.
  const subjects = [...new Set(rows.map((r) => r.subject))].sort((a, b) =>
    a.localeCompare(b, "tr"),
  );

  const byStudent = new Map<
    string,
    {
      accountId: string;
      name: string;
      className: string;
      nets: Map<string, number>;
      total: number;
    }
  >();
  const subjectTotals = new Map<string, { sum: number; count: number }>();

  for (const r of rows) {
    if (!r.student) continue;
    const net = toNumber(r.net);
    let entry = byStudent.get(r.student.id);
    if (!entry) {
      entry = {
        accountId: r.student.user_id,
        name: r.student.account?.full_name ?? "(isimsiz)",
        className: r.student.class_group?.name ?? "—",
        nets: new Map(),
        total: 0,
      };
      byStudent.set(r.student.id, entry);
    }
    entry.nets.set(r.subject, net);
    entry.total += net;

    const st = subjectTotals.get(r.subject) ?? { sum: 0, count: 0 };
    st.sum += net;
    st.count += 1;
    subjectTotals.set(r.subject, st);
  }

  const students = [...byStudent.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "tr"),
  );

  return (
    <>
      <PageHeader
        title={exam.name}
        description={
          <>
            {new Date(exam.exam_date).toLocaleDateString("tr-TR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            {exam.exam_type ? ` · ${exam.exam_type}` : ""} · {students.length}{" "}
            öğrenci
          </>
        }
        action={
          <Link
            href={`/admin/import/exam-results?exam=${exam.id}`}
            className={btnPrimary}
          >
            Sonuç Yükle
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Bu denemeye henüz sonuç yüklenmedi"
          description="Optik okuyucudan gelen sonuçları şablona aktarıp CSV olarak yükle."
          action={
            <Link
              href={`/admin/import/exam-results?exam=${exam.id}`}
              className={btnPrimary}
            >
              Sonuç Yükle
            </Link>
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader
              title="Ders ortalamaları"
              description="Bu denemede dershane genelindeki ortalama netler"
            />
            <CardBody>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {subjects.map((s) => {
                  const st = subjectTotals.get(s)!;
                  return (
                    <div
                      key={s}
                      className="rounded-lg border border-border px-3 py-2"
                    >
                      <div className="text-lg font-semibold tabular-nums">
                        {formatNet(st.sum / st.count)}
                      </div>
                      <div className="text-xs text-muted">{s}</div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Öğrenci sonuçları</h2>
            <div className={tableWrap}>
              <table className={table}>
                <thead>
                  <tr>
                    <th className={th}>Öğrenci</th>
                    <th className={th}>Sınıf</th>
                    {subjects.map((s) => (
                      <th key={s} className={th}>
                        {s}
                      </th>
                    ))}
                    <th className={th}>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.accountId} className={trHover}>
                      <td className={`${td} font-medium whitespace-nowrap`}>
                        <Link
                          href={`/admin/students/${s.accountId}`}
                          className="hover:underline"
                        >
                          {s.name}
                        </Link>
                      </td>
                      <td className={`${td} text-muted`}>{s.className}</td>
                      {subjects.map((subject) => (
                        <td key={subject} className={`${td} tabular-nums`}>
                          {s.nets.has(subject)
                            ? formatNet(s.nets.get(subject)!)
                            : "—"}
                        </td>
                      ))}
                      <td className={`${td} font-semibold tabular-nums`}>
                        {formatNet(s.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
