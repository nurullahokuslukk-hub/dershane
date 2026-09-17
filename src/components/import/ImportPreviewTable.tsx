"use client";

import type { RowResult } from "@/lib/import/types";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { input, table, tableWrap, td, th } from "@/components/ui/styles";

const STATUS: Record<string, { text: string; tone: BadgeTone }> = {
  ok: { text: "Geçerli", tone: "success" },
  error: { text: "Hatalı", tone: "danger" },
  "needs-review": { text: "Belirsiz", tone: "warning" },
};

export function ImportPreviewTable<T>({
  rows,
  columns,
  onResolve,
}: {
  rows: RowResult<T>[];
  columns: { key: string; label: string }[];
  onResolve?: (rowNumber: number, candidateId: string) => void;
}) {
  const okCount = rows.filter((r) => r.status === "ok").length;
  const reviewCount = rows.filter((r) => r.status === "needs-review").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge tone="success">{okCount} geçerli</Badge>
        {reviewCount > 0 && <Badge tone="warning">{reviewCount} belirsiz</Badge>}
        {errorCount > 0 && <Badge tone="danger">{errorCount} hatalı</Badge>}
        <span className="text-muted">/ {rows.length} satır</span>
        {errorCount > 0 && (
          <span className="text-xs text-muted">
            Hatalı satırlar diğerlerini engellemez — yalnızca geçerli olanlar
            aktarılır.
          </span>
        )}
      </div>

      <div className={tableWrap}>
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>#</th>
              <th className={th}>Durum</th>
              {columns.map((c) => (
                <th key={c.key} className={th}>
                  {c.label}
                </th>
              ))}
              <th className={th}>Not</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const status = STATUS[r.status];
              return (
                <tr
                  key={r.rowNumber}
                  className={
                    r.status === "error"
                      ? "bg-danger-soft/40"
                      : r.status === "needs-review"
                        ? "bg-warning-soft/40"
                        : undefined
                  }
                >
                  <td className={`${td} text-xs text-muted tabular-nums`}>
                    {r.rowNumber}
                  </td>
                  <td className={td}>
                    <Badge tone={status.tone}>{status.text}</Badge>
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className={td}>
                      {r.raw[c.key]}
                    </td>
                  ))}
                  <td className={`${td} text-muted`}>
                    {r.errors.join(", ")}
                    {r.status === "needs-review" &&
                      r.candidates &&
                      onResolve && (
                        <select
                          defaultValue=""
                          onChange={(e) => onResolve(r.rowNumber, e.target.value)}
                          className={`${input} mt-1 max-w-xs py-1 text-xs`}
                        >
                          <option value="" disabled>
                            Seç…
                          </option>
                          {r.candidates.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
