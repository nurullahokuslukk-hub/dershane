export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted",
  brand: "bg-brand-soft text-brand-soft-fg",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
