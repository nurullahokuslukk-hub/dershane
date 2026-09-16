import * as Sentry from "@sentry/nextjs";

// NEXT_PUBLIC_SENTRY_DSN boşsa Sentry.init sessizce no-op olur — hesap
// açılmadan önce (bkz. docs/guides/supabase-vercel-kurulum.md) uygulama
// normal çalışır, sadece hata izleme pasif kalır.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
