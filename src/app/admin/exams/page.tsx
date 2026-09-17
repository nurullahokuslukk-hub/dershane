import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";
import {
  btnPrimary,
  btnSecondary,
  table,
  tableWrap,
  td,
  th,
  trHover,
} from "@/components/ui/styles";

// Ekran: Faz C — deneme sınavı listesi. Sonuçlar bu denemelere bağlanıyor.
export default async function ExamsPage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  if (!tenantId) return <NoTenantNotice />;

  const supabase = await createClient();
  const { data: exams } = await supabase
    .from("mock_exam")
    .select(
      "id, name, exam_date, exam_type, created_at, mock_exam_subject_result(count)",
    )
    .eq("tenant_id", tenantId)
    .order("exam_date", { ascending: false })
    .limit(100)
    .returns<
      {
        id: string;
        name: string;
        exam_date: string;
        exam_type: string | null;
        created_at: string;
        mock_exam_subject_result: { count: number }[];
      }[]
    >();

  return (
    <>
      <PageHeader
        title="Denemeler"
        description="Deneme sınavları ve yüklenmiş sonuç satırları. Sonuç girişi tek tek değil, deneme başına CSV yükleyerek yapılır."
        action={
          <div className="flex gap-2">
            <Link href="/admin/import/exam-results" className={btnSecondary}>
              Sonuç Yükle
            </Link>
            <Link href="/admin/exams/new" className={btnPrimary}>
              Yeni Deneme
            </Link>
          </div>
        }
      />

      {!exams || exams.length === 0 ? (
        <EmptyState
          title="Henüz deneme yok"
          description="Sonuç yükleyebilmek için önce denemeyi (ad + tarih) oluşturman gerekiyor."
          action={
            <Link href="/admin/exams/new" className={btnPrimary}>
              Yeni Deneme
            </Link>
          }
        />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Deneme</th>
                <th className={th}>Tarih</th>
                <th className={th}>Tür</th>
                <th className={th}>Sonuç</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => {
                const rowCount = e.mock_exam_subject_result[0]?.count ?? 0;
                return (
                  <tr key={e.id} className={trHover}>
                    <td className={`${td} font-medium`}>
                      <Link
                        href={`/admin/exams/${e.id}`}
                        className="hover:underline"
                      >
                        {e.name}
                      </Link>
                    </td>
                    <td className={`${td} whitespace-nowrap text-muted`}>
                      {new Date(e.exam_date).toLocaleDateString("tr-TR")}
                    </td>
                    <td className={`${td} text-muted`}>{e.exam_type ?? "—"}</td>
                    <td className={td}>
                      {rowCount === 0 ? (
                        <Badge tone="warning">sonuç yüklenmedi</Badge>
                      ) : (
                        <Badge tone="brand">{rowCount} satır</Badge>
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
