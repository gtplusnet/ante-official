// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

// Import service worker configuration
importScripts('/service-worker-config.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyA4qfOG64hrEeNdM0L1zOceGEl0HX2v27M",
  authDomain: "materdei-353de.firebaseapp.com",
  projectId: "materdei-353de",
  storageBucket: "materdei-353de.firebasestorage.app",
  messagingSenderId: "92758462794",
  appId: "1:92758462794:web:d75462c245232e44cfb1b3",
  measurementId: "G-RC8GC9NSME"
});

// Retrieve Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title || 'Geer Guardian';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new notification',
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    data: payload.data,
    tag: payload.data?.type || 'default',
    requireInteraction: payload.data?.type === 'attendance',
    actions: [
      {
        action: 'view',
        title: 'View'
      }
    ]
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');
  
  event.notification.close();
  
  // Determine where to navigate based on notification data
  let urlToOpen = '/';
  
  if (event.notification.data) {
    const data = event.notification.data;
    
    if (data.type === 'attendance') {
      urlToOpen = '/dashboard';
    } else if (data.type === 'payment') {
      urlToOpen = '/tuition';
    } else if (data.type === 'announcement') {
      urlToOpen = '/notifications';
    }
  }
  
  // Check if action was clicked
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  } else {
    // Main notification body clicked
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Service Worker Lifecycle Events for Update Management

// Install event - cache static assets
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing new version:', APP_VERSION);
  
  // Force immediate activation
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then(cache => {
      return cache.addAll(STATIC_CACHE_URLS.map(url => 
        new Request(url, { cache: 'no-cache' })
      ));
    }).catch(err => {
      console.error('[Service Worker] Cache failed:', err);
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating new version:', APP_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      cleanOldCaches(),
      // Take control of all clients immediately
      self.clients.claim(),
    ]).then(() => {
      // Notify all clients about the update
      notifyClients({
        type: 'SERVICE_WORKER_UPDATED',
        version: APP_VERSION,
      });
    })
  );
});

// Fetch event - network first, cache fallback for app shell
self.addEventListener('fetch', function(event) {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching for certain patterns
  if (!shouldCache(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Network first strategy with cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        // Only cache successful responses
        if (response.ok && request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAMES.dynamic).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Try cache on network failure
        return caches.match(request).then(response => {
          if (response) {
            return response;
          }
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Network error', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

// Listen for skip waiting message
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting received');
    self.skipWaiting();
  }
});