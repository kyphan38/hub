'use client';

import { useEffect } from 'react';

/** Registers /sw.js in production. Dev keeps no cache, so edits show at once. */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Private mode and some browsers refuse; the site works without it.
    });
  }, []);
  return null;
}
