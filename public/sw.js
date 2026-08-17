const CACHE_PREFIX = "atomic-atelier";
const CACHE_VERSION = "v3";
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;
const ROUTES = ["/", "/molecules", "/trends", "/reactions"];
const STABLE_ASSETS = ["/icon.png", "/icon-192.png", "/apple-icon.png", "/manifest.webmanifest"];

async function cacheResponse(cache, request) {
  const response = await fetch(request, { cache: "reload" });
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function cacheRoute(cache, route) {
  const response = await cacheResponse(cache, route);
  const html = await response.text();
  const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url.startsWith("/_next/static/") || url.startsWith("/icon") || url.startsWith("/apple-icon"));
  await Promise.allSettled([...new Set(assets)].map((asset) => cacheResponse(cache, asset)));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled([
      ...ROUTES.map((route) => cacheRoute(cache, route)),
      ...STABLE_ASSETS.map((asset) => cacheResponse(cache, asset)),
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(url.pathname, response.clone());
        return response;
      } catch {
        const routeFallback = url.pathname.startsWith("/molecules")
          ? "/molecules"
          : url.pathname.startsWith("/trends")
            ? "/trends"
            : url.pathname.startsWith("/reactions")
              ? "/reactions"
              : "/";
        return (await cache.match(url.pathname)) || (await cache.match(routeFallback)) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || STABLE_ASSETS.includes(url.pathname)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })());
  }
});
