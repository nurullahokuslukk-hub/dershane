"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

// Ekran tanımı: docs/flows/web-common.md → "Ekran: Şifremi Unuttum"
// Not: yalnızca e-posta destekler; telefon-only kullanıcılar dershane
// admin'den şifre sıfırlama ister (bkz. decisions/0001-auth-yontemi.md).
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
    );

    if (resetError) {
      setError("Bir şeyler ters gitti, lütfen tekrar deneyin.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-center">
        <p>
          E-postana bir sıfırlama linki gönderdik. Gelmezse spam klasörünü
          kontrol et.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-black/10 p-6 dark:border-white/10"
      >
        <div>
          <h1 className="text-xl font-semibold">Şifremi Unuttum</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Telefon numarasıyla kayıtlıysan dershane yönetiminden şifre
            sıfırlama iste.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            E-posta
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-black/15 px-3 py-2 dark:border-white/15 dark:bg-transparent"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-md bg-black px-3 py-2 text-white dark:bg-white dark:text-black"
        >
          Sıfırlama linki gönder
        </button>
      </form>
    </main>
  );
}
