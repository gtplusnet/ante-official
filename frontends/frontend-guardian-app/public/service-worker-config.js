// Service Worker Configuration
// This file is loaded by firebase-messaging-sw.js
const CACHE_VERSION = 'guardian-v1';
const APP_VERSION = '1.0.1';

// Cache names
const CACHE_NAMES = {
  static: `${CACHE_VERSION}-static`,
  dynamic: `${CACHE_VERSION}-dynamic`,
  api: `${CACHE_VERSION}-api`,
};

// Files to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/logo-192.png',
  '/logo-512.png',
];

// API routes that should not be cached
const NO_CACHE_PATTERNS = [
  /\/api\//,
  /\/auth\//,
  /socket\.io/,
  /\.json$/,
  /version/,
];

// Check if URL should be cached
function shouldCache(url) {
  return !NO_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Clean old caches
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    !Object.values(CACHE_NAMES).includes(name) && name.startsWith('guardian-')
  );
  
  await Promise.all(oldCaches.map(name => caches.delete(name)));
}

// Send message to all clients
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(client => {
    client.postMessage(message);
  });
}