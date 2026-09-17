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
  table,
  tableWrap,
  td,
  th,
  trHover,
} from "@/components/ui/styles";

// Ekran: web-dershane-admin.md → "Ekran: Rehberlik Listesi"
export default async function GuidancePage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  if (!tenantId) return <NoTenantNotice />;

  const supabase = await createClient();
  const { data: guidanceUsers } = await supabase
    .from("user_account")
    .select("id, full_name, status, guidance_student_assignment(count)")
    .eq("tenant_id", tenantId)
    .eq("role", "rehberlik")
    .order("full_name")
    .returns<
      {
        id: string;
        full_name: string;
        status: string;
        guidance_student_assignment: { count: number }[];
      }[]
    >();

  return (
    <>
      <PageHeader
        title="Rehberlik"
        description="Rehberlik öğretmenleri yalnızca kendilerine atanmış öğrencileri görür — atama yapmadan panelleri boş kalır."
        action={
          <Link href="/admin/guidance/new" className={btnPrimary}>
            Rehberlik Ekle
          </Link>
        }
      />

      {!guidanceUsers || guidanceUsers.length === 0 ? (
        <EmptyState
          title="Henüz rehberlik kullanıcısı yok"
          description="Rehberlik kullanıcısını eklerken hangi öğrencileri takip edeceğini de seçiyorsun."
          action={
            <Link href="/admin/guidance/new" className={btnPrimary}>
              Rehberlik Ekle
            </Link>
          }
        />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Ad Soyad</th>
                <th className={th}>Atanmış Öğrenci</th>
                <th className={th}>Hesap</th>
              </tr>
            </thead>
            <tbody>
              {guidanceUsers.map((g) => (
                <tr key={g.id} className={trHover}>
                  <td className={`${td} font-medium`}>
                    <Link
                      href={`/admin/guidance/${g.id}`}
                      className="hover:underline"
                    >
                      {g.full_name}
                    </Link>
                  </td>
                  <td className={`${td} tabular-nums`}>
                    {g.guidance_student_assignment[0]?.count ?? 0}
                  </td>
                  <td className={td}>
                    <AccountStatusBadge status={g.status} />
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
