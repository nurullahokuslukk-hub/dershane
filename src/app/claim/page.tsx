"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { btnPrimary, input, label } from "@/components/ui/styles";

// Ekran: hesap doğrulama (claim). Roster toplu yüklendiğinde üretilen kod +
// kişinin kendi e-posta/telefon + şifre ile ilk girişini tamamladığı ekran.
function ClaimForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, identifier, password }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Bir şeyler ters gitti.");
      return;
    }

    router.replace("/login?claimed=1");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(16,19,24,0.04)]"
      >
        <div>
          <h1 className="text-xl font-semibold">Hesabını Doğrula</h1>
          <p className="text-sm text-muted">
            Dershanenden aldığın kodu gir, e-posta veya telefon numaranla bir
            şifre belirle.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="code" className={label}>
            Kod
          </label>
          <input
            id="code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={input}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="identifier" className={label}>
            E-posta veya telefon
          </label>
          <input
            id="identifier"
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={input}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className={label}>
            Şifre belirle
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`${btnPrimary} w-full`}
        >
          {loading ? "Doğrulanıyor..." : "Hesabımı doğrula"}
        </button>
      </form>
    </main>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={null}>
      <ClaimForm />
    </Suspense>
  );
}
