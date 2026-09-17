import { getViewer, requireRole } from "@/lib/auth/viewer";
import { getActiveTenantId } from "@/lib/tenant-context";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import type { NavSection } from "@/components/SideNav";
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

  const supabase = await createClient();
  const activeTenantId = await getActiveTenantId(viewer);

  // Menüdeki "Doğrulanmamış Hesaplar" rozeti — bekleyen iş sayısı menüden
  // görünsün diye (kullanıcı her seferinde sayfaya girip kontrol etmesin).
  let unclaimedCount = 0;
  if (activeTenantId) {
    const { count } = await supabase
      .from("user_account")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", activeTenantId)
      .eq("status", "unclaimed");
    unclaimedCount = count ?? 0;
  }

  const nav: NavSection[] = [
    {
      title: "Genel",
      items: [
        { label: "Dashboard", href: "/admin" },
        ...(isSystemAdmin
          ? [
              { label: "Genel Arama", href: "/admin/search" },
              { label: "Dershaneler", href: "/admin/tenants" },
            ]
          : []),
      ],
    },
    {
      title: "Kurum",
      items: [
        { label: "Şubeler", href: "/admin/branches" },
        { label: "Sınıflar", href: "/admin/classes" },
      ],
    },
    {
      title: "Kişiler",
      items: [
        { label: "Öğrenciler", href: "/admin/students" },
        { label: "Öğretmenler", href: "/admin/teachers" },
        { label: "Rehberlik", href: "/admin/guidance" },
        {
          label: "Doğrulanmamış",
          href: "/admin/unclaimed",
          badge: unclaimedCount,
        },
      ],
    },
    {
      title: "Akademik",
      items: [
        { label: "Denemeler", href: "/admin/exams" },
        { label: "Roster İçe Aktar", href: "/admin/import/roster" },
        { label: "Sonuç İçe Aktar", href: "/admin/import/exam-results" },
      ],
    },
    {
      title: "Sistem",
      items: [{ label: "İşlem Kayıtları", href: "/admin/audit-log" }],
    },
  ];

  let rightSlot: React.ReactNode = null;
  if (isSystemAdmin) {
    const { data: tenants } = await supabase
      .from("tenant")
      .select("id, name")
      .order("name");
    rightSlot = (
      <TenantSwitcher tenants={tenants ?? []} activeTenantId={activeTenantId} />
    );
  }

  const roleLabel = isSystemAdmin ? "Sistem Admin" : "Dershane Admin";

  return (
    <AppShell
      fullName={account.full_name}
      roleLabel={roleLabel}
      homeHref="/admin"
      rightSlot={rightSlot}
      nav={nav}
    >
      {children}
    </AppShell>
  );
}
