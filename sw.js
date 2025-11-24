const CACHE_NAME = 'lore-vip-v2'; // Versión de caché actualizada
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './fan/index.html',
  './vip/index.html',
  './terms/index.html',
  './assets/imagenes/Lore-192x192.png',
  './assets/imagenes/Lore-512x512.png',
  './assets/imagenes/Lore-120x120.png',
  './assets/imagenes/Lore-180x180.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});