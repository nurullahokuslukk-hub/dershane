import Papa from "papaparse";

// Client-side CSV parse — dosya önizleme onaylanmadan sunucuya gönderilmez.
// Not: .xlsx desteği bilinçli olarak eklenmedi — npm'deki güncel `xlsx`
// (SheetJS) paketinde düzeltilmemiş yüksek önemli güvenlik açıkları var
// (bkz. STATE.md 2026-09-16). Şablonlar CSV; Excel'den "Farklı Kaydet → CSV"
// tek adım.
export function parseCsv(
  file: File,
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        resolve({
          headers: results.meta.fields ?? [],
          rows: results.data,
        });
      },
      error: (err: Error) => reject(err),
    });
  });
}
