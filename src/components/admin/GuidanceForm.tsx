"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type ClassWithStudents = {
  id: string;
  name: string;
  students: { id: string; full_name: string }[];
};

export function GuidanceForm({
  guidanceId,
  tenantId,
  classes,
  initial,
}: {
  guidanceId?: string;
  tenantId: string;
  classes: ClassWithStudents[];
  initial?: { full_name: string; studentIds: string[] };
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    initial?.studentIds ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleStudent(id: string) {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function toggleClass(classGroup: ClassWithStudents) {
    const ids = classGroup.students.map((s) => s.id);
    const allSelected = ids.every((id) => selectedStudentIds.includes(id));
    setSelectedStudentIds((prev) =>
      allSelected
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = guidanceId
      ? `/api/admin/guidance/${guidanceId}/assignments`
      : "/api/admin/guidance";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        studentIds: selectedStudentIds,
        tenantId,
      }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Bir şeyler ters gitti.");
      return;
    }

    router.push("/admin/guidance");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div className="space-y-1">
        <label htmlFor="fullName" className="text-sm font-medium">
          Ad soyad
        </label>
        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-transparent"
        />
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium">Atanacak öğrenciler</span>
        {classes.length === 0 && (
          <p className="text-sm text-black/50 dark:text-white/50">
            Henüz öğrenci yok.
          </p>
        )}
        {classes.map((c) => (
          <div key={c.id} className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={c.students.every((s) =>
                  selectedStudentIds.includes(s.id),
                ) && c.students.length > 0}
                onChange={() => toggleClass(c)}
              />
              {c.name} (tümü)
            </label>
            <div className="ml-6 space-y-1">
              {c.students.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                  />
                  {s.full_name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {loading ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
