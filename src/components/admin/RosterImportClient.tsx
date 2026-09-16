"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import { parseCsv } from "@/lib/import/parse-csv";
import {
  validateStudentRow,
  validateTeacherRow,
  type ClassInfo,
  type StudentRowData,
  type TeacherRowData,
} from "@/lib/import/roster-schema";
import type { RowResult } from "@/lib/import/types";
import { ImportPreviewTable } from "@/components/import/ImportPreviewTable";

type Mode = "ogrenci" | "ogretmen";

export function RosterImportClient({
  tenantId,
  classes,
}: {
  tenantId: string;
  classes: ClassInfo[];
}) {
  const [mode, setMode] = useState<Mode>("ogrenci");
  const [studentRows, setStudentRows] = useState<RowResult<StudentRowData>[]>(
    [],
  );
  const [teacherRows, setTeacherRows] = useState<RowResult<TeacherRowData>[]>(
    [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function resetRows() {
    setStudentRows([]);
    setTeacherRows([]);
    setError(null);
    setSuccessMessage(null);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccessMessage(null);

    try {
      const { rows } = await parseCsv(file);
      if (mode === "ogrenci") {
        setStudentRows(
          rows.map((raw, i) => validateStudentRow(i + 1, raw, classes)),
        );
      } else {
        setTeacherRows(
          rows.map((raw, i) => validateTeacherRow(i + 1, raw, classes)),
        );
      }
    } catch {
      setError("Dosya okunamadı. CSV formatında olduğundan emin ol.");
    }
    e.target.value = "";
  }

  function resolveStudentRow(rowNumber: number, classId: string) {
    const chosenClass = classes.find((c) => c.id === classId);
    if (!chosenClass) return;
    setStudentRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber !== rowNumber) return r;
        const fullName = r.raw.ad_soyad?.trim() ?? "";
        const birthDate = r.raw.dogum_tarihi?.trim() || null;
        return {
          ...r,
          status: "ok",
          errors: [],
          candidates: undefined,
          data: { fullName, classId, branchId: chosenClass.branchId, birthDate },
        };
      }),
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const rows: (StudentRowData | TeacherRowData)[] =
      mode === "ogrenci"
        ? studentRows
            .filter((r) => r.status === "ok" && r.data)
            .map((r) => r.data!)
        : teacherRows
            .filter((r) => r.status === "ok" && r.data)
            .map((r) => r.data!);

    if (rows.length === 0) {
      setSubmitting(false);
      setError("İçe aktarılacak geçerli satır yok.");
      return;
    }

    const res = await fetch("/api/admin/import/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, kind: mode, rows }),
    });
    const data = await res.json();

    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "İçe aktarma başarısız oldu.");
      return;
    }

    setSuccessMessage(`${data.createdCount} kayıt oluşturuldu.`);
    resetRows();
  }

  const columns =
    mode === "ogrenci"
      ? [
          { key: "ad_soyad", label: "Ad Soyad" },
          { key: "sube_adi", label: "Şube" },
          { key: "sinif_adi", label: "Sınıf" },
          { key: "dogum_tarihi", label: "Doğum Tarihi" },
        ]
      : [
          { key: "ad_soyad", label: "Ad Soyad" },
          { key: "sinif_adlari", label: "Sınıflar" },
        ];

  const activeRowCount = mode === "ogrenci" ? studentRows.length : teacherRows.length;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-lg font-semibold">Roster Toplu İçe Aktar</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Dershaneden gelen öğrenci/öğretmen listesini CSV şablonuna aktar, tek
        seferde yükle. Hatalı satırlar diğerlerini engellemez — düzeltip
        yeniden yükleyebilirsin.
      </p>

      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => {
            setMode("ogrenci");
            resetRows();
          }}
          className={`rounded-md border px-3 py-1.5 ${
            mode === "ogrenci"
              ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
              : "border-black/15 dark:border-white/15"
          }`}
        >
          Öğrenci
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("ogretmen");
            resetRows();
          }}
          className={`rounded-md border px-3 py-1.5 ${
            mode === "ogretmen"
              ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
              : "border-black/15 dark:border-white/15"
          }`}
        >
          Öğretmen
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <a
          href={
            mode === "ogrenci"
              ? "/templates/roster-ogrenci-sablon.csv"
              : "/templates/roster-ogretmen-sablon.csv"
          }
          className="text-black/70 underline dark:text-white/70"
        >
          Şablonu indir ({mode === "ogrenci" ? "öğrenci" : "öğretmen"})
        </a>
        <div>
          <input type="file" accept=".csv" onChange={handleFileChange} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMessage && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          {successMessage} Doğrulama kodlarını{" "}
          <Link href="/admin/unclaimed" className="underline">
            Doğrulanmamış Hesaplar
          </Link>{" "}
          ekranından görebilirsin.
        </p>
      )}

      {activeRowCount > 0 && (
        <div className="space-y-4">
          {mode === "ogrenci" ? (
            <ImportPreviewTable
              rows={studentRows}
              columns={columns}
              onResolve={resolveStudentRow}
            />
          ) : (
            <ImportPreviewTable rows={teacherRows} columns={columns} />
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {submitting ? "İçe aktarılıyor..." : "Onayla ve İçe Aktar"}
          </button>
        </div>
      )}
    </div>
  );
}
