"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, input, label } from "@/components/ui/styles";

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
        <label htmlFor="name" className={label}>
          Sınıf adı (örn. 12-A)
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={input}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="branch" className={label}>
          Şube
        </label>
        <select
          id="branch"
          required
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className={input}
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
        <label htmlFor="academicYear" className={label}>
          Akademik yıl (örn. 2026-2027)
        </label>
        <input
          id="academicYear"
          type="text"
          required
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          className={input}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading || branches.length === 0}
        className={btnPrimary}
      >
        {loading ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
