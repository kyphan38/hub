// Deep links for iPhone Shortcuts: the main action of each app, then each weekly page.

export type DeepLink = { app: string; what: string; url: string };

export const DO_LINKS: DeepLink[] = [
  { app: 'fina', what: 'log a spend', url: 'https://fina.kyphan38.com/log' },
  { app: 'logi', what: 'now', url: 'https://logi.kyphan38.com/now' },
  { app: 'hodi', what: 'today', url: 'https://hodi.kyphan38.com/' },
  { app: 'legi', what: 'capture a quote', url: 'https://legi.kyphan38.com/capture/' },
  { app: 'mora', what: 'focus', url: 'https://mora.kyphan38.com/' },
  { app: 'navi', what: "today's drill", url: 'https://navi.kyphan38.com/drill/' },
  { app: 'cogi', what: 'new exercise', url: 'https://cogi.kyphan38.com/reasoning' },
  { app: 'noda', what: 'last lesson', url: 'https://noda.kyphan38.com/?open=latest' },
];

export function weekLinks(now: number): DeepLink[] {
  return [
    { app: 'hodi', what: 'week review', url: `https://hodi.kyphan38.com/review/?p=${hodiWeek(now)}` },
    { app: 'logi', what: 'analytics', url: 'https://logi.kyphan38.com/analytics' },
    { app: 'navi', what: 'weekly digest', url: 'https://navi.kyphan38.com/news/' },
    { app: 'fina', what: 'summary', url: 'https://fina.kyphan38.com/summary' },
    { app: 'cogi', what: 'history', url: 'https://cogi.kyphan38.com/exercise/history' },
  ];
}

/** Path part of a link, as shown on the right of each row. */
export function linkPath(url: string): string {
  const u = new URL(url);
  const path = u.pathname.replace(/\/$/, '') || '/';
  return path + u.search;
}

/** ISO week like "2026-W48" in Vietnam time, where a hodi day starts at 04:00. */
export function hodiWeek(now: number): string {
  const vn = new Date(now + 7 * 3_600_000 - 4 * 3_600_000);
  const d = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate());
  const dow = (new Date(d).getUTCDay() + 6) % 7;
  const thursday = new Date(d + (3 - dow) * 86_400_000);
  const year = thursday.getUTCFullYear();
  const week = Math.floor((thursday.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 / 7) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}
