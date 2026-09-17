export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong px-6 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
