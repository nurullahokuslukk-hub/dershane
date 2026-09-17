import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";
import { UnclaimedRowActions } from "@/components/admin/UnclaimedRowActions";
import { table, tableWrap, td, th, trHover } from "@/components/ui/styles";

const ROLE_LABEL: Record<string, string> = {
  ogrenci: "Öğrenci",
  ogretmen: "Öğretmen",
  rehberlik: "Rehberlik",
  dershane_admin: "Dershane Admin",
};

// Ekran: web-dershane-admin.md → "Ekran: Doğrulanmamış Hesaplar"
export default async function UnclaimedPage() {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  if (!tenantId) return <NoTenantNotice />;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("user_account")
    .select("id, full_name, role, account_claim_code(code, expires_at, status)")
    .eq("tenant_id", tenantId)
    .eq("status", "unclaimed")
    .order("full_name")
    .limit(500)
    .returns<
      {
        id: string;
        full_name: string;
        role: string;
        account_claim_code: {
          code: string;
          expires_at: string;
          status: string;
        } | null;
      }[]
    >();

  return (
    <>
      <PageHeader
        title="Doğrulanmamış Hesaplar"
        description={
          <>
            Bu kişiler henüz kendi e-posta/telefon ve şifresini belirlemedi.
            Kodu dershaneye ilet; kişi{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs">
              /claim
            </code>{" "}
            ekranından hesabını kendisi aktifleştirir — şifreleri senin tutman
            gerekmiyor.
          </>
        }
      />

      {!rows || rows.length === 0 ? (
        <EmptyState
          title="Bekleyen hesap yok"
          description="Bu dershanedeki herkes hesabını doğrulamış görünüyor."
        />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Ad Soyad</th>
                <th className={th}>Rol</th>
                <th className={th}>Doğrulama Kodu</th>
                <th className={th}>Geçerlilik</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const claim = r.account_claim_code;
                const expired =
                  claim && new Date(claim.expires_at) < new Date();
                return (
                  <tr key={r.id} className={trHover}>
                    <td className={`${td} font-medium`}>{r.full_name}</td>
                    <td className={`${td} text-muted`}>
                      {ROLE_LABEL[r.role] ?? r.role}
                    </td>
                    <td className={td}>
                      {claim ? (
                        <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-sm tracking-wider">
                          {claim.code}
                        </code>
                      ) : (
                        <span className="text-muted">kod yok</span>
                      )}
                    </td>
                    <td className={td}>
                      {claim ? (
                        expired ? (
                          <Badge tone="danger">süresi doldu</Badge>
                        ) : (
                          <span className="text-xs text-muted">
                            {new Date(claim.expires_at).toLocaleDateString(
                              "tr-TR",
                            )}
                            &apos;e kadar
                          </span>
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`${td} text-right`}>
                      {claim && (
                        <UnclaimedRowActions
                          accountId={r.id}
                          code={claim.code}
                        />
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
