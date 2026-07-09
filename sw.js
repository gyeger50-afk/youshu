/* 有数 youshu Service Worker
   缓存策略:App Shell 全量预缓存,之后离线可用。
   发新版本时把 VERSION +1,旧缓存会在 activate 时清掉。 */
var VERSION = 'youshu-v8.1.4';
var SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './amb-rain.mp3',
  './amb-water.mp3'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* 缓存优先、后台更新(stale-while-revalidate):
   秒开 + 有网时静默拉新版,下次打开生效。 */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(function (c) {
      return c.match(e.request, { ignoreSearch: url.pathname.endsWith('/') || url.pathname.endsWith('index.html') }).then(function (hit) {
        var fetching = fetch(e.request).then(function (res) {
          if (res && res.status === 200) c.put(e.request, res.clone());
          return res;
        }).catch(function () { return hit; });
        return hit || fetching;
      });
    })
  );
});
