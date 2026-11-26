import { NextResponse } from 'next/server';

import { readAiUsage, readBilling, verifyOwner } from '@/lib/costs/sources';
import { summarize } from '@/lib/costs/summary';

export const dynamic = 'force-dynamic';

// Billing export lags by hours, so one fresh read per hour is plenty.
const TTL_MS = 3_600_000;
let cache: { at: number; body: unknown } | null = null;

export async function GET(req: Request) {
  if (!(await verifyOwner(req.headers.get('authorization')))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const fresh = new URL(req.url).searchParams.has('fresh');
  const now = Date.now();
  if (!fresh && cache && now - cache.at < TTL_MS) return NextResponse.json(cache.body);

  try {
    const [billing, ai] = await Promise.all([readBilling(now), readAiUsage()]);
    const summary = summarize({
      rows: billing.rows,
      usage: ai.usage,
      now,
      budget: Number(process.env.COSTS_BUDGET_VND) || 0,
    });
    // The export fills in old days first; until it reaches this month, say how far it got.
    const loadedThrough = billing.rows.reduce<string | null>((m, r) => (m === null || r.day > m ? r.day : m), null);
    const body = { summary, billingReady: billing.ready, loadedThrough, failedApps: ai.failed, fetchedAt: now };
    cache = { at: now, body };
    return NextResponse.json(body);
  } catch (err) {
    console.error('[costs]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'read failed' }, { status: 500 });
  }
}
