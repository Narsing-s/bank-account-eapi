// Simple offline-first cache for static assets
const CACHE = 'bank-portal-cache-v1';
const ASSETS = ['/', '/index.html', '/style.css', '/script.js', '/manifest.json'];
self.addEventListener('install',(e)=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',(e)=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))))});
self.addEventListener('fetch',(e)=>{
  const url = new URL(e.request.url);
  if (e.request.method === 'GET' && url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c=>c.put(e.request, copy));
      return resp;
    })));
  }
});
