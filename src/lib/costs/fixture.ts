// Sample data shaped like November 2026, for the dev-only /costs/preview page.

import { summarize, type AppUsage, type BillRow } from './summary';

const GEMINI: Record<number, number> = {
  7: 30, 8: 5, 9: 6, 10: 2, 12: 3, 13: 2, 14: 25, 15: 20, 16: 27, 17: 20, 18: 5, 19: 25, 20: 7, 21: 8, 22: 1.5, 23: 3, 24: 1.5, 25: 25,
};

function rows(): BillRow[] {
  const out: BillRow[] = [];
  const add = (day: string, service: string, net: number, project = 'gen-lang-client-0354803233', sku = 'Generate content input token count') =>
    out.push({ day, service, project, sku, net, rate: 26300 });
  for (let d = 1; d <= 25; d++) {
    const day = `2026-11-${String(d).padStart(2, '0')}`;
    if (GEMINI[d]) add(day, 'Gemini API', GEMINI[d] * 1000);
    if (d >= 7) {
      add(day, 'Secret Manager', 230, 'kyphan38-hodi-app', 'Secret version replica storage');
      add(day, 'Cloud Scheduler', 190, 'kyphan38-navi-app', 'Jobs');
      add(day, 'Cloud Storage', 110, 'kyphan38-mora-app', 'Standard Storage Singapore');
    }
  }
  add('2026-11-12', 'Cloud Storage', 9000, 'kyphan38-mora-app', 'Download Worldwide Destinations');
  add('2026-11-13', 'Cloud Storage', 8500, 'kyphan38-mora-app', 'Download Worldwide Destinations');
  for (let d = 1; d <= 31; d++) add(`2026-10-${String(d).padStart(2, '0')}`, d % 2 ? 'Gemini API' : 'Cloud Scheduler', 1400);
  const past = { '2026-06': 18000, '2026-07': 22000, '2026-08': 25000, '2026-09': 31000 };
  for (const [m, v] of Object.entries(past)) add(`${m}-15`, 'Gemini API', v);
  return out;
}

const USAGE: AppUsage[] = [
  { app: 'navi', month: '2026-11', usd: 0.24, calls: 7 },
  { app: 'noda', month: '2026-11', usd: 0.11, calls: 18 },
  { app: 'cogi', month: '2026-11', usd: 0.06, calls: 3 },
  { app: 'hodi', month: '2026-11', usd: 0.05, calls: 17 },
  { app: 'logi', month: '2026-11', usd: 0.01, calls: 1 },
];

export function previewData() {
  const now = Date.UTC(2026, 10, 26, 3);
  return {
    summary: summarize({ rows: rows(), usage: USAGE, now, budget: 500000 }),
    billingReady: true,
    failedApps: [],
    fetchedAt: now,
  };
}
