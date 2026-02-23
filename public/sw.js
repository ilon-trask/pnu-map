const CACHE_NAME = "internatura-react-v3";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/logo.svg",
  "/floors/1.svg",
  "/floors/2.svg",
  "/floors/3.svg",
  "/floors/4.svg",
];

const CACHEABLE_EXTERNAL_ORIGINS = new Set([
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isCacheableExternal = CACHEABLE_EXTERNAL_ORIGINS.has(url.origin);

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);

      if (cachedResponse) {
        event.waitUntil(
          fetch(event.request)
            .then((response) => {
              if (
                response &&
                (response.ok || response.type === "opaque") &&
                (isSameOrigin || isCacheableExternal)
              ) {
                return cache.put(event.request, response.clone());
              }
            })
            .catch(() => {})
        );
        return cachedResponse;
      }

      try {
        const response = await fetch(event.request);
        if (
          response &&
          (response.ok || response.type === "opaque") &&
          (isSameOrigin || isCacheableExternal)
        ) {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (error) {
        if (event.request.mode === "navigate") {
          const fallback = await cache.match("/index.html");
          if (fallback) return fallback;
        }
        throw error;
      }
    })()
  );
});
