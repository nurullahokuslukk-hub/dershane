import { card } from "@/components/ui/styles";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${card} ${className}`}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`px-4 py-3 ${className}`}>{children}</div>;
}
