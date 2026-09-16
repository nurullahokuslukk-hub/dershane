import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
};

// SENTRY_DSN boşsa Sentry sessizce hiçbir şey göndermez (bkz.
// instrumentation.ts/instrumentation-client.ts) — hesap açılana kadar
// uygulama normal çalışmaya devam eder.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
