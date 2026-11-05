// Service worker di CanaloCAD: rende l'app utilizzabile offline quando è servita via http(s).
// - Pagina (Canalo.html): prima la rete, così gli aggiornamenti arrivano subito; offline usa la copia in cache.
// - Librerie CDN versionate (pdf.js, LibreDWG, font): prima la cache; vengono salvate al primo utilizzo.
const CACHE = "canalocad-v16.5";
const PRECACHE = ["./", "./Canalo.html", "./manifest.webmanifest", "./icon.svg"];
const CDN_HOSTS = ["cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com", "unpkg.com"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(PRECACHE.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("canalocad-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    return (await cache.match(request, { ignoreSearch: true })) || (await cache.match("./Canalo.html")) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  // Le risposte opache (no-cors, es. font) hanno status 0 ma sono comunque riutilizzabili
  if (response.ok || response.type === "opaque") cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(request.mode === "navigate" || url.pathname.endsWith(".html") ? networkFirst(request) : cacheFirst(request));
  } else if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request));
  }
});
