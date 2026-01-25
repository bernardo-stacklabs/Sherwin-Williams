const CACHE_NAME = 'sw-latam-2026-v14';

// Minimal app-shell cache for true PWA behavior (offline + fast reload)
// Note: the app uses cache-busting querystrings (?v=2). We handle that in fetch
// with ignoreSearch for same-origin static assets.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './styles.css',
  './app.js',
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
      caches
        .match(request, { ignoreSearch: true })
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return fetch(request)
            .then((response) => {
              // Cache successful basic responses only
              if (response && response.ok && response.type === 'basic') {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
              }
              return response;
            })
            .catch(async () => {
              // Don't return HTML for JS/CSS/image requests.
              // If we don't have it cached, fail fast.
              return caches.match(request, { ignoreSearch: true });
            });
        })
    );
    return;
  }

  // Cross-origin (CDNs) -> network only (avoid opaque caching surprises)
  event.respondWith(fetch(request));
});
