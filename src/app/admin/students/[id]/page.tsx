import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AccountStatusBadge } from "@/components/admin/AccountStatusBadge";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";
import { groupResultsByExam, formatNet } from "@/lib/exams/summary";
import { table, tableWrap, td, th } from "@/components/ui/styles";

type Account = {
  id: string;
  full_name: string;
  status: string;
  auth_identifier: string | null;
  created_at: string;
  account_claim_code: {
    code: string;
    expires_at: string;
    status: string;
  } | null;
  student_profile: {
    id: string;
    birth_date: string | null;
    class_group: { id: string; name: string } | null;
    branch: { id: string; name: string } | null;
  } | null;
};

export default async function StudentDetailPage({
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
  const { data: account } = await supabase
    .from("user_account")
    .select(
      "id, full_name, status, auth_identifier, created_at, account_claim_code(code, expires_at, status), student_profile(id, birth_date, class_group:class_group_id(id, name), branch:branch_id(id, name))",
    )
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .eq("role", "ogrenci")
    .single()
    .returns<Account>();

  if (!account || !account.student_profile) notFound();

  const studentId = account.student_profile.id;

  const [{ data: results }, { data: guidance }] = await Promise.all([
    supabase
      .from("mock_exam_subject_result")
      .select(
        "id, subject, correct_count, wrong_count, blank_count, net, mock_exam:mock_exam_id(id, name, exam_date)",
      )
      .eq("tenant_id", tenantId)
      .eq("student_id", studentId)
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
      .from("guidance_student_assignment")
      .select("id, guidance:guidance_user_id(id, full_name)")
      .eq("tenant_id", tenantId)
      .eq("student_id", studentId)
      .returns<
        { id: string; guidance: { id: string; full_name: string } | null }[]
      >(),
  ]);

  const exams = groupResultsByExam(results ?? []);

  return (
    <>
      <PageHeader
        title={account.full_name}
        description={
          <>
            {account.student_profile.class_group?.name ?? "Sınıf yok"}
            {account.student_profile.branch?.name
              ? ` · ${account.student_profile.branch.name}`
              : ""}
          </>
        }
        action={
          <Link href="/admin/students" className="text-sm text-muted hover:underline">
            ← Öğrenci listesi
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Hesap" />
          <CardBody className="space-y-2 text-sm">
            <Row label="Durum">
              <AccountStatusBadge status={account.status} />
            </Row>
            <Row label="Giriş bilgisi">
              {account.auth_identifier ?? "— (henüz belirlenmedi)"}
            </Row>
            {account.status === "unclaimed" && account.account_claim_code && (
              <Row label="Doğrulama kodu">
                <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
                  {account.account_claim_code.code}
                </code>
              </Row>
            )}
            <Row label="Doğum tarihi">
              {account.student_profile.birth_date ?? "—"}
            </Row>
            <Row label="Kayıt">
              {new Date(account.created_at).toLocaleDateString("tr-TR")}
            </Row>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Rehberlik ataması"
            description="Bu öğrenciyi hangi rehberlik öğretmeni takip ediyor"
          />
          <CardBody>
            {!guidance || guidance.length === 0 ? (
              <p className="text-sm text-muted">
                Henüz rehberlik ataması yok.{" "}
                <Link href="/admin/guidance" className="text-brand hover:underline">
                  Rehberlik ekranından
                </Link>{" "}
                atayabilirsin.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {guidance.map((g) => (
                  <li key={g.id}>
                    <Badge tone="brand">{g.guidance?.full_name ?? "?"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Deneme sonuçları"
          description="En yeni deneme en üstte. Netler yüklenen dosyadaki değerlerdir, yeniden hesaplanmaz."
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
                    <Link
                      href={`/admin/exams/${exam.examId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {exam.examName}
                    </Link>
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
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
