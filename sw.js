// Service worker : rend l'application utilisable hors ligne (mode démo).
const CACHE = 'livre-magique-v1';

const FICHIERS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/api.js',
  './js/config.js',
  './js/demo.js',
  './js/dice.js',
  './js/prompt.js',
  './js/scene.js',
  './js/state.js',
  './js/storage.js',
  './js/tts.js',
  './js/util.js',
  './icons/icone.svg',
  './icons/icone-192.png',
  './icons/icone-512.png',
  './icons/icone-180.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(FICHIERS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const requete = event.request;
  // L'API Claude et toute requête externe passent directement par le réseau.
  if (requete.method !== 'GET' || new URL(requete.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(requete).then((enCache) => {
      const reseau = fetch(requete)
        .then((reponse) => {
          if (reponse.ok) {
            const copie = reponse.clone();
            caches.open(CACHE).then((cache) => cache.put(requete, copie));
          }
          return reponse;
        })
        .catch(() => enCache || caches.match('./index.html'));
      return enCache || reseau;
    }),
  );
});
