"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function ClassForm({
  classId,
  tenantId,
  branches,
  initial,
}: {
  classId?: string;
  tenantId: string;
  branches: { id: string; name: string }[];
  initial?: { name: string; branch_id: string; academic_year: string };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [branchId, setBranchId] = useState(
    initial?.branch_id ?? branches[0]?.id ?? "",
  );
  const [academicYear, setAcademicYear] = useState(
    initial?.academic_year ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = classId ? `/api/admin/classes/${classId}` : "/api/admin/classes";
    const res = await fetch(url, {
      method: classId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        branchId,
        academicYear,
        tenantId,
      }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Bir şeyler ters gitti.");
      return;
    }

    router.push("/admin/classes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Sınıf adı (örn. 12-A)
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-transparent"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="branch" className="text-sm font-medium">
          Şube
        </label>
        <select
          id="branch"
          required
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="w-full rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-transparent"
        >
          {branches.length === 0 && <option value="">Önce şube ekle</option>}
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="academicYear" className="text-sm font-medium">
          Akademik yıl (örn. 2026-2027)
        </label>
        <input
          id="academicYear"
          type="text"
          required
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          className="w-full rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-transparent"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || branches.length === 0}
        className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {loading ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
