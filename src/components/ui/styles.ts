// Tekrarlanan Tailwind sınıf demetleri. Bileşen olarak sarmalamak yerine
// sabit string tutuluyor — hem Server hem Client Component'lerde aynı şekilde
// kullanılabiliyor, ekstra bir bundle maliyeti yok.

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-brand-fg transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground";

export const btnXs =
  "inline-flex items-center justify-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-danger/40 bg-danger-soft px-3.5 py-2 text-sm font-medium text-danger transition-colors hover:border-danger disabled:cursor-not-allowed disabled:opacity-50";

export const input =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-soft focus:border-brand focus:outline-none";

export const label = "block text-sm font-medium text-foreground";

export const hint = "text-sm text-muted";

export const card =
  "rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(16,19,24,0.04)]";

export const tableWrap =
  "overflow-x-auto rounded-xl border border-border bg-surface";

export const table = "w-full border-collapse text-sm";

export const th =
  "whitespace-nowrap border-b border-border bg-surface-muted px-3 py-2.5 text-left text-xs font-semibold tracking-wide text-muted uppercase";

export const td = "border-b border-border/60 px-3 py-2.5 align-middle";

export const trHover = "transition-colors hover:bg-surface-hover";
