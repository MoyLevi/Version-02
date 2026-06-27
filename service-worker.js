const APP_VERSION = "4.1.1";
const CACHE_PREFIX = "quiniela-mundial-2026";
const CACHE_NAME = `${CACHE_PREFIX}-v${APP_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./version.json",
  "./favicon.png",
  "./css/base.css?v=4.1.1",
  "./css/layout.css?v=4.1.1",
  "./css/components.css?v=4.1.1",
  "./css/responsive.css?v=4.1.1",
  "./js/config.js?v=4.1.1",
  "./js/data.js?v=4.1.1",
  "./js/utils.js?v=4.1.1",
  "./js/scoring.js?v=4.1.1",
  "./js/views-inicio.js?v=4.1.1",
  "./js/views-partidos.js?v=4.1.1",
  "./js/views-tabla.js?v=4.1.1",
  "./js/views-stats.js?v=4.1.1",
  "./js/app.js?v=4.1.1",
  "./js/pwa.js?v=4.1.1",
  "./img/copa-fifa.png",
  "./img/reglas-premios.png",
  "./img/trionda.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isDynamicGoogleData(url) {
  return url.hostname.includes("docs.google.com") ||
         url.hostname.includes("googleusercontent.com") ||
         (url.hostname.includes("google.com") && url.pathname.includes("forms"));
}

function isVersionFile(url) {
  return url.pathname.endsWith("/version.json") || url.pathname.endsWith("version.json");
}

async function networkFirst(request) {
  try {
    return await fetch(request, { cache: "no-store" });
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match("./offline.html");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response?.ok && request.method === "GET") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (request.mode === "navigate") {
      return caches.match("./offline.html");
    }
    throw error;
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (isDynamicGoogleData(url) || isVersionFile(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("./");
      return null;
    })
  );
});
