import { getViewer, requireRole } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { JumpToTenantButton } from "@/components/admin/JumpToTenantButton";

const ROLE_LABEL: Record<string, string> = {
  system_admin: "Sistem Admin",
  dershane_admin: "Dershane Admin",
  rehberlik: "Rehberlik",
  ogretmen: "Öğretmen",
  ogrenci: "Öğrenci",
};

// Sadece system_admin: RLS bu rol için tenant_id filtresini kaldırıyor
// (bkz. supabase/migrations/0001_init.sql is_system_admin()), yani buradaki
// sorgular ekstra bir "tüm tenant'lar" parametresi olmadan zaten tüm
// dershaneleri tarıyor.
export default async function GlobalSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  requireRole(await getViewer(), ["system_admin"]);
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const supabase = await createClient();

  let tenantResults: { id: string; name: string; slug: string }[] = [];
  let peopleResults: {
    id: string;
    full_name: string;
    role: string;
    status: string;
    tenant: { id: string; name: string } | null;
  }[] = [];

  if (query.length >= 2) {
    const [tenantRes, peopleRes] = await Promise.all([
      supabase
        .from("tenant")
        .select("id, name, slug")
        .ilike("name", `%${query}%`)
        .order("name")
        .limit(20),
      supabase
        .from("user_account")
        .select("id, full_name, role, status, tenant:tenant_id(id, name)")
        .ilike("full_name", `%${query}%`)
        .order("full_name")
        .limit(50)
        .returns<
          {
            id: string;
            full_name: string;
            role: string;
            status: string;
            tenant: { id: string; name: string } | null;
          }[]
        >(),
    ]);
    tenantResults = tenantRes.data ?? [];
    peopleResults = peopleRes.data ?? [];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Genel Arama</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Tüm dershanelerde dershane adı, öğrenci, öğretmen veya rehberlik ismi
        ara.
      </p>

      <form method="GET" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="İsim ara..."
          minLength={2}
          className="w-full max-w-sm rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-transparent"
        />
        <button
          type="submit"
          className="rounded-md bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
        >
          Ara
        </button>
      </form>

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-black/60 dark:text-white/60">
          En az 2 karakter gir.
        </p>
      )}

      {query.length >= 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-medium">
              Dershaneler ({tenantResults.length})
            </h2>
            {tenantResults.length === 0 ? (
              <p className="text-sm text-black/60 dark:text-white/60">
                Eşleşme yok.
              </p>
            ) : (
              <ul className="divide-y divide-black/10 text-sm dark:divide-white/10">
                {tenantResults.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span>
                      {t.name}{" "}
                      <span className="text-black/50 dark:text-white/50">
                        ({t.slug})
                      </span>
                    </span>
                    <JumpToTenantButton tenantId={t.id} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium">
              Kişiler ({peopleResults.length})
            </h2>
            {peopleResults.length === 0 ? (
              <p className="text-sm text-black/60 dark:text-white/60">
                Eşleşme yok.
              </p>
            ) : (
              <ul className="divide-y divide-black/10 text-sm dark:divide-white/10">
                {peopleResults.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span>
                      <span className="font-medium">{p.full_name}</span>{" "}
                      <span className="text-black/50 dark:text-white/50">
                        · {ROLE_LABEL[p.role] ?? p.role} · {p.tenant?.name ?? "?"} ·{" "}
                        {p.status}
                      </span>
                    </span>
                    {p.tenant && <JumpToTenantButton tenantId={p.tenant.id} />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
