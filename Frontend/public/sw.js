// ACE Platform Service Worker
const CACHE_NAME = 'ace-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo_rocket.png',
  '/logo_ace_transparent.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Falha parcial no pré-cache do Service Worker:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições de API e Supabase (deve sempre ir à rede)
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/api') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('cloudinary.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Network-first com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
