/* Bad Habits Can Die — service worker : reçoit les « réveils » du serveur et affiche les notifications. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

async function config() {
  const c = await caches.open('bhcd-config');
  const r = await c.match('config');
  return r ? r.json() : null;
}

self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let notifs = [];
    try {
      const cf = await config();
      if (cf && cf.serveur) {
        const url = cf.serveur + '?' + new URLSearchParams({ a: 'notifs', id: cf.id, secret: cf.secret });
        const r = await fetch(url);
        const d = await r.json();
        notifs = d.notifs || [];
      }
    } catch (err) { /* réseau absent : notification générique */ }
    try {
      const fenetres = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      fenetres.forEach(c => c.postMessage({ type: 'maj' }));
    } catch (err) { /* rien */ }
    if (!notifs.length) notifs = [{ titre: 'Bad Habits Can Die', corps: 'Il se passe quelque chose dans ta partie.' }];
    for (const n of notifs) {
      await self.registration.showNotification(n.titre, {
        body: n.corps,
        icon: 'icon-192.png',
        badge: 'badge-96.png',
        tag: n.id || 'bhcd',
        vibrate: [120, 60, 120],
        data: { url: './' + (n.partie ? '?partie=' + encodeURIComponent(n.partie) : ''), partie: n.partie || '' }
      });
    }
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = e.notification.data || {};
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(liste => {
    for (const c of liste) {
      if ('focus' in c) {
        if (d.partie) c.postMessage({ type: 'ouvrir', partie: d.partie });
        return c.focus();
      }
    }
    return self.clients.openWindow(d.url || './');
  }));
});
