import { normalizeName, normalizeForMatch, isValidIsoDate } from "@/lib/import/validators";
import type { RowResult } from "@/lib/import/types";

export type ClassInfo = {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
};

export type StudentRowData = {
  fullName: string;
  classId: string;
  branchId: string;
  birthDate: string | null;
};

export type TeacherRowData = {
  fullName: string;
  classIds: string[];
};

function findClassMatches(
  className: string,
  branchName: string | null,
  classes: ClassInfo[],
): ClassInfo[] {
  const normClass = normalizeForMatch(className);
  let matches = classes.filter((c) => normalizeForMatch(c.name) === normClass);
  if (branchName) {
    const normBranch = normalizeForMatch(branchName);
    matches = matches.filter((c) => normalizeForMatch(c.branchName) === normBranch);
  }
  return matches;
}

export function validateStudentRow(
  rowNumber: number,
  raw: Record<string, string>,
  classes: ClassInfo[],
): RowResult<StudentRowData> {
  const errors: string[] = [];
  const fullName = normalizeName(raw.ad_soyad ?? "");
  if (!fullName) errors.push("ad_soyad boş olamaz");

  const rawClassName = (raw.sinif_adi ?? "").trim();
  if (!rawClassName) errors.push("sinif_adi boş olamaz");

  if (errors.length > 0) {
    return { rowNumber, raw, status: "error", errors };
  }

  const branchName = raw.sube_adi?.trim() || null;
  const matches = findClassMatches(rawClassName, branchName, classes);

  if (matches.length === 0) {
    return {
      rowNumber,
      raw,
      status: "error",
      errors: [`"${rawClassName}" adında sınıf bulunamadı`],
    };
  }

  if (matches.length > 1) {
    return {
      rowNumber,
      raw,
      status: "needs-review",
      errors: [`"${rawClassName}" birden fazla şubede var, hangisi olduğunu seç`],
      candidates: matches.map((m) => ({
        id: m.id,
        label: `${m.name} (${m.branchName})`,
      })),
    };
  }

  const rawBirthDate = raw.dogum_tarihi?.trim() || "";
  const birthDate = rawBirthDate && isValidIsoDate(rawBirthDate) ? rawBirthDate : null;

  return {
    rowNumber,
    raw,
    status: "ok",
    errors: [],
    data: {
      fullName,
      classId: matches[0].id,
      branchId: matches[0].branchId,
      birthDate,
    },
  };
}

export function validateTeacherRow(
  rowNumber: number,
  raw: Record<string, string>,
  classes: ClassInfo[],
): RowResult<TeacherRowData> {
  const errors: string[] = [];
  const fullName = normalizeName(raw.ad_soyad ?? "");
  if (!fullName) errors.push("ad_soyad boş olamaz");

  const classNames = (raw.sinif_adlari ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  if (classNames.length === 0) errors.push("sinif_adlari boş olamaz");

  if (errors.length > 0) {
    return { rowNumber, raw, status: "error", errors };
  }

  const classIds: string[] = [];
  for (const name of classNames) {
    const matches = findClassMatches(name, null, classes);
    if (matches.length === 0) {
      errors.push(`"${name}" adında sınıf bulunamadı`);
    } else if (matches.length > 1) {
      // Öğretmen satırında birden fazla sınıf olabildiği için tek bir
      // seçim kutusuyla belirsizlik çözmek karmaşıklaşıyor — bu durumda
      // dosyada şube adını da belirtmesini istiyoruz (satır hatalı sayılır).
      errors.push(
        `"${name}" birden fazla şubede var — sınıf adını şube ile birlikte benzersiz yap`,
      );
    } else {
      classIds.push(matches[0].id);
    }
  }

  if (errors.length > 0) {
    return { rowNumber, raw, status: "error", errors };
  }

  return { rowNumber, raw, status: "ok", errors: [], data: { fullName, classIds } };
}
