import Link from "next/link";
import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccountStatusBadge } from "@/components/admin/AccountStatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { NoTenantNotice } from "@/components/admin/NoTenantNotice";
import {
  btnPrimary,
  btnSecondary,
  input,
  table,
  tableWrap,
  td,
  th,
  trHover,
} from "@/components/ui/styles";

const PAGE_SIZE = 50;

type StudentRow = {
  id: string;
  full_name: string;
  status: string;
  student_profile: {
    id: string;
    birth_date: string | null;
    class_group: { id: string; name: string } | null;
    branch: { id: string; name: string } | null;
  } | null;
};

// Ekran: web-dershane-admin.md → öğrenci listesi. Sınıf ekranından ayrı bir
// ekran çünkü kullanıcının asıl ihtiyacı "ismi ara, bul" — sınıf sınıf gezmek
// yüzlerce öğrencide çalışmıyor.
export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; class?: string; page?: string }>;
}) {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  if (!tenantId) return <NoTenantNotice />;

  const sp = await searchParams;
  const query = sp.q?.trim() ?? "";
  const classFilter = sp.class ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();

  const { data: classes } = await supabase
    .from("class_group")
    .select("id, name, branch:branch_id(name)")
    .eq("tenant_id", tenantId)
    .order("name")
    .returns<{ id: string; name: string; branch: { name: string } | null }[]>();

  // Taban tablo user_account — isme göre sıralama/arama doğrudan burada
  // yapılabiliyor. student_profile `!inner` ile bağlandığı için yalnızca
  // profili olan (yani gerçek) öğrenciler geliyor.
  let dbQuery = supabase
    .from("user_account")
    .select(
      "id, full_name, status, student_profile!inner(id, birth_date, class_group:class_group_id(id, name), branch:branch_id(id, name))",
      { count: "exact" },
    )
    .eq("tenant_id", tenantId)
    .eq("role", "ogrenci");

  if (query.length >= 2) dbQuery = dbQuery.ilike("full_name", `%${query}%`);
  if (classFilter) {
    dbQuery = dbQuery.eq("student_profile.class_group_id", classFilter);
  }

  const { data: students, count } = await dbQuery
    .order("full_name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    .returns<StudentRow[]>();

  const total = count ?? 0;

  return (
    <>
      <PageHeader
        title="Öğrenciler"
        description="Bu dershaneye kayıtlı tüm öğrenciler. İsimle arayabilir, sınıfa göre süzebilirsin."
        action={
          <Link href="/admin/import/roster" className={btnPrimary}>
            Toplu Öğrenci Ekle
          </Link>
        }
      />

      <form method="GET" className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Öğrenci adı ara…"
          className={`${input} max-w-xs`}
        />
        <select
          name="class"
          defaultValue={classFilter}
          className={`${input} max-w-xs`}
        >
          <option value="">Tüm sınıflar</option>
          {classes?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.branch?.name ? ` — ${c.branch.name}` : ""}
            </option>
          ))}
        </select>
        <button type="submit" className={btnSecondary}>
          Filtrele
        </button>
        {(query || classFilter) && (
          <Link href="/admin/students" className="text-sm text-muted hover:underline">
            Temizle
          </Link>
        )}
      </form>

      {query.length === 1 && (
        <p className="text-sm text-muted">Arama için en az 2 karakter gir.</p>
      )}

      {total === 0 ? (
        <EmptyState
          title={
            query || classFilter ? "Eşleşen öğrenci yok" : "Henüz öğrenci yok"
          }
          description={
            query || classFilter
              ? "Farklı bir isim ya da sınıf dene."
              : "Öğrencileri tek tek değil, dershaneden gelen listeyi CSV'ye aktarıp toplu yükleyerek ekliyorsun."
          }
          action={
            !query && !classFilter ? (
              <Link href="/admin/import/roster" className={btnPrimary}>
                Roster İçe Aktar
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          <div className={tableWrap}>
            <table className={table}>
              <thead>
                <tr>
                  <th className={th}>Ad Soyad</th>
                  <th className={th}>Sınıf</th>
                  <th className={th}>Şube</th>
                  <th className={th}>Doğum Tarihi</th>
                  <th className={th}>Hesap</th>
                </tr>
              </thead>
              <tbody>
                {students?.map((s) => (
                  <tr key={s.id} className={trHover}>
                    <td className={`${td} font-medium`}>
                      <Link
                        href={`/admin/students/${s.id}`}
                        className="hover:underline"
                      >
                        {s.full_name}
                      </Link>
                    </td>
                    <td className={td}>
                      {s.student_profile?.class_group?.name ?? "—"}
                    </td>
                    <td className={`${td} text-muted`}>
                      {s.student_profile?.branch?.name ?? "—"}
                    </td>
                    <td className={`${td} text-muted`}>
                      {s.student_profile?.birth_date ?? "—"}
                    </td>
                    <td className={td}>
                      <AccountStatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            basePath="/admin/students"
            params={{ q: query || undefined, class: classFilter || undefined }}
          />
        </div>
      )}
    </>
  );
}
