'use client';

import { notFound } from 'next/navigation';

import { DailyView } from '@/components/DailySection';
import shell from '@/components/shell.module.css';
import { GROUPS } from '@/lib/apps';
import { addDays, buildDaily, DAILY_APPS, type AppDays } from '@/lib/today/summary';

// Dev only: the Daily group with sample data, no sign-in.
const NOW = Date.UTC(2026, 10, 26, 14); // 21:00 in Vietnam

function sample(): AppDays[] {
  return DAILY_APPS.map((app, i) => {
    const days: string[] = [];
    for (let d = 1; d < 30; d++) if (d < 9 || (d + i) % 4 !== 0) days.push(addDays('2026-11-26', -d));
    if (app === 'fina' || app === 'logi') days.push('2026-11-26');
    return { app, days };
  });
}

export default function Preview() {
  if (process.env.NODE_ENV === 'production') notFound();
  const daily = buildDaily(sample(), NOW);
  return (
    <div className={shell.wrap}>
      <DailyView index={1} title="Daily" apps={GROUPS[0].apps} daily={daily} now={NOW} />
    </div>
  );
}
