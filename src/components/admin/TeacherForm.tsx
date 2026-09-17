"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, input, label } from "@/components/ui/styles";

export function TeacherForm({
  teacherId,
  tenantId,
  classes,
  initial,
}: {
  teacherId?: string;
  tenantId: string;
  classes: { id: string; name: string }[];
  initial?: { full_name: string; classIds: string[] };
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
    initial?.classIds ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleClass(id: string) {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = teacherId
      ? `/api/admin/teachers/${teacherId}/assignments`
      : "/api/admin/teachers";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, classIds: selectedClassIds, tenantId }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Bir şeyler ters gitti.");
      return;
    }

    router.push("/admin/teachers");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div className="space-y-1">
        <label htmlFor="fullName" className={label}>
          Ad soyad
        </label>
        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={input}
        />
      </div>

      <div className="space-y-1">
        <span className={label}>Sınıflar</span>
        {classes.length === 0 && (
          <p className="text-sm text-muted">
            Önce sınıf oluşturman gerekiyor.
          </p>
        )}
        <div className="space-y-1">
          {classes.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedClassIds.includes(c.id)}
                onChange={() => toggleClass(c.id)}
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className={btnPrimary}
      >
        {loading ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
