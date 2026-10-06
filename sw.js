// Offline shell. Network first (so updates arrive on the next open), cache as the fallback.
// Photos and data are never cached here; they live in IndexedDB on the phone.
const V = 'routine-v11';
const SHELL = ['./', './pics/moist-s4.jpg', './pics/moist-s3.jpg', './pics/moist-s2.jpg', './pics/moist-s1.jpg', './index.html', './app.js', './foods.js', './meals.js', './areas.js', './pics.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './pics/cleanser-p.jpg', './pics/cleanser-s1.jpg', './pics/cleanser-s2.jpg', './pics/cleanser-s3.jpg', './pics/cleanser-s4.jpg', './pics/moist-p.jpg', './pics/lipbalm-p.jpg', './pics/floss-p.jpg', './pics/leavein-p.jpg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(V).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html'))));
});
