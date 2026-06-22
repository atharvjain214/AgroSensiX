const CACHE_NAME = "agrosensix-offline-v2";

// Cache core page shell on setup
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Cleaning up stale cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Handle active backfill messages from the main client context
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_ASSETS") {
    const assets = event.data.assets || [];
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        const validAssets = assets.filter(asset => {
          try {
            const u = new URL(asset);
            return u.protocol.startsWith("http") && !u.pathname.includes("socket") && !u.pathname.includes("hmr");
          } catch(e) {
            return false;
          }
        });
        return Promise.all(
          validAssets.map(asset => {
            return cache.add(asset).catch(e => {
              console.warn(`[Service Worker] Dynamic cache backfill bypassed for: ${asset}`);
            });
          })
        );
      })
    );
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests, local WebSockets, live Firebase auth/functions, and local development builders
  if (
    event.request.method !== "GET" || 
    !url.protocol.startsWith("http") ||
    url.pathname.startsWith("/api/verify-passphrase") ||
    event.request.url.includes("firestore.googleapis.com") ||
    event.request.url.includes("identitytoolkit.googleapis.com") ||
    event.request.url.includes("securetoken.googleapis.com") ||
    event.request.url.includes("/@vite") ||
    event.request.url.includes("/@react-refresh") ||
    url.pathname.includes("socket") ||
    url.pathname.includes("hmr")
  ) {
    return; // Bypass to network directly
  }

  // Stale-While-Revalidate caching strategy with Navigation Fallback for SPA routers
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            // Under offline scenarios, let dynamic HTML navigation requests fall back to index.html
            if (event.request.mode === "navigate") {
              return cache.match("/index.html") || cache.match("/");
            }
            throw err;
          });

        // Return cached version immediately if available for instantaneous loading,
        // otherwise wait for the network fetch to complete.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
