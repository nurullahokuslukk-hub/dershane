import Link from "next/link";

// Ortak layout: docs/flows/web-common.md → "Ortak Layout".
// Sidebar menüsü UI kolaylığı içindir, gerçek erişim kontrolü backend'de
// (Route Handler + RLS) yapılır — bkz. AGENTS.md.
export function AppShell({
  fullName,
  roleLabel,
  rightSlot,
  nav,
  children,
}: {
  fullName: string;
  roleLabel: string;
  rightSlot?: React.ReactNode;
  nav?: { label: string; href: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-3 dark:border-white/10">
        <span className="font-semibold">Dershane Öğrenci Takip Sistemi</span>
        <div className="flex items-center gap-4 text-sm">
          {rightSlot}
          <span className="text-black/70 dark:text-white/70">
            {fullName} · {roleLabel}
          </span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md border border-black/15 px-3 py-1 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
            >
              Çıkış yap
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1">
        {nav && nav.length > 0 && (
          <nav className="w-48 shrink-0 border-r border-black/10 p-4 dark:border-white/10">
            <ul className="space-y-1 text-sm">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
