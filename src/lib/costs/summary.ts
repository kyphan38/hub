// Pure cost math for the /costs page. No I/O: the API route feeds it rows.

/** One billing export row, summed per day, service, project and SKU. Net = cost + credits, in VND. */
export type BillRow = {
  day: string; // YYYY-MM-DD, Vietnam time
  service: string;
  project: string;
  sku: string;
  net: number;
  rate: number; // VND per USD for that row
  topup?: boolean; // prepaid wallet top-up: money in, not money spent
};

/** One aiUsage/{YYYY-MM} doc from an app. */
export type AppUsage = { app: string; month: string; usd: number; calls: number };

export type Group = 'gemini' | 'storage' | 'other';
export const GROUPS: Group[] = ['gemini', 'storage', 'other'];
export const GROUP_LABEL: Record<Group, string> = { gemini: 'Gemini', storage: 'Storage', other: 'Other' };

export type DayBar = { day: string; values: Record<Group, number>; forecast: number };
export type Line = { name: string; total: number; prev: number; changePct: number | null };
export type AppLine = { app: string; vnd: number; usd: number; calls: number; share: number };
export type Insight = { tag: string; text: string };

export type Summary = {
  month: string;
  lastDay: string | null;
  total: number;
  totalUsd: number | null;
  topup: number;
  forecast: number;
  prevSame: number;
  changePct: number | null;
  budget: number;
  budgetPct: number;
  groupTotals: Record<Group, number>;
  daily: DayBar[];
  services: Line[];
  projects: Line[];
  models: Line[];
  months: { month: string; total: number }[];
  apps: AppLine[];
  aiEstimate: number;
  aiBilled: number;
  gapPct: number | null;
  insights: Insight[];
};

const DAY_MS = 86_400_000;
const VN_OFFSET_MS = 7 * 3_600_000;

export function groupOf(service: string): Group {
  if (/gemini|generative language/i.test(service)) return 'gemini';
  if (/cloud storage/i.test(service)) return 'storage';
  return 'other';
}

/** Gemini model named in a billing SKU, e.g. "Generate content output token count gemini 3.8 flash text" -> "gemini 3.8 flash". */
export function modelOf(sku: string): string {
  const t = sku.toLowerCase();
  if (t.includes('grounding')) return 'search grounding';
  const m = t.match(/gemini[ -](embedding(?:[ -]\d+)?|\d+(?:\.\d+)?[ -](?:flash[ -]lite|[a-z]+))/);
  return m ? `gemini ${m[1].replace(/-/g, ' ')}` : 'other';
}

export function vnDay(now: number): string {
  return new Date(now + VN_OFFSET_MS).toISOString().slice(0, 10);
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

function dayOf(month: string, dom: number): string {
  return `${month}-${String(dom).padStart(2, '0')}`;
}

export function changePct(cur: number, prev: number): number | null {
  if (!(prev > 0)) return null;
  return ((cur - prev) / prev) * 100;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function formatVnd(v: number): string {
  const r = Math.round(v);
  return (r < 0 ? '-₫' : '₫') + Math.abs(r).toLocaleString('en-US');
}

export function shortVnd(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (a >= 1_000_000) return `${sign}₫${(a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1)}M`;
  if (a >= 10_000) return `${sign}₫${Math.round(a / 1000)}k`;
  if (a >= 1000) return `${sign}₫${(a / 1000).toFixed(1)}k`;
  return `${sign}₫${Math.round(a)}`;
}

export function formatPct(p: number | null): string {
  if (p === null) return 'new';
  const r = Math.round(p);
  return `${r > 0 ? '+' : ''}${r}%`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthName(month: string): string {
  return MONTHS[Number(month.slice(5, 7)) - 1];
}

export function dayLabel(day: string): string {
  return `${monthName(day.slice(0, 7))} ${Number(day.slice(8, 10))}`;
}

function sumBy<T>(items: T[], key: (t: T) => string, value: (t: T) => number): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + value(it));
  return m;
}

function lines(cur: BillRow[], prev: BillRow[], key: (r: BillRow) => string): Line[] {
  const c = sumBy(cur, key, (r) => r.net);
  const p = sumBy(prev, key, (r) => r.net);
  return [...c.entries()]
    .filter(([, total]) => Math.round(total) >= 1)
    .map(([name, total]) => ({ name, total, prev: p.get(name) ?? 0, changePct: changePct(total, p.get(name) ?? 0) }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Days where one service group costs over 4x its own normal (median) day.
 * Each group is compared with itself, so a quiet service that jumps stands
 * out even when a busy one costs more every day.
 */
function spikes(cur: BillRow[]): Insight[] {
  type Hit = { group: Group; day: string; extra: number; ratio: number; key: string };
  const hits: Hit[] = [];
  for (const g of GROUPS) {
    const rows = cur.filter((r) => groupOf(r.service) === g);
    const byDay = sumBy(rows, (r) => r.day, (r) => r.net);
    const med = median([...byDay.values()].filter((v) => v > 0));
    if (med <= 0) continue;
    for (const [day, v] of [...byDay.entries()].sort()) {
      if (v < 4 * med || v - med < 5000) continue;
      const byKey = sumBy(rows.filter((r) => r.day === day), (r) => `${r.project}|${r.sku}`, (r) => r.net);
      const [key] = [...byKey.entries()].sort((a, b) => b[1] - a[1])[0];
      hits.push({ group: g, day, extra: v - med, ratio: v / med, key });
    }
  }
  // Merge back-to-back days with the same cause.
  const runs: Hit[][] = [];
  for (const h of hits) {
    const last = runs.at(-1)?.at(-1);
    const joined = last && last.group === h.group && last.key === h.key && Date.parse(h.day) - Date.parse(last.day) === DAY_MS;
    if (joined) runs.at(-1)!.push(h);
    else runs.push([h]);
  }
  const peak = (run: Hit[]) => Math.max(...run.map((h) => h.ratio));
  return runs
    .sort((a, b) => peak(b) - peak(a))
    .slice(0, 2)
    .map((run) => {
      const [project, sku] = run[0].key.split('|');
      const first = dayLabel(run[0].day);
      const span = run.length > 1 ? `${first}-${Number(run.at(-1)!.day.slice(8))}` : first;
      const extra = run.reduce((s, h) => s + h.extra, 0);
      const days = run.length > 1 ? ` in ${run.length} days` : '';
      return { tag: 'spike', text: `${GROUP_LABEL[run[0].group]} ${span}: ${shortVnd(extra)} above a normal day${days} (${project}, ${sku}).` };
    });
}

export function summarize(input: {
  rows: BillRow[];
  usage: AppUsage[];
  now: number;
  budget: number;
}): Summary {
  const { usage, now, budget } = input;
  const month = vnDay(now).slice(0, 7);
  // Top-ups are left out of every total: the usage paid from them is already in the bill.
  const rows = input.rows.filter((r) => !r.topup);
  const topup = input.rows.filter((r) => r.topup && r.day.startsWith(month)).reduce((s, r) => s + r.net, 0);
  const prevMonth = shiftMonth(month, -1);
  const cur = rows.filter((r) => r.day.startsWith(month));
  const lastDay = cur.length ? cur.reduce((m, r) => (r.day > m ? r.day : m), '') : null;
  const lastDom = lastDay ? Number(lastDay.slice(8, 10)) : 0;
  const prev = rows.filter((r) => r.day.startsWith(prevMonth) && Number(r.day.slice(8, 10)) <= lastDom);

  const total = cur.reduce((s, r) => s + r.net, 0);
  const prevSame = prev.reduce((s, r) => s + r.net, 0);
  const rated = rows.filter((r) => r.rate > 0).sort((a, b) => (a.day < b.day ? 1 : -1));
  const rate = rated[0]?.rate ?? null;

  const dayTotals = sumBy(cur, (r) => r.day, (r) => r.net);
  let pace = 0;
  if (lastDom > 0) {
    const from = Math.max(1, lastDom - 6);
    let sum = 0;
    for (let d = from; d <= lastDom; d++) sum += dayTotals.get(dayOf(month, d)) ?? 0;
    pace = sum / (lastDom - from + 1);
  }
  const dim = daysInMonth(month);
  const forecast = total + pace * (dim - lastDom);

  const daily: DayBar[] = [];
  for (let d = 1; d <= dim; d++) {
    const day = dayOf(month, d);
    const values: Record<Group, number> = { gemini: 0, storage: 0, other: 0 };
    for (const r of cur) if (r.day === day) values[groupOf(r.service)] += r.net;
    daily.push({ day, values, forecast: d > lastDom ? pace : 0 });
  }

  const groupTotals: Record<Group, number> = { gemini: 0, storage: 0, other: 0 };
  for (const r of cur) groupTotals[groupOf(r.service)] += r.net;

  const services = lines(cur, prev, (r) => r.service);
  const projects = lines(cur, prev, (r) => r.project);
  const isGemini = (r: BillRow) => groupOf(r.service) === 'gemini';
  const models = lines(cur.filter(isGemini), prev.filter(isGemini), (r) => modelOf(r.sku));

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const m = shiftMonth(month, -i);
    months.push({ month: m, total: rows.filter((r) => r.day.startsWith(m)).reduce((s, r) => s + r.net, 0) });
  }

  const curUsage = usage.filter((u) => u.month === month && u.usd > 0);
  const usdSum = curUsage.reduce((s, u) => s + u.usd, 0);
  const apps: AppLine[] = curUsage
    .map((u) => ({ app: u.app, usd: u.usd, calls: u.calls, vnd: rate ? u.usd * rate : 0, share: usdSum ? (u.usd / usdSum) * 100 : 0 }))
    .sort((a, b) => b.usd - a.usd);
  const aiEstimate = apps.reduce((s, a) => s + a.vnd, 0);
  const aiBilled = groupTotals.gemini;
  const gapPct = aiEstimate > 0 && aiBilled > 0 ? ((aiEstimate - aiBilled) / aiBilled) * 100 : null;

  const insights: Insight[] = [];
  if (budget > 0 && forecast > budget) {
    insights.push({ tag: 'over', text: `Forecast ${shortVnd(forecast)} is over the ${shortVnd(budget)} budget.` });
  }
  const top = services[0];
  if (top && total > 0) {
    const share = Math.round((top.total / total) * 100);
    let trend = '';
    if (top.changePct !== null && top.changePct >= 100) trend = `, ${(top.total / top.prev).toFixed(1)}x the same days last month`;
    else if (top.changePct !== null) trend = `, ${formatPct(top.changePct)} vs the same days last month`;
    insights.push({ tag: top.changePct !== null && top.changePct > 0 ? 'up' : 'top', text: `${top.name} is ${share}% of the bill${trend}.` });
  }
  if (apps[0]) {
    insights.push({ tag: 'app', text: `${apps[0].app} is ${Math.round(apps[0].share)}% of the Gemini estimate (${apps[0].calls} calls).` });
  }
  insights.push(...spikes(cur));
  if (gapPct !== null && Math.abs(gapPct) > 20) {
    const word = gapPct < 0 ? 'under' : 'over';
    insights.push({ tag: 'check', text: `Gemini estimate ${shortVnd(aiEstimate)} vs billing ${shortVnd(aiBilled)}: ${Math.abs(Math.round(gapPct))}% ${word}.` });
  }

  return {
    month,
    lastDay,
    total,
    totalUsd: rate ? total / rate : null,
    topup,
    forecast,
    prevSame,
    changePct: changePct(total, prevSame),
    budget,
    budgetPct: budget > 0 ? (total / budget) * 100 : 0,
    groupTotals,
    daily,
    services,
    projects,
    models,
    months,
    apps,
    aiEstimate,
    aiBilled,
    gapPct,
    insights,
  };
}
