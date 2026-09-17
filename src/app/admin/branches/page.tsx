import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";
import {
  btnPrimary,
  table,
  tableWrap,
  td,
  th,
  trHover,
} from "@/components/ui/styles";

// Ekran: web-dershane-admin.md → "Ekran: Şube Listesi"
export default async function BranchesPage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  if (!tenantId) return <NoTenantNotice />;

  const supabase = await createClient();
  const { data: branches } = await supabase
    .from("branch")
    .select("id, name, address, class_group(count)")
    .eq("tenant_id", tenantId)
    .order("name");

  return (
    <>
      <PageHeader
        title="Şubeler"
        description="Dershanenin fiziksel şubeleri. Sınıflar bir şubeye bağlanır."
        action={
          <Link href="/admin/branches/new" className={btnPrimary}>
            Şube Ekle
          </Link>
        }
      />

      {!branches || branches.length === 0 ? (
        <EmptyState
          title="Henüz şube yok"
          description="Tek şubeli bir dershanede bile en az bir şube gerekiyor — sınıflar şubeye bağlanıyor."
          action={
            <Link href="/admin/branches/new" className={btnPrimary}>
              Şube Ekle
            </Link>
          }
        />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Şube</th>
                <th className={th}>Adres</th>
                <th className={th}>Sınıf</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className={trHover}>
                  <td className={`${td} font-medium`}>
                    <Link
                      href={`/admin/branches/${b.id}`}
                      className="hover:underline"
                    >
                      {b.name}
                    </Link>
                  </td>
                  <td className={`${td} text-muted`}>{b.address ?? "—"}</td>
                  <td className={`${td} tabular-nums`}>
                    {b.class_group[0]?.count ?? 0}
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
