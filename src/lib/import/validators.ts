export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

// Türkçe büyük/küçük harf kurallarına göre karşılaştırma (İ/I, ı/i vb.)
export function normalizeForMatch(value: string): string {
  return normalizeName(value).toLocaleLowerCase("tr");
}

export function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}
