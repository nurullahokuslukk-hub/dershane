import Link from "next/link";
import { btnXs } from "@/components/ui/styles";

// Sunucu taraflı sayfalama — listeler yüz binlerce satıra çıkabileceği için
// tüm kayıtları tek seferde çekmiyoruz (bkz. .range() kullanan sayfalar).
export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage <= 1) return null;

  const href = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value) search.set(key, value);
    }
    if (target > 1) search.set("page", String(target));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">
        {from}–{to} / {total} kayıt
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={btnXs}>
            ← Önceki
          </Link>
        ) : (
          <span className={`${btnXs} pointer-events-none opacity-40`}>
            ← Önceki
          </span>
        )}
        <span className="text-xs text-muted">
          Sayfa {page} / {lastPage}
        </span>
        {page < lastPage ? (
          <Link href={href(page + 1)} className={btnXs}>
            Sonraki →
          </Link>
        ) : (
          <span className={`${btnXs} pointer-events-none opacity-40`}>
            Sonraki →
          </span>
        )}
      </div>
    </div>
  );
}
