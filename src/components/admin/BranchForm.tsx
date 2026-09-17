"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, input, label } from "@/components/ui/styles";

export function BranchForm({
  branchId,
  tenantId,
  initial,
}: {
  branchId?: string;
  tenantId: string;
  initial?: { name: string; address: string | null };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = branchId
      ? `/api/admin/branches/${branchId}`
      : "/api/admin/branches";
    const res = await fetch(url, {
      method: branchId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address: address || null, tenantId }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Bir şeyler ters gitti.");
      return;
    }

    router.push("/admin/branches");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className={label}>
          Şube adı
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
        <label htmlFor="address" className={label}>
          Adres (opsiyonel)
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={input}
        />
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
