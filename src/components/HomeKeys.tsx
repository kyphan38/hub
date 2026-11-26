'use client';

import { useEffect } from 'react';

import { ALL_APPS } from '@/lib/apps';
import { appForKey, isPlainKey } from '@/lib/keys';

/** 1-9 open the app with that number. Space is handled by the Daily group. */
export default function HomeKeys() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isPlainKey(e)) return;
      const name = appForKey(e.key);
      const app = name ? ALL_APPS.find((a) => a.name === name) : undefined;
      if (!app) return;
      e.preventDefault();
      window.open(app.href, '_blank', 'noopener');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return null;
}
