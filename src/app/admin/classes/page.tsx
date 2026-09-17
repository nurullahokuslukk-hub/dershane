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

// Ekran: web-dershane-admin.md → "Ekran: Sınıf Listesi"
export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const tenantId = await getActiveTenantId(viewer);
  const { branch: branchFilter } = await searchParams;

  if (!tenantId) return <NoTenantNotice />;

  const supabase = await createClient();
  const { data: branches } = await supabase
    .from("branch")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("name");

  const baseQuery = supabase
    .from("class_group")
    .select(
      "id, name, academic_year, branch:branch_id(id, name), student_profile(count)",
    )
    .eq("tenant_id", tenantId);
  const { data: classes } = await (branchFilter
    ? baseQuery.eq("branch_id", branchFilter)
    : baseQuery
  )
    .order("name")
    .returns<
      {
        id: string;
        name: string;
        academic_year: string;
        branch: { id: string; name: string } | null;
        student_profile: { count: number }[];
      }[]
    >();

  return (
    <>
      <PageHeader
        title="Sınıflar"
        description="Her sınıf bir şubeye bağlıdır. Öğrenciler ve öğretmenler sınıf üzerinden eşleşir."
        action={
          <Link href="/admin/classes/new" className={btnPrimary}>
            Sınıf Ekle
          </Link>
        }
      />

      {branches && branches.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <FilterChip href="/admin/classes" active={!branchFilter}>
            Tümü
          </FilterChip>
          {branches.map((b) => (
            <FilterChip
              key={b.id}
              href={`/admin/classes?branch=${b.id}`}
              active={branchFilter === b.id}
            >
              {b.name}
            </FilterChip>
          ))}
        </div>
      )}

      {!classes || classes.length === 0 ? (
        <EmptyState
          title="Sınıf bulunamadı"
          description="Roster içe aktarmadan önce sınıfların oluşturulmuş olması gerekiyor — öğrenciler sınıf adıyla eşleşiyor."
          action={
            <Link href="/admin/classes/new" className={btnPrimary}>
              Sınıf Ekle
            </Link>
          }
        />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Sınıf</th>
                <th className={th}>Şube</th>
                <th className={th}>Eğitim Yılı</th>
                <th className={th}>Öğrenci</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className={trHover}>
                  <td className={`${td} font-medium`}>
                    <Link
                      href={`/admin/classes/${c.id}`}
                      className="hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className={`${td} text-muted`}>{c.branch?.name ?? "—"}</td>
                  <td className={`${td} text-muted`}>{c.academic_year}</td>
                  <td className={td}>
                    <Link
                      href={`/admin/students?class=${c.id}`}
                      className="tabular-nums hover:underline"
                    >
                      {c.student_profile[0]?.count ?? 0}
                    </Link>
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

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-brand bg-brand-soft font-medium text-brand-soft-fg"
          : "border-border text-muted hover:bg-surface-hover"
      }`}
    >
      {children}
    </Link>
  );
}
