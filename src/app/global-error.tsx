"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="tr">
      <body>
        <div style={{ padding: 24, fontFamily: "sans-serif" }}>
          <h1>Bir şeyler ters gitti.</h1>
          <p>Sayfayı yenilemeyi dene. Sorun devam ederse bize ulaş.</p>
        </div>
      </body>
    </html>
  );
}
