// גרסה 2 — הדף עצמו נטען תמיד מהרשת (אם יש חיבור), כך שעדכונים מגיעים מיד
const CACHE_NAME = 'arnak-teudot-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', function(event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function(c){ return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; })
                             .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (isPage) {
    // רשת קודם, מטמון כגיבוי כשאין חיבור
    event.respondWith(
      fetch(req).then(function(res) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put('./index.html', copy); });
        return res;
      }).catch(function() {
        return caches.match(req).then(function(r){ return r || caches.match('./index.html'); });
      })
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(function(cached) {
      return cached || fetch(req).then(function(res) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put(req, copy); });
        return res;
      });
    })
  );
});
