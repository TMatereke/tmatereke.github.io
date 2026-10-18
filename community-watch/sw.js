const CACHE_NAME = 'commonground-community-watch-v1';
const APP_ROOT = new URL('./', self.location.href);
const APP_FILES = [
  new URL('./', self.location.href).href,
  new URL('./index.html', self.location.href).href,
  new URL('./manifest.webmanifest', self.location.href).href,
  new URL('./icon.svg', self.location.href).href
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('commonground-community-watch-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || !requestUrl.href.startsWith(APP_ROOT.href)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(new URL('./index.html', self.location.href).href, copy));
      return response;
    }).catch(async () => (await caches.match(event.request)) || (await caches.match(new URL('./index.html', self.location.href).href))));
    return;
  }

  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
    return response;
  })));
});
