// hub service worker: cache the app shell so hub opens at once, even offline.
//
// /_next/static/*  cache-first. File names hash their content, so a new build
//                  means new names and never a stale file.
// HTML             stale-while-revalidate, keyed by pathname. Pages are static
//                  (sign-in is checked in the browser), so the last build's
//                  page is still right; the new one shows on the next open.
// API, /__/auth    never cached. Daily status and costs are always fresh.

const CACHE_VERSION = 'hub-v1';

// Every page, so each opens offline. A miss never falls back to another page.
const PAGES = ['/', '/links', '/costs'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(precache());
});

async function precache() {
  const cache = await caches.open(CACHE_VERSION);
  await Promise.all(
    PAGES.map((path) =>
      fetch(path, { cache: 'no-cache' })
        .then((res) => res.ok && store(cache, path, res))
        .catch(() => {
          // Offline during install: pages fill in as they are opened.
        }),
    ),
  );
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStatic(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/_next/static/');
}

function isNeverCached(url) {
  return url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/__/');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (isNeverCached(url)) return;

  if (isStatic(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ??
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === 'navigate') {
    const key = url.pathname.replace(/\/$/, '') || '/';
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const hit = await cache.match(key);
        const fresh = fetch(req)
          .then((res) => {
            // Only plain pages: a redirect or error page must not replace a good copy.
            if (res.ok && !res.redirected) event.waitUntil(store(cache, key, res.clone()));
            return res;
          })
          .catch(() => null);
        if (hit) {
          event.waitUntil(fresh);
          return hit;
        }
        return (await fresh) || Response.error();
      }),
    );
  }
});

// Save the page, then fetch the JS/CSS it needs, so the next open does not
// wait for the network or hit a file an old build removed.
async function store(cache, key, res) {
  const html = await res.clone().text();
  await cache.put(key, res);
  const urls = new Set();
  for (const m of html.matchAll(/["'(](\/_next\/static\/[^"'()\s]+)/g)) urls.add(m[1]);
  await Promise.all(
    [...urls].map((u) =>
      cache.match(u).then((hit) => hit || fetch(u).then((r) => r.ok && cache.put(u, r)).catch(() => {})),
    ),
  );
}
