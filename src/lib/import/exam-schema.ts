import { normalizeName, normalizeForMatch } from "@/lib/import/validators";
import type { RowResult } from "@/lib/import/types";

export type StudentInfo = {
  /** student_profile.id — sonuç satırları buna bağlanıyor. */
  id: string;
  fullName: string;
  className: string;
  branchName: string;
};

export type ExamResultRowData = {
  studentId: string;
  subject: string;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
};

// Türkçe Excel'de ondalık ayırıcı virgül ("12,5"), CSV'ye öyle iniyor.
// Binlik ayırıcı bu ölçekte (en fazla iki haneli net) gerçekçi olmadığı için
// nokta da ondalık kabul ediliyor.
export function parseDecimal(raw: string): number | null {
  const cleaned = raw.trim().replace(",", ".");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function parseCount(raw: string | undefined): number | null {
  const cleaned = (raw ?? "").trim();
  if (cleaned === "") return 0;
  const value = Number(cleaned);
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
}

function findStudentMatches(
  fullName: string,
  className: string | null,
  students: StudentInfo[],
): StudentInfo[] {
  const normName = normalizeForMatch(fullName);
  let matches = students.filter((s) => normalizeForMatch(s.fullName) === normName);
  if (className && matches.length > 1) {
    const normClass = normalizeForMatch(className);
    const narrowed = matches.filter(
      (s) => normalizeForMatch(s.className) === normClass,
    );
    // Sınıf adı yazım hatalıysa hiç eşleşme kalmasın istemiyoruz — daraltma
    // yalnızca işe yaradığında uygulanıyor.
    if (narrowed.length > 0) matches = narrowed;
  }
  return matches;
}

export function validateExamResultRow(
  rowNumber: number,
  raw: Record<string, string>,
  students: StudentInfo[],
): RowResult<ExamResultRowData> {
  const errors: string[] = [];

  const fullName = normalizeName(raw.ad_soyad ?? "");
  if (!fullName) errors.push("ad_soyad boş olamaz");

  const subject = normalizeName(raw.ders ?? "");
  if (!subject) errors.push("ders boş olamaz");

  const correct = parseCount(raw.dogru);
  if (correct === null) errors.push("dogru sayı olmalı (0 veya daha büyük)");
  const wrong = parseCount(raw.yanlis);
  if (wrong === null) errors.push("yanlis sayı olmalı (0 veya daha büyük)");
  const blank = parseCount(raw.bos);
  if (blank === null) errors.push("bos sayı olmalı (0 veya daha büyük)");

  const net = parseDecimal(raw.net ?? "");
  if (net === null) errors.push("net boş olamaz ve sayı olmalı");

  if (errors.length > 0) {
    return { rowNumber, raw, status: "error", errors };
  }

  const className = raw.sinif_adi?.trim() || null;
  const matches = findStudentMatches(fullName, className, students);

  if (matches.length === 0) {
    return {
      rowNumber,
      raw,
      status: "error",
      errors: [`"${fullName}" adında öğrenci bulunamadı`],
    };
  }

  if (matches.length > 1) {
    return {
      rowNumber,
      raw,
      status: "needs-review",
      errors: [`"${fullName}" adında birden fazla öğrenci var, hangisi olduğunu seç`],
      candidates: matches.map((m) => ({
        id: m.id,
        label: `${m.fullName} (${m.className}${m.branchName ? ` — ${m.branchName}` : ""})`,
      })),
    };
  }

  return {
    rowNumber,
    raw,
    status: "ok",
    errors: [],
    data: {
      studentId: matches[0].id,
      subject,
      correct: correct!,
      wrong: wrong!,
      blank: blank!,
      net: net!,
    },
  };
}

// Aynı dosyada aynı (öğrenci, ders) ikilisi iki kez varsa upsert sessizce
// birini eziyor — kullanıcı bunu önizlemede görmeli.
export function markDuplicateRows(
  rows: RowResult<ExamResultRowData>[],
): RowResult<ExamResultRowData>[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    if (row.status !== "ok" || !row.data) return row;
    const key = `${row.data.studentId}::${normalizeForMatch(row.data.subject)}`;
    const firstRow = seen.get(key);
    if (firstRow === undefined) {
      seen.set(key, row.rowNumber);
      return row;
    }
    return {
      ...row,
      status: "error",
      errors: [`bu öğrenci + ders ikilisi ${firstRow}. satırda zaten var`],
    };
  });
}
