import { getViewer, requireRole } from "@/lib/auth/viewer";
import { AppShell } from "@/components/AppShell";
import type { NavSection } from "@/components/SideNav";

// Rehberlik paneli: docs/flows/web-rehberlik.md.
// Rol kontrolü burada bir kez yapılıyor; hangi ÖĞRENCİYİ görebileceği ayrıca
// her sayfada guidance_student_assignment üzerinden doğrulanıyor
// (bkz. src/lib/guidance/access.ts).
export default async function RehberlikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = requireRole(await getViewer(), ["rehberlik"]);

  const nav: NavSection[] = [
    {
      title: "Rehberlik",
      items: [{ label: "Öğrencilerim", href: "/rehberlik" }],
    },
  ];

  return (
    <AppShell
      fullName={viewer.account.full_name}
      roleLabel="Rehberlik"
      homeHref="/rehberlik"
      nav={nav}
    >
      {children}
    </AppShell>
  );
}
