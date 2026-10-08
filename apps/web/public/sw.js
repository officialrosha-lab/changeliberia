// Web push + minimal offline-fallback service worker. The app's pages are
// server-rendered per-request (force-dynamic), so there's no static HTML
// shell safe to cache and serve offline — instead this only caches a
// handful of static shell assets and swaps in a friendly offline page for
// failed navigations, rather than the browser's default offline error.

const SHELL_CACHE = 'cl-shell-v1';
const SHELL_ASSETS = ['/icon-192.png', '/icon-512.png', '/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match('/offline.html').then((cached) => cached || Response.error()),
    ),
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Change Liberia', body: 'You have a new update.' };
  try {
    if (event.data) data = event.data.json();
  } catch {
    /* fall back to default */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo-icon.png',
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
