"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Ekran tanımı: docs/flows/web-common.md → "Ekran: Giriş"
export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        className="w-full max-w-sm space-y-4 rounded-lg border border-black/10 p-6 dark:border-white/10"
      >
        <div>
          <h1 className="text-xl font-semibold">Giriş Yap</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Dershane Öğrenci Takip Sistemi
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="identifier" className="text-sm font-medium">
            E-posta veya telefon
          </label>
          <input
            id="identifier"
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-transparent"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-transparent"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loading ? "Giriş yapılıyor..." : "Giriş yap"}
        </button>

        <a
          href="/forgot-password"
          className="block text-center text-sm text-black/60 hover:underline dark:text-white/60"
        >
          Şifremi unuttum
        </a>
      </form>
    </main>
  );
}
