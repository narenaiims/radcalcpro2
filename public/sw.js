/**
 * sw.js  —  radcalcpro2 Service Worker
 * ──────────────────────────────────────────────────────────────────────────
 * Strategy:
 *   Navigation requests  → Network-first, fallback to /index.html
 *   Static assets        → Cache-first, populate on first fetch
 *   API / genai calls    → Network-only (never cache)
 *
 * On activation: old cache versions are deleted.
 * On install: pre-caches shell only (/index.html + /manifest.json).
 * All JS/CSS bundles are lazily added to cache on first load (runtime caching).
 *
 * This means the app works fully offline after one complete online session,
 * without needing a build-time Workbox config.
 */

const CACHE_VERSION  = 'radonc-pro-v3';
const SHELL_ASSETS   = ['/', '/index.html', '/manifest.json'];

// ── Install: pre-cache the app shell ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete all old caches ───────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: tiered strategy ─────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept: external APIs, genai, analytics
  if (
    url.hostname !== self.location.hostname ||
    url.pathname.startsWith('/api/') ||
    request.url.includes('generativelanguage.googleapis.com') ||
    request.url.includes('unavatar.io')
  ) {
    return; // let browser handle normally
  }

  // Navigation → network-first, fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images) → cache-first, populate lazily
  if (
    request.destination === 'script'  ||
    request.destination === 'style'   ||
    request.destination === 'font'    ||
    request.destination === 'image'   ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            // Only cache valid, non-opaque responses
            if (response && response.status === 200 && response.type === 'basic') {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Everything else → network with cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
