const CACHE_NAME = "raja-boot-house-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  "/rbh-logo.png",
];

// Install Event - cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate Event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch Event - network first with cache fallback
self.addEventListener("fetch", (event) => {
  // Only intercept HTTP/HTTPS GET requests
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful requests for assets
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      }),
  );
});
