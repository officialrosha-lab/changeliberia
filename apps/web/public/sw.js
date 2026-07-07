// Web push service worker. Kept intentionally minimal — this app is not a
// full PWA (no offline caching), the service worker exists solely to
// receive push events per the browser Push API's requirements.

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
