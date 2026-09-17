"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { label: string; href: string; badge?: number };
export type NavSection = { title: string; items: NavItem[] };

// Aktif bağlantıyı işaretlemek için pathname gerekiyor — bu yüzden AppShell'in
// (Server Component) içindeki tek client parçası burası.
function isActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/rehberlik") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 border-r border-border bg-surface px-3 py-4">
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-soft uppercase">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-brand-soft font-medium text-brand-soft-fg"
                          : "text-muted hover:bg-surface-hover hover:text-foreground"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="rounded-full bg-warning-soft px-1.5 py-0.5 text-[11px] font-semibold text-warning">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
