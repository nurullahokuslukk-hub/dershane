"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, input, label } from "@/components/ui/styles";

export function ExamForm({
  tenantId,
  redirectTo = "/admin/exams",
}: {
  tenantId: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examType, setExamType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/mock-exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, name, examDate, examType }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Bir şeyler ters gitti.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className={label}>
          Deneme adı
        </label>
        <input
          id="name"
          type="text"
          required
          placeholder="Örn. 3. TYT Denemesi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={input}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="examDate" className={label}>
          Sınav tarihi
        </label>
        <input
          id="examDate"
          type="date"
          required
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className={input}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="examType" className={label}>
          Tür (opsiyonel)
        </label>
        <input
          id="examType"
          type="text"
          placeholder="TYT / AYT / LGS…"
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
          className={input}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "Kaydediliyor…" : "Denemeyi Oluştur"}
      </button>
    </form>
  );
}
