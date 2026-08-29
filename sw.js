// Service worker : rend l'application utilisable hors ligne (mode démo).
const CACHE = 'livre-magique-v18';

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
  './js/minijeux.js',
  './js/prompt.js',
  './js/qualite.js',
  './js/scene.js',
  './js/state.js',
  './js/surlignage.js',
  './js/storage.js',
  './js/tts.js',
  './js/util.js',
  './js/voix.js',
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

// Réseau d'abord (avec repli sur le cache) : une nouvelle version publiée est
// visible dès le rechargement suivant, et l'application marche toujours hors ligne.
const DELAI_RESEAU = 3500;

async function depuisReseau(requete) {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), DELAI_RESEAU);
  try {
    const reponse = await fetch(requete, { signal: controleur.signal });
    if (reponse.ok) {
      const copie = reponse.clone();
      caches.open(CACHE).then((cache) => cache.put(requete, copie));
    }
    return reponse;
  } finally {
    clearTimeout(minuteur);
  }
}

self.addEventListener('fetch', (event) => {
  const requete = event.request;
  // L'API Claude, la synthèse vocale et toute requête externe passent directement par le réseau.
  if (requete.method !== 'GET' || new URL(requete.url).origin !== self.location.origin) return;

  event.respondWith(
    depuisReseau(requete).catch(async () => {
      const enCache = await caches.match(requete);
      if (enCache) return enCache;
      if (requete.mode === 'navigate') return caches.match('./index.html');
      throw new Error('Ressource indisponible hors ligne');
    }),
  );
});
