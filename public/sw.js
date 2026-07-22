const CACHE_NAME = "agrosensix-v5-offline";

// Comprehensive Precache List for core app shell, Vercel SPA routes, and manifest
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/dashboard",
  "/analytics",
  "/ai-assistant",
  "/irrigation",
  "/impact",
  "/offline",
  "/architecture",
  "/about",
  "/settings",
  "/login",
  "/gmail"
];

// 1. Install Event: Instantly precache essential app shell and routes, then skip waiting
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Precaching initial app shell and SPA routes...");
      return Promise.all(
        PRECACHE_ASSETS.map((asset) => {
          return cache.add(asset).catch((err) => {
            console.warn(`[Service Worker] Initial precache asset warning for ${asset}:`, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Claim clients immediately & remove old caches from previous deployments
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Cleaning up stale cache version:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Message Event: Active client backfill to cache 100% of loaded scripts, CSS, images, and fonts
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CACHE_ASSETS") {
    const assets = event.data.assets || [];
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        const validAssets = assets.filter((asset) => {
          try {
            const u = new URL(asset, self.location.origin);
            return u.protocol.startsWith("http") && 
                   !u.pathname.includes("socket") && 
                   !u.pathname.includes("hmr");
          } catch (e) {
            return false;
          }
        });

        return Promise.all(
          validAssets.map((asset) => {
            return fetch(asset)
              .then((res) => {
                if (res.status === 200 || res.type === "opaque") {
                  return cache.put(asset, res);
                }
              })
              .catch(() => {
                // Try no-cors fallback for cross-origin fonts and images
                return fetch(asset, { mode: "no-cors" })
                  .then((res) => cache.put(asset, res))
                  .catch((e) => {
                    console.warn(`[Service Worker] Dynamic cache backfill bypassed for: ${asset}`);
                  });
              });
          })
        );
      })
    );
  }
});

// 4. Fetch Interception Event
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

  const isNavigationRequest = 
    event.request.mode === "navigate" || 
    (event.request.headers.get("accept") && event.request.headers.get("accept").includes("text/html"));

  // 1. SPA Navigation Requests (/dashboard, /analytics, /settings, /login, etc.)
  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put("/index.html", copy);
              cache.put(event.request.url, copy.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Under offline scenarios, return the cached application shell (/index.html) or cached route
          return caches.match(event.request.url)
            .then((cachedRoute) => cachedRoute || caches.match("/index.html"))
            .then((cachedIndex) => cachedIndex || caches.match("/"));
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts, Icons) - Cache-First with Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === "opaque")) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            throw err;
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
