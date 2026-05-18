// Studlike Service Worker — v4
// Bump CACHE_VERSION on each production deploy to flush stale caches.
const CACHE_VERSION = "4";
const CACHE_NAME = "studlike-v" + CACHE_VERSION;
// Separate cache for immutable Next.js static assets (content-hashed filenames).
const STATIC_CACHE_NAME = "studlike-static-v" + CACHE_VERSION;

// App shell: pre-cached on install so the page and offline fallback are available immediately.
const SHELL_URLS = ["/", "/offline.html"];

// Development logging — only when running on localhost.
const isDev =
  self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";
function log(...args) {
  if (isDev) console.log("[SW v" + CACHE_VERSION + "]", ...args);
}

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  log("install — pre-caching shell", SHELL_URLS);
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          SHELL_URLS.map((url) =>
            fetch(url, { cache: "no-cache" })
              .then((res) => {
                if (res.ok) {
                  log("shell cached:", url);
                  return cache.put(url, res);
                }
              })
              .catch((err) => log("shell cache failed:", url, err))
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  log("activate — cleaning old caches");
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        const stale = keys.filter(
          (k) => k !== CACHE_NAME && k !== STATIC_CACHE_NAME
        );
        log("deleting stale caches:", stale);
        return Promise.all(stale.map((k) => caches.delete(k)));
      })
      .then(() => {
        log("activate — claiming clients");
        return self.clients.claim();
      })
  );
});

// ── Message ───────────────────────────────────────────────────────────────────
// The in-app update banner posts SKIP_WAITING so the new SW activates
// without requiring the user to close all tabs.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    log("SKIP_WAITING received");
    self.skipWaiting();
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function isCacheableResponse(response) {
  // Only cache successful, non-redirect, same-origin responses.
  return (
    response.ok &&
    response.status === 200 &&
    (response.type === "basic" || response.type === "cors") &&
    !response.redirected
  );
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle same-origin requests.
  if (url.origin !== location.origin) return;

  // ── API routes: always network, never cache ───────────────────────────────
  if (url.pathname.startsWith("/api/")) return;

  // ── Next.js static assets: cache-first (immutable, content-hashed) ────────
  // These filenames include a content hash so they never change once deployed.
  // Caching them enables the app to run offline after the first online visit.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) {
            log("static cache hit:", url.pathname);
            return cached;
          }
          log("static cache miss — fetching:", url.pathname);
          return fetch(request)
            .then((response) => {
              if (isCacheableResponse(response)) {
                log("static cached:", url.pathname);
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch((err) => {
              log("static fetch failed (offline + not cached):", url.pathname, err);
              // Return a syntactically valid but empty JS module so the
              // browser surfaces a clear error instead of a silent hang.
              // The app will not boot from this fallback — the offline.html
              // navigation fallback below is the user-facing safety net.
              return new Response("/* offline */", {
                status: 503,
                headers: { "Content-Type": "application/javascript; charset=utf-8" },
              });
            });
        })
      )
    );
    return;
  }

  // ── Other /_next/* paths: pass through (image optimisation, HMR, etc.) ────
  if (url.pathname.startsWith("/_next/")) return;

  // ── Navigation requests (HTML pages): stale-while-revalidate ─────────────
  // Serve cached version immediately for instant load, update cache from
  // network in the background. Falls back to offline.html when both fail.
  if (request.mode === "navigate" || request.headers.get("Accept")?.includes("text/html")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);

        // Fetch fresh version in the background regardless.
        const networkFetch = fetch(request, { cache: "no-cache" })
          .then((response) => {
            if (isCacheableResponse(response)) {
              log("nav cached (background):", url.pathname);
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch((err) => {
            log("nav fetch failed:", url.pathname, err);
            return null;
          });

        if (cached) {
          log("nav stale-while-revalidate:", url.pathname);
          // Keep SW alive while the background fetch completes.
          event.waitUntil(networkFetch);
          return cached;
        }

        // No cache — wait for network.
        log("nav no cache, waiting for network:", url.pathname);
        const networkResponse = await networkFetch;
        if (networkResponse) return networkResponse;

        // Both failed: serve offline fallback.
        log("nav offline fallback:", url.pathname);
        const offline = await cache.match("/offline.html");
        return (
          offline ??
          new Response(
            "<!DOCTYPE html><html lang='pt-BR'><body><p>Você está offline.</p><button onclick='location.reload()'>Tentar novamente</button></body></html>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
          )
        );
      })
    );
    return;
  }

  // ── All other same-origin resources: network-first, cache fallback ────────
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (isCacheableResponse(response)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        log("resource offline fallback:", url.pathname);
        return caches.match(request);
      })
  );
});
