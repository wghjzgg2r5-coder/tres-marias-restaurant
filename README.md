# Colombie — Carnet de voyage 🇨🇴

Un **carnet de voyage numérique**, mono-page et **100 % hors-ligne**, pour un
séjour de 14 jours en Colombie (13 → 26 août), à deux. Le site tient dans un
simple `index.html` : aucune dépendance, aucun framework, aucun build.

Une fois ouvert une première fois (servi via HTTPS ou un petit serveur local),
il fonctionne **entièrement sans connexion** : itinéraire, calendrier, carte,
budget, trajets et infos utiles sont tous embarqués. Seuls les boutons
« Réserver » vers des sites externes nécessitent internet, et se dégradent
proprement en message clair quand le réseau est absent.

---

## 📁 Contenu

```
/
├── index.html          Structure de la page (4 vues + carte SVG inline)
├── styles.css          Thème mobile-first, variables CSS, mode sombre
├── app.js              Navigation, rendu des vues, détection réseau, service worker
├── data.js             Toutes les données du voyage (const TRIP_DATA)
├── manifest.json       Manifest PWA (nom, icônes, standalone)
├── service-worker.js   Cache hors-ligne (cache-first + fallback réseau)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

Les **4 vues** (onglets en bas d'écran) :

1. **Aujourd'hui** — s'ouvre directement sur le jour du voyage correspondant à
   la date système (sinon Jour 1). Navigation ◀ / ▶ jour par jour.
2. **Calendrier** — grille des 14 jours, bandeau coloré par région, effort.
3. **Carte** — SVG schématique fait main, 4 étapes numérotées, légendes.
4. **Pratique** — sous-onglets Trajets / Budget / Infos utiles.

---

## ▶️ Tester en local

Le plus simple pour une simple relecture : **double-cliquez sur `index.html`**.
Tout le contenu s'affiche immédiatement.

> ⚠️ **Nuance importante sur le service worker.** Ouvert en `file://`
> (double-clic direct), le navigateur **refuse d'enregistrer le service
> worker** pour des raisons de sécurité. Le site reste pleinement consultable,
> mais le **cache hors-ligne** ne s'active pas. Pour tester réellement le mode
> hors-ligne et l'installation PWA, servez le dossier via HTTP :

```bash
# Depuis le dossier du projet :
python3 -m http.server 8000
# puis ouvrez http://localhost:8000 dans le navigateur
```

Vérifier le hors-ligne : chargez la page une fois, puis dans les DevTools
(onglet *Network* → *Offline*, ou coupez le Wi-Fi) rechargez : tout reste
accessible.

---

## 🌐 Déployer en un lien public gratuit

Le site étant 100 % statique, n'importe quel hébergement statique convient.

### Option A — Netlify Drop (le plus rapide, sans compte git)
1. Allez sur **https://app.netlify.com/drop**
2. Glissez-déposez le **dossier complet** du projet dans la zone indiquée.
3. Netlify renvoie aussitôt une URL publique en HTTPS (ex.
   `https://xxxx.netlify.app`) — c'est votre **lien unique** à partager.

### Option B — GitHub Pages
1. Poussez ces fichiers à la racine d'un dépôt GitHub.
2. Dans **Settings → Pages**, choisissez la branche (ex. `main`) et le dossier
   racine `/`.
3. GitHub publie le site sur `https://<utilisateur>.github.io/<dépôt>/`.
   > Le fichier `.nojekyll` présent à la racine évite tout traitement Jekyll.

### Option C — Vercel
1. `vercel` (CLI) depuis le dossier, ou import du dépôt sur vercel.com.
2. Aucune configuration : détecté comme site statique.

> Le service worker et l'installation PWA nécessitent **HTTPS** — c'est fourni
> automatiquement par Netlify, GitHub Pages et Vercel.

---

## 📲 Ajouter à l'écran d'accueil sur iPhone (Safari)

1. Ouvrez le lien public dans **Safari** (pas dans une autre app).
2. Touchez le bouton **Partager** (le carré avec la flèche vers le haut).
3. Choisissez **« Sur l'écran d'accueil »**.
4. Validez : une icône « Colombie » apparaît sur l'écran d'accueil.

En la lançant, le site s'ouvre **en plein écran, sans barre d'adresse**, comme
une vraie app (`display: standalone`). Après cette première ouverture connectée,
tout le voyage reste consultable **hors-ligne**.

---

## 🎨 Détails techniques

- **HTML5 + CSS3 + JavaScript vanilla**, aucune dépendance, aucun build step.
- Données **codées en dur** dans `data.js` (`const TRIP_DATA = {…}`) — aucun
  fetch, aucun backend, aucune base de données.
- **Mobile-first**, variables CSS (`:root { --color-city: … }`), zones de tap
  ≥ 44 px, tailles en `rem` (respect des réglages d'accessibilité iOS).
- **Mode sombre** automatique via `prefers-color-scheme: dark`.
- **Carte 100 % offline** : SVG inline fait main (pas de Leaflet/Mapbox, pas de
  tuiles réseau), `viewBox` responsive du iPhone SE au Pro Max.
- **Détection réseau** : bandeau discret « Hors ligne » via les événements
  `online` / `offline` ; les boutons « Réserver » deviennent un message clair.
- **Accessibilité** : HTML sémantique (`<nav>`, `<main>`, `<section>`,
  hiérarchie `<h1>`–`<h3>`), `aria-label` sur boutons et cartes, contrastes
  WCAG AA.
- Aucun compte, aucune authentification, aucun analytics, aucune permission
  (pas de géolocalisation, pas de notifications).

---

## ✏️ Modifier les données du voyage

Tout se trouve dans **`data.js`** :

- `TRIP_DAYS` — les 14 jours (lieu, région, effort, détails, trajet, logement…).
- `TRANSPORT_LEGS` — les 9 trajets (durée, prix, alternative, lien de réservation).
- `BUDGET_ITEMS` — les postes de budget (le total est **calculé en JavaScript**,
  pas codé en dur).
- `REGIONS` / `EFFORT` — couleurs et libellés (miroirs des variables CSS).
- `USEFUL_INFO` / `MAP_STAGES` — infos utiles et étapes de la carte.

Après modification, si vous avez changé un fichier mis en cache, incrémentez
`CACHE_NAME` dans `service-worker.js` (ex. `colombie-voyage-v2`) pour forcer la
mise à jour du cache chez les visiteurs.

---

*Prix indiqués par personne, estimations 2025-2026 à reconfirmer au moment de
réserver. Vérifiez toujours qu'un vol intérieur est direct avant d'acheter.*
