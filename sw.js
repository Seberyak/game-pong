// Service Worker for Pong Game

const CACHE_NAME = 'pong-game-v1';

// Files to cache
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './images/icon-192.png',
  './images/icon-512.png',
  './js/main.js',
  './js/components/Ball.js',
  './js/components/Paddle.js',
  './js/components/Particles.js',
  './js/core/Game.js',
  './js/core/UIController.js',
  './js/utils/AudioManager.js',
  './js/utils/DrawUtils.js',
  './js/utils/constants.js',
  './js/utils/translations.js',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response from the cached version
        if (response) {
          return response;
        }
        
        // Not in cache - fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response
            const responseToCache = networkResponse.clone();
            
            // Open the cache and add the new resource
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          });
      })
      .catch(() => {
        // If both cache and network fail, show a generic fallback
        return caches.match('./index.html');
      })
  );
}); 