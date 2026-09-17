import Link from "next/link";
import { SideNav, type NavSection } from "@/components/SideNav";

// Ortak layout: docs/flows/web-common.md → "Ortak Layout".
// Sidebar menüsü UI kolaylığı içindir, gerçek erişim kontrolü backend'de
// (Route Handler + RLS) yapılır — bkz. AGENTS.md.
export function AppShell({
  fullName,
  roleLabel,
  homeHref = "/",
  rightSlot,
  nav,
  children,
}: {
  fullName: string;
  roleLabel: string;
  homeHref?: string;
  rightSlot?: React.ReactNode;
  nav?: NavSection[];
  children: React.ReactNode;
}) {
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr") ?? "")
    .join("");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface px-5 py-2.5">
        <Link href={homeHref} className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-xs font-bold text-brand-fg">
            DT
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Dershane Takip
          </span>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {rightSlot}
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-[11px] font-semibold text-muted">
              {initials || "?"}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-xs font-medium">{fullName}</span>
              <span className="block text-[11px] text-muted">{roleLabel}</span>
            </span>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              Çıkış
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        {nav && nav.length > 0 && <SideNav sections={nav} />}
        <main className="min-w-0 flex-1 p-6">
          <div className="mx-auto max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
