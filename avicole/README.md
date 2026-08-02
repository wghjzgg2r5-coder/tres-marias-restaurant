# 🐔 Gestion Avicole — application de gestion pour ferme de poules pondeuses

Application web **autonome, mono-fichier, 100 % en français**, conçue pour la
gestion administrative et de production d'une exploitation de poules pondeuses
(paramétrée pour ~24 000 poules, souche **Hy-Line Brown**, élevage **Code 0 –
Bio**, réparties en **2 lots / bâtiments** — tout est modifiable).

- **Aucun serveur requis** : ouvrez `index.html` dans un navigateur (double-clic)
  ou consultez-la en ligne (GitHub Pages : `…/avicole/`).
- **Fonctionne hors-ligne** : toutes les librairies sont embarquées dans
  `./vendor` — **aucune donnée n'est envoyée à l'extérieur** (conforme RGPD,
  données d'exploitation confidentielles).
- **Persistance locale** via **IndexedDB** (gros volumes quotidiens sur plusieurs
  années).
- **Responsive** : utilisable sur tablette dans le bâtiment d'élevage.
- **Données de démonstration** chargées au premier lancement pour tester
  immédiatement.

## Démarrage

1. Ouvrez `avicole/index.html` dans un navigateur récent (Chrome, Edge, Firefox,
   Safari).
2. Au premier lancement, un jeu de données de démonstration est créé (2 lots,
   ~3 mois de production, clients, factures, stocks, etc.).
3. Explorez les modules via le menu latéral. Pour repartir de zéro :
   **Export / Sauvegarde → Tout effacer**.

> Astuce : pensez à **exporter régulièrement une sauvegarde JSON**
> (module *Export / Sauvegarde*). Les données vivent dans le navigateur de la
> machine ; une sauvegarde sur clé USB / disque protège contre une perte.

## Architecture des fichiers

```
avicole/
├── index.html      ← toute l'application (HTML + CSS + JS, commentés en français)
├── README.md       ← ce fichier
└── vendor/         ← librairies embarquées (aucun appel réseau)
    ├── chart.umd.min.js               (Chart.js — graphiques)
    ├── xlsx.full.min.js               (SheetJS — export Excel .xlsx)
    ├── jspdf.umd.min.js               (jsPDF — export PDF)
    └── jspdf.plugin.autotable.min.js  (tableaux PDF)
```

Le code de `index.html` est organisé en sections numérotées : couche IndexedDB,
utilitaires (dates FR, formatage, validation), courbe standard Hy-Line, état
global, navigation, puis un bloc par module.

## Schéma de données (IndexedDB — base `GestionAvicole`)

Chaque *object store* a une clé primaire `id` (sauf `parametres`, clé `cle`).

| Store | Rôle | Champs principaux |
|---|---|---|
| `lots` | Lots / bandes | `nom, batiment, souche, effectifInitial, dateMiseEnPlace, ageMiseEnPlaceSemaines, codeElevage, statut, notes` |
| `production` | Saisie quotidienne | `lotId, date, oeufsPondus, oeufsDeclasses, mortalite, consoAliment(kg), consoEau(L), poidsMoyen, tempMin, tempMax, hygrometrie, remarques` |
| `mouvements` | Registre entrées/sorties | `lotId, date, type(entree\|sortie\|mortalite\|reforme), nombre, motif, tiers, origine` |
| `traitements` | Traitements vétérinaires | `lotId, date, produit, motif, dose, voie, dureeJours, delaiAttenteOeufsJours, veterinaire, ordonnance` |
| `sanitaire` | Plan de maîtrise sanitaire | `type(salmonelle\|vaccination\|desinfection\|nettoyage…), lotId, dateRealisation, dateEcheance, resultat, laboratoire, reference` |
| `clients` | Fiches clients | `nom, type, adresse, siret, contact, tel, email` |
| `factures` | Factures & bons de livraison | `numero, type(facture\|bl), clientId, date, echeance, statut, lignes[], notes` |
| `cotations` | Mercuriale œufs | `date, calibre, prix, source` |
| `fournisseurs` | Fournisseurs | `nom, type, contact, tel, email, adresse, produits` |
| `stocks` | Articles en stock | `categorie, designation, unite, quantite, seuilAlerte, prixUnitaire, fournisseurId` |
| `mvtStock` | Mouvements de stock | `stockId, date, type, quantite, motif` |
| `achats` | Factures d'achat | `fournisseurId, date, numero, lignes[]` |
| `charges` | Charges (coût de revient) | `lotId, date, categorie, libelle, montant` |
| `parametres` | Réglages | `exploitation, facturation, objectifs, seedFait` |

**Indices** : `production`/`mouvements`/`traitements` indexés sur `date` et
`lotId` ; `sanitaire` sur `type, lotId, dateEcheance` ; etc.

**Effectif présent** : calculé à partir des `mouvements` (le registre fait foi).
S'il existe une entrée « mise en place », on somme entrées − sorties/mortalité/
réformes ; sinon on part de `effectifInitial`. La mortalité saisie en production
est automatiquement reportée dans le registre (mouvement `origine:'production'`).

## Modules

1. **Tableau de bord** — KPI du jour avec code couleur vs objectifs (taux de
   ponte, mortalité 7 j, aliment, ratio eau/aliment, cheptel), alertes
   automatiques, courbe de ponte 30 j **vs standard Hy-Line**, conso aliment/eau,
   synthèse par lot, échéances.
2. **Saisie production** — formulaire rapide par lot avec calculs en direct (taux
   de ponte, mortalité, indice de consommation, ratio eau/aliment,
   aliment/poule), historique éditable, export Excel. Validation des saisies
   (valeurs aberrantes bloquées).
3. **Registre d'élevage** — lots/bandes, mouvements entrées/sorties/mortalité/
   réformes, traitements vétérinaires avec **calcul automatique du délai d'attente
   œufs**, **export PDF conforme pour la DDPP**.
4. **Suivi sanitaire** — autocontrôles Salmonelles, vaccinations, nettoyages/
   désinfections, calendrier & rappels d'échéances.
5. **Gestion commerciale** — clients, factures & bons de livraison (numérotation
   auto, HT/TVA/TTC, **export PDF**), cotations œufs (mercuriale), chiffre
   d'affaires mensuel/annuel.
6. **Stocks & achats** — stock aliment/emballages avec **seuils d'alerte**,
   fournisseurs, saisie d'achats (met à jour le stock), **bons de commande PDF**.
7. **Indicateurs économiques** — **coût de revient par œuf** (aliment + charges),
   marge par lot et globale, décomposition graphique, export Excel.
8. **Export / Sauvegarde** — **sauvegarde/restauration JSON** complète, exports
   Excel & PDF par module, rechargement des données de démo, réinitialisation.
9. **Paramètres** — exploitation (SIRET, n° cheptel, souche, code élevage),
   facturation (TVA, numérotation `F2026-001`…), objectifs & seuils d'alerte.

## Paramètres par défaut (modifiables dans l'application)

- **Souche** : Hy-Line Brown (courbe de ponte standard intégrée, interpolée par
  âge en semaines).
- **Mode d'élevage** : Code 0 (Bio).
- **TVA** œufs : 5,5 % · **Numérotation factures** : `F` + `AAAA-NNN`
  (ex. `F2026-001`).
- **Objectifs** : taux de ponte min 88 %, mortalité hebdo max 0,35 %,
  poids œuf moyen 63 g, etc.

## Compatibilité & confidentialité

- Nécessite un navigateur autorisant **IndexedDB** (le mode navigation privée
  peut restreindre le stockage).
- **Aucune télémétrie, aucun CDN, aucun appel réseau** : toutes les dépendances
  sont servies depuis `./vendor`. Les données restent sur la machine.

## Dépendances embarquées

Chart.js 4.4.1 · SheetJS (xlsx) 0.18.5 · jsPDF 2.5.1 · jsPDF-AutoTable 3.8.2
(licences MIT / Apache-2.0).
