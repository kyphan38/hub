'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import AppTile from './AppTile';
import Heat from './Heat';
import s from './home.module.css';
import type { AppItem } from '@/lib/apps';
import { auth } from '@/lib/firebase';
import { isPlainKey, tabTitle } from '@/lib/keys';
import type { Daily } from '@/lib/today/summary';

/** Hour in Vietnam time, for the evening reminder. */
function vnHour(now: number): number {
  return new Date(now + 7 * 3_600_000).getUTCHours();
}

/** The Daily group. Signed in as the owner, it also shows today's state from the apps' data. */
export default function DailySection({ index, title, apps }: { index: number; title: string; apps: AppItem[] }) {
  const [daily, setDaily] = useState<Daily | null>(null);

  useEffect(() => {
    let live = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setDaily(null);
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/today', { headers: { authorization: `Bearer ${token}` } });
        if (res.ok && live) setDaily(await res.json());
      } catch {
        // Offline or not the owner: the group stays a plain list of apps.
      }
    });
    return () => {
      live = false;
      unsub();
    };
  }, []);

  // Tab title shows progress; Space opens the next app that is not done.
  useEffect(() => {
    if (!daily) return;
    document.title = tabTitle(daily.done, daily.total);
    const next = daily.next ? apps.find((a) => a.name === daily.next) : undefined;
    function onKey(e: KeyboardEvent) {
      if (e.key !== ' ' || !next || !isPlainKey(e)) return;
      e.preventDefault();
      window.open(next.href, '_blank', 'noopener');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [daily, apps]);

  return <DailyView index={index} title={title} apps={apps} daily={daily} now={Date.now()} />;
}

/** Drawn from data only, so the dev preview can show it without signing in. */
export function DailyView({ index, title, apps, daily, now }: { index: number; title: string; apps: AppItem[]; daily: Daily | null; now: number }) {
  const left = daily ? daily.total - daily.done : 0;
  const evening = daily !== null && left > 0 && vnHour(now) >= 20;
  const nextApp = daily?.next ? apps.find((a) => a.name === daily.next) : undefined;

  return (
    <section className={s.group} aria-labelledby="g-daily">
      <h2 className={s.label} id="g-daily">
        <span>{String(index).padStart(2, '0')}</span>
        <b>{title}</b>
        <span className={s.rule} />
      </h2>
      {daily && (
        <div className={`${s.meta} num`}>
          <span className={evening ? s.urgent : ''}>
            {daily.done}/{daily.total} today
            {evening && ` · ${left} left`}
            {' · '}
            {daily.streak} {daily.streak === 1 ? 'day' : 'days'}
            {nextApp && (
              <>
                {' · '}
                <a className={s.next} href={nextApp.href} target="_blank" rel="noopener">next: {nextApp.name}</a>
                <kbd className={s.key}> space</kbd>
              </>
            )}
          </span>
          <Heat days={daily.heat} total={daily.total} />
        </div>
      )}
      <div className={s.grid}>
        {apps.map((a) => (
          <AppTile key={a.name} app={a} status={daily?.apps.find((x) => x.app === a.name)?.state} />
        ))}
      </div>
    </section>
  );
}
