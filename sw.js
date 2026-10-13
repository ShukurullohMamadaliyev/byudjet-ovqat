// ==========================================================================
// Service Worker for Arzon Ovqat Toshkent PWA
// ==========================================================================

const CACHE_NAME = 'arzon-ovqat-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkRes) => {
        return networkRes;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedRes) => {
          return cachedRes || caches.match('/index.html');
        });
      })
  );
});
