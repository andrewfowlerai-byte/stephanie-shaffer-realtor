/* eslint-env serviceworker */
/*
 * Service worker for ANF CRM.
 *
 * Handles incoming Web Push messages from the cron endpoint and displays
 * them as system notifications. Also intercepts notification clicks to
 * focus an existing CRM tab (or open one) on whatever URL the payload
 * specified.
 *
 * This file is served at /sw.js from the public/ directory and registered
 * by src/lib/push.ts on app start.
 */

self.addEventListener('install', (event) => {
  // Activate immediately so new updates take effect on next reload.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'Reminder', body: '', url: '/' };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body || '',
    icon: '/anf-logo.png',
    badge: '/anf-logo.png',
    data: { url: payload.url || '/' },
    tag: payload.tag || undefined,
    requireInteraction: payload.requireInteraction === true,
    vibrate: [200, 80, 200],
  };

  event.waitUntil(self.registration.showNotification(payload.title || 'Reminder', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      if ('focus' in client) {
        try {
          await client.focus();
          // If it's already on a different URL we can leave it alone or
          // navigate; navigation can be jarring so default to focus only.
          if (targetUrl && targetUrl !== '/' && 'navigate' in client) {
            try { await client.navigate(targetUrl); } catch { /* ignore */ }
          }
          return;
        } catch { /* fall through */ }
      }
    }
    // No existing window; open a new one.
    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});
