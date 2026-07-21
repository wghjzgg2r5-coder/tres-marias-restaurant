/* =====================================================================
   service-worker.js — Fonctionnement 100% hors-ligne.

   Stratégies :
   - "cache first" pour les assets du site (HTML, CSS, JS, icônes, manifest) :
     dès la première visite, tout est mis en cache, puis servi depuis le cache.
   - "network first avec fallback" pour les requêtes de navigation externes
     (liens de réservation ouverts en dehors du scope) : on tente le réseau,
     et en cas d'échec on renvoie une réponse claire.
   ===================================================================== */

var CACHE_NAME = "colombie-voyage-v1";

// Tous les fichiers du site, mis en cache dès l'installation.
var ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// ---- Installation : pré-cache de tous les assets --------------------------
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// ---- Activation : nettoyage des anciens caches ----------------------------
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ---- Interception des requêtes -------------------------------------------
self.addEventListener("fetch", function (event) {
  var req = event.request;

  // On ne gère que les GET.
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  var sameOrigin = (url.origin === self.location.origin);

  if (sameOrigin) {
    // ----- Assets du site : CACHE FIRST -----
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) return cached;
        // Pas encore en cache : on va le chercher et on le stocke.
        return fetch(req).then(function (resp) {
          if (resp && resp.status === 200 && resp.type === "basic") {
            var copy = resp.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(req, copy);
            });
          }
          return resp;
        }).catch(function () {
          // Hors-ligne et non caché : pour une navigation, on retombe sur
          // la page d'accueil déjà en cache.
          if (req.mode === "navigate") return caches.match("./index.html");
        });
      })
    );
  } else {
    // ----- Liens externes (réservation) : NETWORK FIRST avec fallback -----
    event.respondWith(
      fetch(req).catch(function () {
        return new Response(
          "Connexion nécessaire pour accéder à ce service de réservation.",
          {
            status: 503,
            statusText: "Hors ligne",
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          }
        );
      })
    );
  }
});
