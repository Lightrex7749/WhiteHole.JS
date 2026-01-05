/**
 * WHITEHOLE - SERVICE WORKER (Offline Support & Caching)
 */

const CACHE_NAME = 'whitehole-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/manifest.json',
    '/core-player.js',
    '/search-api.js',
    '/ui-navigation.js',
    '/ui-effects.js',
    '/advanced-features.js',
    '/queue-management.js',
    '/local-storage.js',
    '/theme-switcher.js',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching static assets');
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                // Continue even if some assets fail (external CDNs might not be available)
                console.warn('Some assets failed to cache:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Network first strategy for API calls
    if (request.url.includes('deezer')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful API responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached response if network fails
                    return caches.match(request);
                })
        );
        return;
    }

    // Cache first for static assets
    event.respondWith(
        caches.match(request).then((response) => {
            if (response) {
                return response;
            }

            return fetch(request).then((response) => {
                // Cache valid responses
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });

                return response;
            });
        }).catch(() => {
            // Fallback for offline (show offline page if exists)
            if (request.destination === 'document') {
                return caches.match('/index.html');
            }
        })
    );
});

// Handle messages from client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
