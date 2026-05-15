// Studlike Service Worker
// Bump CACHE_VERSION on each production deploy to flush stale caches.
const CACHE_VERSION = "1";
const CACHE_NAME = "studlike-v" + CACHE_VERSION;

// Pre-cache only the stable shell URLs (no hashed chunks — Next.js handles those).
const SHELL_URLS = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
    // Do NOT call skipWaiting() here.
    // This keeps the new SW in "waiting" state until the user clicks the
    // in-app "Recarregar" button, which posts SKIP_WAITING below.
    // Chrome also shows its own "Update" option in the PWA install menu
    // precisely because the SW is in waiting state.
  );
});

self.addEventListener("activate", (event) => {
  // Delete old caches from previous versions.
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
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

  // Never cache API routes or Supabase calls — always network.
  if (url.pathname.startsWith("/api/")) return;

  // Network-first strategy: try the network, cache the response,
  // fall back to the cached version if offline.
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
