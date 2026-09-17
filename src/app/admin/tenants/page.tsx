import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { JumpToTenantButton } from "@/components/admin/JumpToTenantButton";
import {
  btnPrimary,
  table,
  tableWrap,
  td,
  th,
  trHover,
} from "@/components/ui/styles";

// Ekran: A.0 — Dershane (tenant) listesi. Sadece system_admin.
export default async function TenantsPage() {
  requireRole(await getViewer(), ["system_admin"]);

  const supabase = await createClient();
  const { data: tenants } = await supabase
    .from("tenant")
    .select(
      "id, name, slug, status, created_at, branch(count), user_account(count)",
    )
    .order("created_at", { ascending: false })
    .returns<
      {
        id: string;
        name: string;
        slug: string;
        status: string;
        created_at: string;
        branch: { count: number }[];
        user_account: { count: number }[];
      }[]
    >();

  return (
    <>
      <PageHeader
        title="Dershaneler"
        description="Sistemdeki tüm dershaneler. Bir dershaneye geçince panelin geri kalanı o dershaneyi gösterir."
        action={
          <Link href="/admin/tenants/new" className={btnPrimary}>
            Yeni Dershane
          </Link>
        }
      />

      {!tenants || tenants.length === 0 ? (
        <EmptyState
          title="Henüz dershane yok"
          description="Anlaşma yapılan ilk dershaneyi oluşturarak başla."
          action={
            <Link href="/admin/tenants/new" className={btnPrimary}>
              Yeni Dershane
            </Link>
          }
        />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Dershane</th>
                <th className={th}>Slug</th>
                <th className={th}>Şube</th>
                <th className={th}>Kişi</th>
                <th className={th}>Durum</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className={trHover}>
                  <td className={`${td} font-medium`}>{t.name}</td>
                  <td className={`${td} font-mono text-xs text-muted`}>
                    {t.slug}
                  </td>
                  <td className={`${td} tabular-nums`}>
                    {t.branch[0]?.count ?? 0}
                  </td>
                  <td className={`${td} tabular-nums`}>
                    {t.user_account[0]?.count ?? 0}
                  </td>
                  <td className={td}>
                    <Badge tone={t.status === "active" ? "success" : "warning"}>
                      {t.status === "active" ? "Aktif" : "Askıda"}
                    </Badge>
                  </td>
                  <td className={`${td} text-right`}>
                    <JumpToTenantButton tenantId={t.id} />
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
