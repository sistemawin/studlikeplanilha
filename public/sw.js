// Studlike Service Worker
// Bump CACHE_VERSION on each production deploy to flush stale caches.
const CACHE_VERSION = "3";
const CACHE_NAME = "studlike-v" + CACHE_VERSION;
// Separate cache for immutable Next.js static assets (content-hashed filenames).
const STATIC_CACHE_NAME = "studlike-static-v" + CACHE_VERSION;

// Pre-cache the app shell during install.
const SHELL_URLS = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  // Delete caches from all previous versions.
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// The in-app update banner posts this message so the new SW activates
// without the user having to close all tabs.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // Skip API routes — always need fresh data from the network.
  if (url.pathname.startsWith("/api/")) return;

  // Next.js static assets have content-hashed filenames → immutable → cache-first.
  // Without caching these, the app cannot start offline.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Skip other /_next/ paths (image optimization, HMR, etc.) — not worth caching.
  if (url.pathname.startsWith("/_next/")) return;

  // Shell and same-origin routes: network-first, fall back to cached version offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
