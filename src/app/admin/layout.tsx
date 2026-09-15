import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { TenantSwitcher } from "@/components/TenantSwitcher";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = requireRole(await getViewer(), [
    "dershane_admin",
    "system_admin",
  ]);
  const { account } = viewer;
  const isSystemAdmin = account.role === "system_admin";

  const nav = [
    { label: "Dashboard", href: "/admin" },
    ...(isSystemAdmin ? [{ label: "Dershaneler", href: "/admin/tenants" }] : []),
    { label: "Şubeler", href: "/admin/branches" },
    { label: "Sınıflar", href: "/admin/classes" },
    { label: "Öğretmenler", href: "/admin/teachers" },
    { label: "Rehberlik", href: "/admin/guidance" },
    { label: "Doğrulanmamış Hesaplar", href: "/admin/unclaimed" },
    { label: "Roster İçe Aktar", href: "/admin/import/roster" },
    { label: "Deneme Sonucu İçe Aktar", href: "/admin/import/exam-results" },
  ];

  let rightSlot: React.ReactNode = null;
  if (isSystemAdmin) {
    const supabase = await createClient();
    const { data: tenants } = await supabase
      .from("tenant")
      .select("id, name")
      .order("name");
    const activeTenantId = await getActiveTenantId(viewer);
    rightSlot = (
      <TenantSwitcher
        tenants={tenants ?? []}
        activeTenantId={activeTenantId}
      />
    );
  }

  const roleLabel =
    account.role === "system_admin" ? "Sistem Admin" : "Dershane Admin";

  return (
    <AppShell
      fullName={account.full_name}
      roleLabel={roleLabel}
      rightSlot={rightSlot}
      nav={nav}
    >
      {children}
    </AppShell>
  );
}
