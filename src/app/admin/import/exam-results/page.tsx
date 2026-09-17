import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";
import { ExamResultsImportClient } from "@/components/admin/ExamResultsImportClient";
import { btnPrimary } from "@/components/ui/styles";
import type { StudentInfo } from "@/lib/import/exam-schema";

// Ekran: Faz C — deneme sonuçlarının toplu içe aktarılması.
// Sonuç girişi öğretmen başına tek tek değil, dershane/sistem admini
// tarafından deneme başına dosya yükleyerek yapılıyor (bkz. plan Faz C).
export default async function ExamResultsImportPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  if (!tenantId) return <NoTenantNotice />;

  const { exam: initialExamId } = await searchParams;
  const supabase = await createClient();

  const [{ data: exams }, { data: studentRows }] = await Promise.all([
    supabase
      .from("mock_exam")
      .select("id, name, exam_date")
      .eq("tenant_id", tenantId)
      .order("exam_date", { ascending: false })
      .limit(100),
    // İsim eşleştirmesi istemcide yapılıyor (önizleme anlık olsun diye),
    // ama gönderilen id'ler sunucuda yeniden doğrulanıyor — bkz.
    // src/app/api/admin/import/exam-results/route.ts
    supabase
      .from("student_profile")
      .select(
        "id, account:user_id(full_name), class_group:class_group_id(name), branch:branch_id(name)",
      )
      .eq("tenant_id", tenantId)
      .limit(10000)
      .returns<
        {
          id: string;
          account: { full_name: string } | null;
          class_group: { name: string } | null;
          branch: { name: string } | null;
        }[]
      >(),
  ]);

  const students: StudentInfo[] = (studentRows ?? []).map((s) => ({
    id: s.id,
    fullName: s.account?.full_name ?? "",
    className: s.class_group?.name ?? "",
    branchName: s.branch?.name ?? "",
  }));

  return (
    <>
      <PageHeader
        title="Deneme Sonucu İçe Aktar"
        description="Bir denemenin ders bazlı sonuçlarını CSV olarak yükle. Eşleştirme öğrenci adı (ve varsa sınıf adı) üzerinden yapılır."
      />

      {students.length === 0 ? (
        <EmptyState
          title="Önce öğrenci gerekiyor"
          description="Sonuçlar isimle eşleştirildiği için sistemde kayıtlı öğrenci olmadan yükleme yapılamaz."
          action={
            <Link href="/admin/import/roster" className={btnPrimary}>
              Roster İçe Aktar
            </Link>
          }
        />
      ) : !exams || exams.length === 0 ? (
        <EmptyState
          title="Önce deneme oluştur"
          description="Sonuçlar bir denemeye bağlanır; ad ve tarih girerek denemeyi oluşturunca dosyayı yükleyebilirsin."
          action={
            <Link href="/admin/exams/new" className={btnPrimary}>
              Yeni Deneme
            </Link>
          }
        />
      ) : (
        <ExamResultsImportClient
          tenantId={tenantId}
          exams={exams}
          students={students}
          initialExamId={initialExamId}
        />
      )}
    </>
  );
}
