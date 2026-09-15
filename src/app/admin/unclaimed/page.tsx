import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { UnclaimedRowActions } from "@/components/admin/UnclaimedRowActions";

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

  if (!tenantId) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60">
        Önce üstteki menüden bir dershane seç.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("user_account")
    .select("id, full_name, role, account_claim_code(code, expires_at, status)")
    .eq("tenant_id", tenantId)
    .eq("status", "unclaimed")
    .order("full_name")
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
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Doğrulanmamış Hesaplar</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Bu kişiler henüz kendi e-posta/telefon + şifresini belirleyip hesabını
        doğrulamadı. Kodu dershaneye ilet; kişi{" "}
        <code className="rounded bg-black/5 px-1 dark:bg-white/10">/claim</code>{" "}
        ekranından kendi hesabını aktifleştirir.
      </p>

      {(!rows || rows.length === 0) && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Doğrulanmamış hesap yok.
        </p>
      )}

      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {rows?.map((r) => {
          const claim = r.account_claim_code;
          const expired = claim && new Date(claim.expires_at) < new Date();
          return (
            <li
              key={r.id}
              className="flex items-center justify-between gap-4 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{r.full_name}</span>{" "}
                <span className="text-black/50 dark:text-white/50">
                  · {ROLE_LABEL[r.role] ?? r.role}
                  {claim && (
                    <>
                      {" "}
                      · kod: <code>{claim.code}</code>{" "}
                      {expired && (
                        <span className="text-red-600">(süresi doldu)</span>
                      )}
                    </>
                  )}
                </span>
              </span>
              {claim && (
                <UnclaimedRowActions accountId={r.id} code={claim.code} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
