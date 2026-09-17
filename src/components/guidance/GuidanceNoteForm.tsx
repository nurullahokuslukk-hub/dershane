"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, input, label } from "@/components/ui/styles";

type Kind = "note" | "session";

// Ekran: web-rehberlik.md → "Rehberlik Notu Ekle" / "Rehberlik Görüşmesi Ekle".
// İki ekran yerine tek form: pratikte rehberlik "hızlı not" ile "formal
// görüşme" arasında gidip geliyor, ayrı sayfalara bölmek gereksiz tıklama.
export function GuidanceNoteForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("note");
  const [text, setText] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    setLoading(true);

    const res = await fetch("/api/rehberlik/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, kind, text, nextStep }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Kaydedilemedi.");
      return;
    }

    setText("");
    setNextStep("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <TypeButton
          active={kind === "note"}
          onClick={() => setKind("note")}
          label="Hızlı not"
        />
        <TypeButton
          active={kind === "session"}
          onClick={() => setKind("session")}
          label="Görüşme kaydı"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="text" className={label}>
          {kind === "note" ? "Not" : "Görüşme özeti"}
        </label>
        <textarea
          id="text"
          rows={3}
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            kind === "note"
              ? "Kısa bir gözlem…"
              : "Ne konuşuldu, öğrenci ne dedi…"
          }
          className={input}
        />
      </div>

      {kind === "session" && (
        <div className="space-y-1">
          <label htmlFor="nextStep" className={label}>
            Sonraki adım (opsiyonel)
          </label>
          <input
            id="nextStep"
            type="text"
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            placeholder="Örn. iki hafta sonra tekrar görüşülecek"
            className={input}
          />
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" disabled={loading} className={btnPrimary}>
        {loading ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}

function TypeButton({
  active,
  onClick,
  label: text,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-brand bg-brand-soft font-medium text-brand-soft-fg"
          : "border-border text-muted hover:bg-surface-hover"
      }`}
    >
      {text}
    </button>
  );
}
