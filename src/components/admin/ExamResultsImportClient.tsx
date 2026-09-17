"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { parseCsv } from "@/lib/import/parse-csv";
import {
  validateExamResultRow,
  markDuplicateRows,
  type ExamResultRowData,
  type StudentInfo,
} from "@/lib/import/exam-schema";
import type { RowResult } from "@/lib/import/types";
import { ImportPreviewTable } from "@/components/import/ImportPreviewTable";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { btnPrimary, btnSecondary, input, label } from "@/components/ui/styles";

type Exam = { id: string; name: string; exam_date: string };

export function ExamResultsImportClient({
  tenantId,
  exams,
  students,
  initialExamId,
}: {
  tenantId: string;
  exams: Exam[];
  students: StudentInfo[];
  initialExamId?: string;
}) {
  const router = useRouter();
  const [examId, setExamId] = useState(initialExamId ?? "");
  const [rows, setRows] = useState<RowResult<ExamResultRowData>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccessMessage(null);

    try {
      const parsed = await parseCsv(file);
      const validated = parsed.rows.map((raw, i) =>
        validateExamResultRow(i + 1, raw, students),
      );
      setRows(markDuplicateRows(validated));
      setFileName(file.name);
    } catch {
      setError("Dosya okunamadı. CSV formatında olduğundan emin ol.");
    }
    e.target.value = "";
  }

  // Aynı isimde birden fazla öğrenci varsa satır-içi seçim.
  function resolveRow(rowNumber: number, studentId: string) {
    setRows((prev) => {
      const next = prev.map((r) => {
        if (r.rowNumber !== rowNumber) return r;
        const rebuilt = validateExamResultRow(
          r.rowNumber,
          r.raw,
          students.filter((s) => s.id === studentId),
        );
        return rebuilt;
      });
      return markDuplicateRows(next);
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const payload = rows
      .filter((r) => r.status === "ok" && r.data)
      .map((r) => r.data!);

    if (payload.length === 0) {
      setSubmitting(false);
      setError("İçe aktarılacak geçerli satır yok.");
      return;
    }

    const res = await fetch("/api/admin/import/exam-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, mockExamId: examId, rows: payload }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "İçe aktarma başarısız oldu.");
      return;
    }

    setSuccessMessage(`${data.rowCount} sonuç satırı kaydedildi.`);
    setRows([]);
    setFileName(null);
    router.refresh();
  }

  const columns = [
    { key: "ad_soyad", label: "Ad Soyad" },
    { key: "sinif_adi", label: "Sınıf" },
    { key: "ders", label: "Ders" },
    { key: "dogru", label: "D" },
    { key: "yanlis", label: "Y" },
    { key: "bos", label: "B" },
    { key: "net", label: "Net" },
  ];

  const selectedExam = exams.find((e) => e.id === examId);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Nasıl çalışır"
          description="Üç adım — şablon boş bir format örneğidir, olduğu gibi yüklenmez."
        />
        <CardBody className="space-y-1.5 text-sm text-muted">
          <p>
            <strong className="text-foreground">1) Denemeyi seç</strong> —
            sonuçlar bir denemeye bağlanır. Deneme listede yoksa önce{" "}
            <Link href="/admin/exams/new" className="text-brand hover:underline">
              yeni deneme oluştur
            </Link>
            .
          </p>
          <p>
            <strong className="text-foreground">2) Şablonu doldur</strong> —
            optik okuyucudan gelen sonuçları şablonun sütunlarına aktar. Net
            değeri dosyadan olduğu gibi alınır, sistem yeniden hesaplamaz
            (ceza katsayısı sınav türüne göre değişiyor).
          </p>
          <p>
            <strong className="text-foreground">3) Yükle</strong> — önizlemede
            eşleşmeyen isimleri görürsün. Hatalı satır diğerlerini engellemez.
            Aynı dosyayı düzeltip tekrar yüklersen çift kayıt oluşmaz, üzerine
            yazılır.
          </p>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="exam" className={label}>
            Deneme
          </label>
          <select
            id="exam"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className={input}
          >
            <option value="">Deneme seç…</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {new Date(e.exam_date).toLocaleDateString("tr-TR")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <span className={label}>Sonuç dosyası</span>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-foreground"
            />
          </div>
          <a
            href="/templates/deneme-sonuc-sablon.csv"
            className="inline-block pt-1 text-sm text-brand hover:underline"
          >
            Şablonu indir (CSV)
          </a>
        </div>
      </div>

      {fileName && (
        <p className="text-sm text-muted">
          Yüklenen dosya: <span className="text-foreground">{fileName}</span>
        </p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      {successMessage && (
        <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          {successMessage}{" "}
          {selectedExam && (
            <Link
              href={`/admin/exams/${selectedExam.id}`}
              className="underline"
            >
              Deneme detayına git
            </Link>
          )}
        </p>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <ImportPreviewTable
            rows={rows}
            columns={columns}
            onResolve={resolveRow}
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !examId}
              className={btnPrimary}
            >
              {submitting ? "İçe aktarılıyor…" : "Onayla ve İçe Aktar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRows([]);
                setFileName(null);
              }}
              className={btnSecondary}
            >
              Vazgeç
            </button>
            {!examId && (
              <span className="text-sm text-warning">
                Önce bir deneme seç.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
