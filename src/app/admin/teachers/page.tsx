import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccountStatusBadge } from "@/components/admin/AccountStatusBadge";
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

// Ekran: web-dershane-admin.md → "Ekran: Öğretmen Listesi"
export default async function TeachersPage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  if (!tenantId) return <NoTenantNotice />;

  const supabase = await createClient();
  const { data: teachers } = await supabase
    .from("user_account")
    .select("id, full_name, status, teacher_class_assignment(class_group(name))")
    .eq("tenant_id", tenantId)
    .eq("role", "ogretmen")
    .order("full_name")
    .returns<
      {
        id: string;
        full_name: string;
        status: string;
        teacher_class_assignment: { class_group: { name: string } | null }[];
      }[]
    >();

  return (
    <>
      <PageHeader
        title="Öğretmenler"
        description="Öğretmenler hangi sınıflara giriyor. Toplu ekleme için roster içe aktarmayı kullan."
        action={
          <div className="flex gap-2">
            <Link href="/admin/import/roster" className={btnSecondary}>
              Toplu Ekle
            </Link>
            <Link href="/admin/teachers/new" className={btnPrimary}>
              Öğretmen Ekle
            </Link>
          </div>
        }
      />

      {!teachers || teachers.length === 0 ? (
        <EmptyState
          title="Henüz öğretmen yok"
          description="Tek tek ekleyebilir ya da dershaneden gelen öğretmen listesini CSV olarak toplu yükleyebilirsin."
          action={
            <Link href="/admin/import/roster" className={btnPrimary}>
              Roster İçe Aktar
            </Link>
          }
        />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Ad Soyad</th>
                <th className={th}>Sınıflar</th>
                <th className={th}>Hesap</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className={trHover}>
                  <td className={`${td} font-medium`}>
                    <Link
                      href={`/admin/teachers/${t.id}`}
                      className="hover:underline"
                    >
                      {t.full_name}
                    </Link>
                  </td>
                  <td className={`${td} text-muted`}>
                    {t.teacher_class_assignment
                      .map((a) => a.class_group?.name)
                      .filter(Boolean)
                      .join(", ") || "sınıf atanmadı"}
                  </td>
                  <td className={td}>
                    <AccountStatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
