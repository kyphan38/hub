// Daily status from real app data. A day starts at 04:00 Vietnam time for all
// four apps (hodi, legi and logi already count days this way).

export const DAILY_APPS = ['fina', 'hodi', 'legi', 'logi'] as const;
export type DailyApp = (typeof DAILY_APPS)[number];

export const WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;
const SHIFT_MS = (7 - 4) * 3_600_000; // UTC+7, minus the 04:00 start

/** Day key ("YYYY-MM-DD") that a moment belongs to. */
export function dayKey(ms: number): string {
  return new Date(ms + SHIFT_MS).toISOString().slice(0, 10);
}

/** First millisecond of a day key (04:00 Vietnam time). */
export function dayStart(key: string): number {
  return Date.parse(`${key}T00:00:00Z`) - SHIFT_MS;
}

export function addDays(key: string, n: number): string {
  return new Date(Date.parse(`${key}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

/** Oldest day key in the window that ends today. */
export function windowStart(now: number): string {
  return addDays(dayKey(now), -(WINDOW_DAYS - 1));
}

export type AppDays = { app: DailyApp; days: string[] | null }; // null = could not read

export type AppStatus = { app: DailyApp; state: 'done' | 'todo' | 'unknown' };
export type HeatDay = { day: string; count: number };

export type Daily = {
  today: string;
  apps: AppStatus[];
  done: number;
  total: number;
  streak: number;
  heat: HeatDay[];
  next: DailyApp | null;
};

export function buildDaily(input: AppDays[], now: number): Daily {
  const today = dayKey(now);
  const sets = new Map(input.map((a) => [a.app, a.days ? new Set(a.days) : null]));

  const apps: AppStatus[] = DAILY_APPS.map((app) => {
    const set = sets.get(app);
    if (!set) return { app, state: 'unknown' };
    return { app, state: set.has(today) ? 'done' : 'todo' };
  });

  const countOn = (day: string) => DAILY_APPS.filter((app) => sets.get(app)?.has(day)).length;
  const heat: HeatDay[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    heat.push({ day, count: countOn(day) });
  }

  // Full days in a row. Today counts once it is full; until then the streak
  // still stands from yesterday.
  const full = new Set(heat.filter((h) => h.count === DAILY_APPS.length).map((h) => h.day));
  let streak = 0;
  let day = full.has(today) ? today : addDays(today, -1);
  while (full.has(day)) {
    streak++;
    day = addDays(day, -1);
  }

  const done = apps.filter((a) => a.state === 'done').length;
  const next = apps.find((a) => a.state === 'todo')?.app ?? null;
  return { today, apps, done, total: DAILY_APPS.length, streak, heat, next };
}
