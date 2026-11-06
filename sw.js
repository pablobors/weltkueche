const CORE = "wk-core-3c3b0bf65e";
const IMG = "wk-img-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CORE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("wk-core-") && k !== CORE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) caches.open(CORE).then(c => c.put(req, r.clone())); return r; }).catch(() => hit || caches.match("index.html"));
      return hit || net;
    }));
    return;
  }
  if (req.destination === "image" || /upload\.wikimedia\.org/.test(url.host)) {
    e.respondWith(caches.open(IMG).then(c => c.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === "opaque") { c.put(req, r.clone()); c.keys().then(ks => { if (ks.length > 400) c.delete(ks[0]); }); }
      return r;
    }))));
  }
});
