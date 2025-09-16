/* Dual PWA SW — stale-while-revalidate with offline fallback */
const CACHE = 'dual-pwa-v2';
const CORE = ['./','./index.html','./manifest.json','./offline.html','./assets/icons/icon-192.png','./assets/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE && caches.delete(k)))));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./offline.html')));
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => {
      const fetched = fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
