"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UnclaimedRowActions({
  accountId,
  code,
}: {
  accountId: string;
  code: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleRenew() {
    setLoading(true);
    await fetch(`/api/admin/unclaimed/${accountId}/renew`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-md border border-black/15 px-2 py-0.5 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
      >
        {copied ? "Kopyalandı" : "Kodu kopyala"}
      </button>
      <button
        type="button"
        onClick={handleRenew}
        disabled={loading}
        className="rounded-md border border-black/15 px-2 py-0.5 text-xs hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/5"
      >
        {loading ? "..." : "Kodu yenile"}
      </button>
    </span>
  );
}
