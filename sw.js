/* ====================================================
   sw.js — Service Worker  |  CalTrack Pro v3.1
   Strategy:
   - Core app assets: stale-while-revalidate
   - External fonts: cache-first (opaque OK)
   - Install: allSettled so one missing asset doesn't break everything
   ==================================================== */

const CACHE = 'caltrack-v12';
const CORE_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/wizard.js',
    './js/dashboard.js',
    './js/journal.js',
    './js/poids.js',
    './js/suivi.js',
    './js/settings.js',
    './js/foods.js',
    './js/exercice.js',
    './js/scanner.js',
    './js/recipes.js',
    './js/progression.js',
    './js/body.js',
    './js/wellness.js',
    './js/intelligence.js',
    './js/notifications.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
];

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap';

// Install: cache core assets individually so one failure doesn't abort everything
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(cache =>
            Promise.allSettled(CORE_ASSETS.map(url =>
                cache.add(url).catch(() => { /* skip failed asset */ })
            ))
        ).then(() => self.skipWaiting())
    );
});

// Activate: clear old caches
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: stale-while-revalidate for core assets, cache-first for fonts
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    const url = new URL(e.request.url);
    const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
    const isCore = url.pathname.startsWith('/') && !isFont;

    if (isFont) {
        // Cache-first for fonts (they rarely change)
        e.respondWith(
            caches.match(e.request).then(cached => {
                if (cached) return cached;
                return fetch(e.request).then(res => {
                    // opaque responses are fine to cache for fonts
                    const clone = res.clone();
                    caches.open(CACHE).then(c => c.put(e.request, clone));
                    return res;
                }).catch(() => new Response('', { status: 503 }));
            })
        );
        return;
    }

    // Stale-while-revalidate for core app assets
    e.respondWith(
        caches.open(CACHE).then(cache =>
            cache.match(e.request).then(cached => {
                const networkFetch = fetch(e.request).then(res => {
                    if (res && res.status === 200 && res.type !== 'opaque') {
                        cache.put(e.request, res.clone());
                    }
                    return res;
                }).catch(() => null);

                // Return cached immediately if available, revalidate in background
                return cached || networkFetch.then(res => res || cache.match('./index.html'));
            })
        )
    );
});
