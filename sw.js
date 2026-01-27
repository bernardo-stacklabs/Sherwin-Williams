const CACHE_NAME = 'sw-kickoff-2026-v36';
const RUNTIME_IMAGE_CACHE = 'sw-kickoff-2026-images-v1';

// Minimal app-shell cache for true PWA behavior (offline + fast reload)
// Note: the app uses cache-busting querystrings (?v=...). We keep the query
// string as part of the cache key so new versions are fetched immediately.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './styles.css?v=4',
  './app.js?v=4',
  './locales.js?v=4',
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
  const isSupabaseStorage = (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in'))
    && url.pathname.startsWith('/storage/v1/');

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

        const cachedResponse = await cache.match(request);

        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === 'basic') {
              cache.put(request, response.clone()).catch(() => { });
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
        return networkResponse || (await cache.match(request));
      })()
    );
    return;
  }

  // Supabase Storage images (cross-origin) -> cache (stale-while-revalidate)
  if (isSupabaseStorage) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_IMAGE_CACHE);
        const cachedResponse = await cache.match(request);

        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone()).catch(() => { });
            }
            return response;
          })
          .catch(() => null);

        if (cachedResponse) {
          event.waitUntil(networkPromise);
          return cachedResponse;
        }

        const networkResponse = await networkPromise;
        return networkResponse || (await cache.match(request));
      })()
    );
    return;
  }

  // Cross-origin (CDNs) -> network only (avoid opaque caching surprises)
  event.respondWith(fetch(request));
});
