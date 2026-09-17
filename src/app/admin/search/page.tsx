import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { JumpToTenantButton } from "@/components/admin/JumpToTenantButton";
import { AccountStatusBadge } from "@/components/admin/AccountStatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import {
  btnPrimary,
  input,
  table,
  tableWrap,
  td,
  th,
  trHover,
} from "@/components/ui/styles";

const ROLE_LABEL: Record<string, string> = {
  system_admin: "Sistem Admin",
  dershane_admin: "Dershane Admin",
  rehberlik: "Rehberlik",
  ogretmen: "Öğretmen",
  ogrenci: "Öğrenci",
};

type Person = {
  id: string;
  full_name: string;
  role: string;
  status: string;
  tenant: { id: string; name: string } | null;
  student_profile: {
    class_group: { name: string } | null;
    branch: { name: string } | null;
  } | null;
};

// Sadece system_admin: RLS bu rol için tenant_id filtresini kaldırıyor
// (bkz. supabase/migrations/0001_init.sql is_system_admin()), yani buradaki
// sorgular ekstra bir "tüm tenant'lar" parametresi olmadan zaten tüm
// dershaneleri tarıyor.
export default async function GlobalSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  requireRole(await getViewer(), ["system_admin"]);
  const sp = await searchParams;
  const query = sp.q?.trim() ?? "";
  const roleFilter = sp.role ?? "";

  const supabase = await createClient();

  let tenantResults: { id: string; name: string; slug: string }[] = [];
  let peopleResults: Person[] = [];

  if (query.length >= 2) {
    let peopleQuery = supabase
      .from("user_account")
      .select(
        "id, full_name, role, status, tenant:tenant_id(id, name), student_profile(class_group:class_group_id(name), branch:branch_id(name))",
      )
      .ilike("full_name", `%${query}%`);
    if (roleFilter) peopleQuery = peopleQuery.eq("role", roleFilter);

    const [tenantRes, peopleRes] = await Promise.all([
      supabase
        .from("tenant")
        .select("id, name, slug")
        .ilike("name", `%${query}%`)
        .order("name")
        .limit(20),
      peopleQuery.order("full_name").limit(100).returns<Person[]>(),
    ]);
    tenantResults = tenantRes.data ?? [];
    peopleResults = peopleRes.data ?? [];
  }

  return (
    <>
      <PageHeader
        title="Genel Arama"
        description="Tüm dershanelerde tek yerden ara: dershane adı, öğrenci, öğretmen veya rehberlik ismi. Sonuçtan doğrudan o dershanenin bağlamına geçebilirsin."
      />

      <form method="GET" className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Dershane veya kişi adı…"
          minLength={2}
          className={`${input} max-w-sm`}
        />
        <select name="role" defaultValue={roleFilter} className={`${input} max-w-[12rem]`}>
          <option value="">Tüm roller</option>
          <option value="ogrenci">Öğrenci</option>
          <option value="ogretmen">Öğretmen</option>
          <option value="rehberlik">Rehberlik</option>
          <option value="dershane_admin">Dershane Admin</option>
        </select>
        <button type="submit" className={btnPrimary}>
          Ara
        </button>
      </form>

      {query.length === 0 && (
        <EmptyState
          title="Aramaya başla"
          description="En az 2 karakter yaz. Arama tüm dershaneleri kapsar — hangi dershanede olduğunu bilmene gerek yok."
        />
      )}

      {query.length === 1 && (
        <p className="text-sm text-muted">En az 2 karakter gir.</p>
      )}

      {query.length >= 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader title={`Dershaneler (${tenantResults.length})`} />
            <CardBody>
              {tenantResults.length === 0 ? (
                <p className="text-sm text-muted">Eşleşme yok.</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {tenantResults.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                    >
                      <span>
                        <span className="font-medium">{t.name}</span>{" "}
                        <span className="font-mono text-xs text-muted">
                          {t.slug}
                        </span>
                      </span>
                      <JumpToTenantButton tenantId={t.id} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={`Kişiler (${peopleResults.length})`}
              description={
                peopleResults.length === 100
                  ? "İlk 100 sonuç gösteriliyor — aramayı daraltabilirsin."
                  : undefined
              }
            />
            {peopleResults.length === 0 ? (
              <CardBody>
                <p className="text-sm text-muted">Eşleşme yok.</p>
              </CardBody>
            ) : (
              <div className={`${tableWrap} rounded-t-none border-x-0 border-b-0`}>
                <table className={table}>
                  <thead>
                    <tr>
                      <th className={th}>Ad Soyad</th>
                      <th className={th}>Rol</th>
                      <th className={th}>Dershane</th>
                      <th className={th}>Sınıf</th>
                      <th className={th}>Hesap</th>
                      <th className={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {peopleResults.map((p) => (
                      <tr key={p.id} className={trHover}>
                        <td className={`${td} font-medium`}>
                          {p.role === "ogrenci" ? (
                            <Link
                              href={`/admin/students/${p.id}`}
                              className="hover:underline"
                            >
                              {p.full_name}
                            </Link>
                          ) : (
                            p.full_name
                          )}
                        </td>
                        <td className={td}>
                          <Badge tone="brand">
                            {ROLE_LABEL[p.role] ?? p.role}
                          </Badge>
                        </td>
                        <td className={`${td} text-muted`}>
                          {p.tenant?.name ?? "—"}
                        </td>
                        <td className={`${td} text-muted`}>
                          {p.student_profile?.class_group?.name ?? "—"}
                          {p.student_profile?.branch?.name
                            ? ` · ${p.student_profile.branch.name}`
                            : ""}
                        </td>
                        <td className={td}>
                          <AccountStatusBadge status={p.status} />
                        </td>
                        <td className={`${td} text-right`}>
                          {p.tenant && (
                            <JumpToTenantButton tenantId={p.tenant.id} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
