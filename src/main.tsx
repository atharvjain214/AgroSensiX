import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent and suppress benign Vite/HMR WebSocket connection closed errors from bubbling up as unhandled rejections or crashes
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || "");
    if (
      msg.includes("WebSocket") ||
      msg.includes("websocket") ||
      msg.includes("connection closed") ||
      msg.includes("WS ") ||
      msg.includes("closed without opened") ||
      msg.includes("database '(default)' not found") ||
      msg.includes("please check your firebase configuration")
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener("error", (event) => {
    const msg = event.message || "";
    if (
      msg.includes("WebSocket") ||
      msg.includes("websocket") ||
      msg.includes("connection closed") ||
      msg.includes("WS ") ||
      msg.includes("closed without opened") ||
      msg.includes("database '(default)' not found") ||
      msg.includes("please check your firebase configuration")
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker to enable 100% offline-ready application shell in production
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  if ((import.meta as any).env.DEV) {
    // Unregister any active service worker during development to prevent stale caches
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log("[Dev SW] Successfully unregistered service worker.");
            // Reload if we just unregistered to purge any lingering SW interceptors
            window.location.reload();
          }
        });
      }
    });

    // Clear all caches under Cache Storage during development to resolve dual-react / stale JS modules
    if ("caches" in window) {
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      }).then(() => {
        console.log("[Dev Cache] Cleared all cache storage buckets.");
      });
    }
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered successfully with scope:", reg.scope);

          // Listen for new service worker updates on deployment
          reg.addEventListener("updatefound", () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[PWA] New deployment detected. Activating latest Service Worker.");
                  installingWorker.postMessage({ type: "SKIP_WAITING" });
                }
              });
            }
          });

          // Active Shell Backfilling: send currently loaded DOM resources & routes to the service worker for full dynamic caching
          const sendShellAssets = () => {
            const targetWorker = navigator.serviceWorker.controller || reg.active || reg.installing;
            if (targetWorker) {
              const appRoutes = [
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
              ].map((r) => new URL(r, window.location.origin).href);

              const assetsToCache = Array.from(
                new Set([
                  ...appRoutes,
                  ...Array.from(document.querySelectorAll("script")).map((s) => s.src).filter(Boolean),
                  ...Array.from(document.querySelectorAll("link")).map((l) => l.href).filter(Boolean),
                  ...Array.from(document.querySelectorAll("img")).map((i) => i.src).filter(Boolean),
                  "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300..905;1,300..905&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:ital,wght@0,105..805;1,105..805&display=swap"
                ])
              );

              targetWorker.postMessage({
                type: "CACHE_ASSETS",
                assets: assetsToCache
              });
              console.log(`[PWA Backfill] Sent ${assetsToCache.length} shell assets & routes to Service Worker for offline caching.`);
            }
          };

          // Trigger asset caching immediately upon registration, after controller change, and after DOM stabilization
          sendShellAssets();
          setTimeout(sendShellAssets, 1200);

          if ("ready" in navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(() => {
              sendShellAssets();
              setTimeout(sendShellAssets, 2000);
            });
          }

          navigator.serviceWorker.addEventListener("controllerchange", sendShellAssets);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    });
  }
}

