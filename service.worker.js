// Service Worker für Jugendkompass PWA
const CACHE_NAME = 'jugendkompass-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets, die beim Installieren gecached werden
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/liquid-glass.css',
  '/css/ios26.css',
  '/css/main.css',
  '/js/app.js',
  '/js/feed-manager.js',
  '/js/audio-player.js',
  '/js/nav-controller.js',
  '/js/offline-manager.js',
  '/sw-register.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Für Navigation-Anfragen: immer Netzwerk-first, fallback Cache
        if (event.request.mode === 'navigate') {
          return fetch(event.request)
            .then((response) => {
              // Cache die neue Seite
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseClone));
              return response;
            })
            .catch(() => {
              return caches.match('/');
            });
        }

        // Für statische Assets: Cache-first Strategie
        if (cachedResponse) {
          return cachedResponse;
        }

        // Für andere Anfragen: Netzwerk-first
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback für Offline
            if (event.request.destination === 'image') {
              return caches.match('/assets/icons/icon-192.png');
            }
            
            if (event.request.destination === 'audio') {
              // Return a placeholder response for audio
              return new Response(JSON.stringify({
                error: 'Offline',
                message: 'Audio nicht verfügbar offline'
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-prayers') {
    event.waitUntil(syncPrayers());
  }
  
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes());
  }
});

async function syncPrayers() {
  try {
    const prayers = JSON.parse(localStorage.getItem('jk_prayers_sync') || '[]');
    if (prayers.length > 0) {
      // Hier würde die Synchronisierung mit einem Server stattfinden
      console.log('Syncing prayers:', prayers.length);
      
      // Nach erfolgreicher Sync, lokale Daten löschen
      localStorage.removeItem('jk_prayers_sync');
      
      // Send notification
      self.registration.showNotification('Gebete synchronisiert', {
        body: `${prayers.length} Gebete wurden synchronisiert`,
        icon: '/assets/icons/icon-192.png'
      });
    }
  } catch (error) {
    console.error('Failed to sync prayers:', error);
  }
}

async function syncNotes() {
  try {
    const notes = JSON.parse(localStorage.getItem('jk_notes_sync') || '[]');
    if (notes.length > 0) {
      // Hier würde die Synchronisierung mit einem Server stattfinden
      console.log('Syncing notes:', notes.length);
      
      // Nach erfolgreicher Sync, lokale Daten löschen
      localStorage.removeItem('jk_notes_sync');
    }
  } catch (error) {
    console.error('Failed to sync notes:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received');
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body || 'Neue Benachrichtigung von Jugendkompass',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Öffnen'
      },
      {
        action: 'close',
        title: 'Schließen'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Jugendkompass', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a Window is open, navigate it to the URL
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            client.focus();
            if (event.notification.data && event.notification.data.url) {
              client.navigate(event.notification.data.url);
            }
            return;
          }
        }
        
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data?.url || '/');
        }
      })
  );
});
