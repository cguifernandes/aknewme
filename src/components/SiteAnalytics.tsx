"use client";

import { Analytics } from "@vercel/analytics/next";
import { isInternal } from "@/lib/metrics";

/** Vercel Analytics, sem contar o navegador interno (o do dono do site; ver src/lib/metrics.ts). */
export default function SiteAnalytics() {
  return <Analytics beforeSend={(event) => (isInternal() ? null : event)} />;
}
