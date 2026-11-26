import { NextResponse } from 'next/server';

import { verifyOwner } from '@/lib/costs/sources';
import { readDays } from '@/lib/today/sources';
import { buildDaily, DAILY_APPS } from '@/lib/today/summary';

export const dynamic = 'force-dynamic';

// Short cache: the page is opened right after logging in an app.
const TTL_MS = 60_000;
let cache: { at: number; body: unknown } | null = null;

export async function GET(req: Request) {
  if (!(await verifyOwner(req.headers.get('authorization')))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const now = Date.now();
  const fresh = new URL(req.url).searchParams.has('fresh');
  if (!fresh && cache && now - cache.at < TTL_MS) return NextResponse.json(cache.body);

  const input = await Promise.all(DAILY_APPS.map((app) => readDays(app, now)));
  const body = buildDaily(input, now);
  cache = { at: now, body };
  return NextResponse.json(body);
}
