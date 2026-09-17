import assert from "node:assert/strict";
import { test } from "node:test";
import {
  markDuplicateRows,
  parseDecimal,
  validateExamResultRow,
  type ExamResultRowData,
  type StudentInfo,
} from "@/lib/import/exam-schema";
import type { RowResult } from "@/lib/import/types";

const students: StudentInfo[] = [
  { id: "s1", fullName: "Ayşe Yılmaz", className: "12-A", branchName: "Merkez" },
  { id: "s2", fullName: "Ayşe Yılmaz", className: "12-B", branchName: "Merkez" },
  { id: "s3", fullName: "Mehmet Kaya", className: "12-A", branchName: "Merkez" },
];

const base = {
  ad_soyad: "Mehmet Kaya",
  sinif_adi: "12-A",
  ders: "Matematik",
  dogru: "25",
  yanlis: "10",
  bos: "5",
  net: "22.5",
};

test("geçerli satır ok döner ve alanlar doğru dönüştürülür", () => {
  const r = validateExamResultRow(1, base, students);
  assert.equal(r.status, "ok");
  assert.deepEqual(r.data, {
    studentId: "s3",
    subject: "Matematik",
    correct: 25,
    wrong: 10,
    blank: 5,
    net: 22.5,
  });
});

test("Türkçe Excel'den gelen virgüllü ondalık kabul edilir", () => {
  assert.equal(parseDecimal("22,50"), 22.5);
  assert.equal(parseDecimal("22.50"), 22.5);
  assert.equal(parseDecimal(""), null);
  assert.equal(parseDecimal("abc"), null);
  const r = validateExamResultRow(1, { ...base, net: "22,50" }, students);
  assert.equal(r.status, "ok");
  assert.equal(r.data?.net, 22.5);
});

test("boş sayaç alanları 0 sayılır ama net zorunlu", () => {
  const ok = validateExamResultRow(
    1,
    { ...base, dogru: "", yanlis: "", bos: "" },
    students,
  );
  assert.equal(ok.status, "ok");
  assert.equal(ok.data?.correct, 0);

  const missingNet = validateExamResultRow(1, { ...base, net: "" }, students);
  assert.equal(missingNet.status, "error");
  assert.match(missingNet.errors.join(" "), /net/);
});

test("negatif veya ondalıklı doğru sayısı hata verir", () => {
  const r = validateExamResultRow(1, { ...base, dogru: "-3" }, students);
  assert.equal(r.status, "error");
});

test("eşleşmeyen isim hata, çift isim satır-içi seçim ister", () => {
  const notFound = validateExamResultRow(
    1,
    { ...base, ad_soyad: "Olmayan Kişi" },
    students,
  );
  assert.equal(notFound.status, "error");

  // sinif_adi verilmezse iki "Ayşe Yılmaz" ayrışamaz → needs-review
  const ambiguous = validateExamResultRow(
    1,
    { ...base, ad_soyad: "Ayşe Yılmaz", sinif_adi: "" },
    students,
  );
  assert.equal(ambiguous.status, "needs-review");
  assert.equal(ambiguous.candidates?.length, 2);
});

test("sinif_adi verilirse aynı isimli öğrenciler ayrışır", () => {
  const r = validateExamResultRow(
    1,
    { ...base, ad_soyad: "Ayşe Yılmaz", sinif_adi: "12-B" },
    students,
  );
  assert.equal(r.status, "ok");
  assert.equal(r.data?.studentId, "s2");
});

test("sınıf adı yanlış yazılmışsa daraltma uygulanmaz, belirsizlik korunur", () => {
  const r = validateExamResultRow(
    1,
    { ...base, ad_soyad: "Ayşe Yılmaz", sinif_adi: "12-Z" },
    students,
  );
  assert.equal(r.status, "needs-review");
});

test("aynı dosyadaki tekrar eden öğrenci+ders satırı hata olarak işaretlenir", () => {
  const rows: RowResult<ExamResultRowData>[] = [
    validateExamResultRow(1, base, students),
    validateExamResultRow(2, base, students),
    validateExamResultRow(3, { ...base, ders: "Türkçe" }, students),
  ];
  const marked = markDuplicateRows(rows);
  assert.equal(marked[0].status, "ok");
  assert.equal(marked[1].status, "error");
  assert.match(marked[1].errors.join(" "), /1\. satırda zaten var/);
  assert.equal(marked[2].status, "ok");
});
