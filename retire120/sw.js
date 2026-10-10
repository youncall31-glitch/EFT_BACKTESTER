/* 120세 은퇴자금 계산기: 연결되어 있으면 늘 최신 파일을 받고, 연결이 없을 때만 저장해 둔 사본으로 엽니다. */
const CACHE = 'retire120-v1';
const CORE = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('retire120-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
const keep = (req, res) => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); };
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(res => { if (res && res.ok) keep(req, res); return res; })
      .catch(async () => {
        const c = await caches.open(CACHE);
        return (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' && await c.match('./')) || Response.error();
      }));
  } else if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(async c => (await c.match(req)) ||
      fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) keep(req, res); return res; })));
  }
});
