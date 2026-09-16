"use client";

import type { RowResult } from "@/lib/import/types";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  ok: { text: "✓ Geçerli", className: "text-green-600 dark:text-green-400" },
  error: { text: "✗ Hatalı", className: "text-red-600 dark:text-red-400" },
  "needs-review": {
    text: "? Belirsiz",
    className: "text-amber-600 dark:text-amber-400",
  },
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

  return (
    <div className="space-y-2">
      <p className="text-sm text-black/60 dark:text-white/60">
        {okCount} geçerli / {rows.length} toplam satır
      </p>
      <div className="overflow-x-auto rounded-md border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/[.02] text-left dark:border-white/10 dark:bg-white/[.03]">
              <th className="p-2">Durum</th>
              {columns.map((c) => (
                <th key={c.key} className="p-2">
                  {c.label}
                </th>
              ))}
              <th className="p-2">Not</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const status = STATUS_LABEL[r.status];
              return (
                <tr
                  key={r.rowNumber}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className={`p-2 whitespace-nowrap ${status.className}`}>
                    {status.text}
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="p-2">
                      {r.raw[c.key]}
                    </td>
                  ))}
                  <td className="p-2 text-black/60 dark:text-white/60">
                    {r.errors.join(", ")}
                    {r.status === "needs-review" && r.candidates && onResolve && (
                      <select
                        defaultValue=""
                        onChange={(e) => onResolve(r.rowNumber, e.target.value)}
                        className="ml-2 rounded-md border border-black/15 px-1 py-0.5 text-xs dark:border-white/15 dark:bg-transparent"
                      >
                        <option value="" disabled>
                          Seç
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
