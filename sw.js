const CACHE_NAME = 'sw-latam-2026-v32';

// Minimal app-shell cache for true PWA behavior (offline + fast reload)
// Note: the app uses cache-busting querystrings (?v=2). We handle that in fetch
// with ignoreSearch for same-origin static assets.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './styles.css',
  './app.js',
  './locales.js',
  './manifest.webmanifest',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './assets/backgrounds/login-bg.jpg',
  './assets/logos/forge-logo.png',
  './assets/logos/forge-ahead.png',
  './assets/logos/logo-black.png',
  './assets/logos/logo-white.png',
  './assets/mapa-evento.png',
  './assets/photos/template.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Navigation requests (page loads) -> network first, fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          // Offline navigation fallback order:
          // 1) exact navigation target from cache (e.g. /index.html or /app.html)
          // 2) login
          // 3) app shell
          return (
            (await caches.match(request, { ignoreSearch: true })) ||
            (await caches.match('./index.html')) ||
            (await caches.match('./app.html'))
          );
        })
    );
    return;
  }

  // Same-origin static assets -> cache-first (ignore ?v= cache-busting)
  if (isSameOrigin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        // Normalize cache key to ignore querystrings (e.g. ?v=2),
        // but still allow the network request to update the cached entry.
        const urlNoSearch = new URL(request.url);
        urlNoSearch.search = '';
        const cacheKey = new Request(urlNoSearch.toString(), { method: 'GET' });

        const cachedResponse = await cache.match(cacheKey);

        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === 'basic') {
              cache.put(cacheKey, response.clone()).catch(() => { });
            }
            return response;
          })
          .catch(() => null);

        // Stale-while-revalidate: return cache immediately, update in background.
        if (cachedResponse) {
          event.waitUntil(networkPromise);
          return cachedResponse;
        }

        const networkResponse = await networkPromise;
        return networkResponse || (await cache.match(cacheKey));
      })()
    );
    return;
  }

  // Cross-origin (CDNs) -> network only (avoid opaque caching surprises)
  event.respondWith(fetch(request));
});
