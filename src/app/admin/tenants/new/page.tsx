"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, input, label } from "@/components/ui/styles";

function slugify(name: string) {
  return name
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewTenantPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slugify(name) }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Bir şeyler ters gitti.");
      return;
    }

    router.push("/admin/tenants");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Yeni Dershane</h1>

      <div className="space-y-1">
        <label htmlFor="name" className={label}>
          Dershane adı
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={input}
        />
        {name && (
          <p className="text-xs text-muted">
            Slug: {slugify(name)}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className={btnPrimary}
      >
        {loading ? "Oluşturuluyor..." : "Oluştur"}
      </button>
    </form>
  );
}
