"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnPrimary, input, label } from "@/components/ui/styles";

// Ekran tanımı: docs/flows/web-common.md → "Ekran: Giriş"
function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const justClaimed = searchParams.get("claimed") === "1";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const isEmail = identifier.includes("@");

    const { error: authError } = await supabase.auth.signInWithPassword(
      isEmail
        ? { email: identifier, password }
        : { phone: identifier, password },
    );

    setLoading(false);

    if (authError) {
      setError("Giriş bilgileri hatalı. Lütfen tekrar deneyin.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(16,19,24,0.04)]"
      >
        <div>
          <h1 className="text-xl font-semibold">Giriş Yap</h1>
          <p className="text-sm text-muted">
            Dershane Öğrenci Takip Sistemi
          </p>
        </div>

        {justClaimed && (
          <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
            Hesabın doğrulandı. Şimdi giriş yapabilirsin.
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="identifier" className={label}>
            E-posta veya telefon
          </label>
          <input
            id="identifier"
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={input}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className={label}>
            Şifre
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
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
          {loading ? "Giriş yapılıyor..." : "Giriş yap"}
        </button>

        <a
          href="/forgot-password"
          className="block text-center text-sm text-muted hover:underline"
        >
          Şifremi unuttum
        </a>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
