const LEGACY_CACHE_PREFIX = 'lore-vip-';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith(LEGACY_CACHE_PREFIX))
        .map((name) => caches.delete(name)),
    );

    await self.clients.claim();
    await self.registration.unregister();
  })());
});

// Si un dispositivo todavía estaba controlado por el worker antiguo,
// durante esta última sesión todo pasa directo a red y nunca al cache viejo.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
