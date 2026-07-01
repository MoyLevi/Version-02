const APP_VERSION = "4.2.2";
const CACHE_PREFIX = "quiniela-mundial-2026";
const CACHE_NAME = `${CACHE_PREFIX}-v${APP_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",
  "./version.json",
  "./favicon.png",
  "./css/base.css?v=4.2.2",
  "./css/layout.css?v=4.2.2",
  "./css/components.css?v=4.2.2",
  "./css/responsive.css?v=4.2.2",
  "./js/config.js?v=4.2.2",
  "./js/data.js?v=4.2.2",
  "./js/utils.js?v=4.2.2",
  "./js/scoring.js?v=4.2.2",
  "./js/views-inicio.js?v=4.2.2",
  "./js/views-partidos.js?v=4.2.2",
  "./js/views-tabla.js?v=4.2.2",
  "./js/views-stats.js?v=4.2.2",
  "./js/app.js?v=4.2.2",
  "./js/firebase.js?v=4.2.2",
  "./js/pwa.js?v=4.2.2",
  "./js/notifications.js?v=4.2.2",
  "./img/copa-fifa.png",
  "./img/reglas-premios.png",
  "./img/trionda.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const results = await Promise.allSettled(
    APP_SHELL.map(async url => {
      const response = await fetch(url, { cache: "reload" });
      if (!response.ok) throw new Error(`${url} -> ${response.status}`);
      await cache.put(url, response);
    })
  );

  const failed = results
    .map((result, index) => ({ result, url: APP_SHELL[index] }))
    .filter(item => item.result.status === "rejected");

  if (failed.length) {
    console.warn("Algunos archivos no se pudieron precachear, pero la actualización continuará:", failed.map(f => f.url));
  }
}

self.addEventListener("install", event => {
  event.waitUntil(
    cacheAppShell()
      .catch(error => console.warn("Precache incompleto:", error))
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
    const response = await fetch(request, { cache: "no-store" });
    if (response?.ok && request.method === "GET") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
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

function getNotificationFromPayload(payload = {}) {
  const notification = payload.notification || {};
  const data = payload.data || payload;
  const webpushNotification = payload.webpush?.notification || {};
  const title = notification.title || webpushNotification.title || data.title || "Quiniela Mundial 2026";

  return {
    title,
    options: {
      body: notification.body || webpushNotification.body || data.body || "Tienes una nueva notificación.",
      icon: data.icon || webpushNotification.icon || "./icons/icon-192.png",
      badge: data.badge || webpushNotification.badge || "./icons/icon-192.png",
      tag: data.tag || webpushNotification.tag || "quiniela-mundial-2026",
      data: {
        url: data.url || payload.fcmOptions?.link || payload.webpush?.fcm_options?.link || "./",
        ...data
      },
      renotify: true
    }
  };
}

self.addEventListener("push", event => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { data: { body: event.data ? event.data.text() : "" } };
  }

  const { title, options } = getNotificationFromPayload(payload);
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "./";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return null;
    })
  );
});
