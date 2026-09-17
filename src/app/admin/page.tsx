import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";
import { JumpToTenantButton } from "@/components/admin/JumpToTenantButton";
import { AUDIT_ACTION_LABEL } from "@/lib/audit-labels";

// Ekran: web-dershane-admin.md → "Ekran: Dashboard"
export default async function AdminDashboardPage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  const supabase = await createClient();

  // system_admin henüz bir dershane seçmediyse: dershane listesi + hızlı geçiş.
  if (!tenantId) {
    const { data: tenants } = await supabase
      .from("tenant")
      .select("id, name, slug, status")
      .order("name");

    return (
      <>
        <PageHeader
          title="Dershaneler"
          description="Çalışmak istediğin dershaneyi seç; panonun geri kalanı o dershanenin verisini gösterir."
          action={
            <Link href="/admin/tenants/new" className={btnPrimary}>
              Yeni Dershane
            </Link>
          }
        />
        {!tenants || tenants.length === 0 ? (
          <EmptyState
            title="Henüz dershane yok"
            description="İlk dershaneyi oluşturunca şube, sınıf ve roster girişi yapabilirsin."
            action={
              <Link href="/admin/tenants/new" className={btnPrimary}>
                Yeni Dershane
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tenants.map((t) => (
              <Card key={t.id}>
                <CardBody className="space-y-3">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted">{t.slug}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={t.status === "active" ? "success" : "warning"}>
                      {t.status === "active" ? "Aktif" : "Askıda"}
                    </Badge>
                    <JumpToTenantButton tenantId={t.id} />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  }

  const [
    tenant,
    branches,
    classes,
    students,
    teachers,
    guidance,
    unclaimed,
    unclaimedStudents,
    exams,
    recentExams,
    recentAudit,
  ] = await Promise.all([
    supabase.from("tenant").select("name").eq("id", tenantId).single(),
    supabase
      .from("branch")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("class_group")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("student_profile")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("user_account")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "ogretmen"),
    supabase
      .from("user_account")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "rehberlik"),
    supabase
      .from("user_account")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "unclaimed"),
    // Oran hesabı için ayrı sorgu: yukarıdaki sayaç tüm rolleri kapsıyor
    // (öğretmen/rehberlik dahil), öğrenci oranına bölünemez.
    supabase
      .from("user_account")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "ogrenci")
      .eq("status", "unclaimed"),
    supabase
      .from("mock_exam")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("mock_exam")
      .select("id, name, exam_date, mock_exam_subject_result(count)")
      .eq("tenant_id", tenantId)
      .order("exam_date", { ascending: false })
      .limit(5)
      .returns<
        {
          id: string;
          name: string;
          exam_date: string;
          mock_exam_subject_result: { count: number }[];
        }[]
      >(),
    supabase
      .from("audit_log")
      .select("id, action, target_table, created_at, metadata")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const studentCount = students.count ?? 0;
  const stats = [
    { label: "Öğrenci", value: studentCount, href: "/admin/students" },
    { label: "Sınıf", value: classes.count ?? 0, href: "/admin/classes" },
    { label: "Şube", value: branches.count ?? 0, href: "/admin/branches" },
    { label: "Öğretmen", value: teachers.count ?? 0, href: "/admin/teachers" },
    { label: "Rehberlik", value: guidance.count ?? 0, href: "/admin/guidance" },
    { label: "Deneme", value: exams.count ?? 0, href: "/admin/exams" },
  ];

  const unclaimedCount = unclaimed.count ?? 0;
  const unclaimedStudentCount = unclaimedStudents.count ?? 0;
  const claimedRatio =
    studentCount > 0
      ? Math.round(
          ((studentCount - unclaimedStudentCount) / studentCount) * 100,
        )
      : null;

  return (
    <>
      <PageHeader
        title={tenant.data?.name ?? "Dashboard"}
        description="Bu dershanenin güncel durumu ve sık kullanılan işlemler."
        action={
          <div className="flex gap-2">
            <Link href="/admin/import/roster" className={btnSecondary}>
              Roster Yükle
            </Link>
            <Link href="/admin/import/exam-results" className={btnPrimary}>
              Deneme Sonucu Yükle
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-hover"
          >
            <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
            <div className="mt-0.5 text-xs text-muted">{s.label}</div>
          </Link>
        ))}
      </div>

      {unclaimedCount > 0 && (
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                {unclaimedCount} hesap henüz doğrulanmadı
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Bu kişiler kendi e-posta/telefon ve şifresini belirlemedi.
                Doğrulama kodlarını dershaneye ilet.
                {claimedRatio !== null && (
                  <> Öğrencilerin %{claimedRatio}&apos;i hesabını aktifleştirdi.</>
                )}
              </p>
            </div>
            <Link href="/admin/unclaimed" className={btnSecondary}>
              Kodları gör
            </Link>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Son denemeler"
            description="Sonucu yüklenmiş en yeni deneme sınavları"
            action={
              <Link
                href="/admin/exams"
                className="text-xs text-brand hover:underline"
              >
                Tümü
              </Link>
            }
          />
          <CardBody>
            {!recentExams.data || recentExams.data.length === 0 ? (
              <p className="text-sm text-muted">
                Henüz deneme yok.{" "}
                <Link
                  href="/admin/exams/new"
                  className="text-brand hover:underline"
                >
                  Deneme oluştur
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-2">
                {recentExams.data.map((e) => {
                  const rowCount = e.mock_exam_subject_result[0]?.count ?? 0;
                  return (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <Link
                        href={`/admin/exams/${e.id}`}
                        className="min-w-0 truncate hover:underline"
                      >
                        {e.name}
                      </Link>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                        {formatDate(e.exam_date)}
                        {rowCount === 0 ? (
                          <Badge tone="warning">sonuç yok</Badge>
                        ) : (
                          <Badge tone="brand">{rowCount} satır</Badge>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Son işlemler"
            description="Bu dershanede kim ne değiştirdi"
            action={
              <Link
                href="/admin/audit-log"
                className="text-xs text-brand hover:underline"
              >
                Tümü
              </Link>
            }
          />
          <CardBody>
            {!recentAudit.data || recentAudit.data.length === 0 ? (
              <p className="text-sm text-muted">Henüz kayıt yok.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentAudit.data.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="min-w-0 truncate">
                      {AUDIT_ACTION_LABEL[a.action] ?? a.action}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {formatDateTime(a.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
