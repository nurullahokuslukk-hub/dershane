"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnXs } from "@/components/ui/styles";

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
        className={btnXs}
      >
        {copied ? "Kopyalandı" : "Kodu kopyala"}
      </button>
      <button
        type="button"
        onClick={handleRenew}
        disabled={loading}
        className={btnXs}
      >
        {loading ? "..." : "Kodu yenile"}
      </button>
    </span>
  );
}
