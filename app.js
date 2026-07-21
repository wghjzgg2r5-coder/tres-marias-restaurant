/* =====================================================================
   app.js — Navigation par onglets, rendu des vues, détection réseau,
   enregistrement du service worker. JavaScript vanilla, sans framework.
   ===================================================================== */

(function () {
  "use strict";

  var D = TRIP_DATA;
  var REG = D.regions;
  var EFF = D.effort;

  // ---- Petits utilitaires -------------------------------------------------
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function regionColorVar(key) {
    // ex: city -> var(--color-city)
    return "var(--color-" + key + ")";
  }

  // Index du jour affiché dans la vue "Aujourd'hui"
  var currentDayIndex = 0;

  // ---- Détermination du jour courant selon la date système ----------------
  function todayIndex() {
    var now = new Date();
    // Comparaison sur AAAA-MM-JJ locale, sans heure
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    var todayIso = y + "-" + m + "-" + d;

    for (var i = 0; i < D.days.length; i++) {
      if (D.days[i].isoDate === todayIso) return i;
    }
    // Hors des dates du voyage -> Jour 1 (index 0)
    return 0;
  }

  // =======================================================================
  // VUE 1 : AUJOURD'HUI — rendu de la fiche d'un jour
  // =======================================================================
  function renderDay(index) {
    currentDayIndex = index;
    var day = D.days[index];
    var region = REG[day.region];
    var effort = EFF[day.effort];

    el("today-progress").textContent = "Jour " + day.id + " / " + D.days.length;

    var warningHtml = "";
    if (day.practicalWarning) {
      warningHtml =
        '<div class="warning" role="note">' +
          '<span class="warn-icon" aria-hidden="true">⚠️</span>' +
          '<span>' + esc(day.practicalWarning) + '</span>' +
        '</div>';
    }

    var accomLinkHtml = "";
    if (day.accommodationLink) {
      accomLinkHtml =
        '<a class="accommodation-btn" href="' + esc(day.accommodationLink) + '" ' +
          'target="_blank" rel="noopener" aria-label="Ouvrir les logements pour ' +
          esc(day.place) + ' (nécessite internet)">' +
          '<span aria-hidden="true">🔗</span> Voir des logements' +
        '</a>';
    }

    var html =
      '<article class="day-card" style="--region-color:' + regionColorVar(day.region) + '">' +
        '<div class="day-hero">' +
          '<div class="day-kicker">' +
            '<span class="day-num">Jour ' + day.id + '</span>' +
            '<span class="badge" style="background:' + regionColorVar(day.region) + '">' +
              esc(region.label) + '</span>' +
            '<span class="effort" title="' + esc(effort.label) + '">' +
              '<span class="dots" style="color:' + effort.color + '" aria-hidden="true">' +
                effort.dots + '</span>' + esc(effort.label) +
            '</span>' +
          '</div>' +
          '<h1>' + esc(day.place) + '</h1>' +
          '<div class="day-date">' + esc(day.dateLabel) + '</div>' +
        '</div>' +

        '<div class="day-section">' +
          '<h2>Au programme</h2>' +
          '<p>' + esc(day.detail) + '</p>' +
        '</div>' +

        warningHtml +

        '<div class="day-section">' +
          '<h2>Trajet</h2>' +
          '<p><strong>' + esc(day.transportNote) + '</strong></p>' +
          '<p>' + esc(day.transportDetail) + '</p>' +
          '<div class="info-row"><span class="info-label">Durée</span>' +
            '<span class="info-value">' + esc(day.transportDuration) + '</span></div>' +
          '<div class="info-row"><span class="info-label">Coût</span>' +
            '<span class="info-value">' + esc(day.transportCost) + '</span></div>' +
        '</div>' +

        '<div class="day-section">' +
          '<h2>Logement</h2>' +
          '<p>' + esc(day.accommodation) + '</p>' +
          '<div class="info-row"><span class="info-label">Budget nuit</span>' +
            '<span class="info-value">' + esc(day.accommodationPrice) + '</span></div>' +
          accomLinkHtml +
        '</div>' +

        '<div class="day-section">' +
          '<h2>Pourquoi cette étape</h2>' +
          '<p>' + esc(day.whyThisStep) + '</p>' +
        '</div>' +
      '</article>' +

      '<div class="day-nav">' +
        '<button id="prev-day" aria-label="Jour précédent"' +
          (index === 0 ? ' disabled' : '') + '>◀ Jour précédent</button>' +
        '<button id="next-day" aria-label="Jour suivant"' +
          (index === D.days.length - 1 ? ' disabled' : '') + '>Jour suivant ▶</button>' +
      '</div>';

    el("day-card-mount").innerHTML = html;

    var prev = el("prev-day"), next = el("next-day");
    if (prev) prev.addEventListener("click", function () {
      if (currentDayIndex > 0) { renderDay(currentDayIndex - 1); scrollTop(); }
    });
    if (next) next.addEventListener("click", function () {
      if (currentDayIndex < D.days.length - 1) { renderDay(currentDayIndex + 1); scrollTop(); }
    });

    updateFab();
  }

  function scrollTop() { window.scrollTo({ top: 0, behavior: "smooth" }); }

  // =======================================================================
  // VUE 2 : CALENDRIER
  // =======================================================================
  function renderCalendar() {
    var ti = todayIndex();
    var html = '<div class="cal-grid">';

    D.days.forEach(function (day, i) {
      if (i === 0) html += '<div class="cal-week-label">Semaine 1</div>';
      if (i === 7) html += '<div class="cal-week-label">Semaine 2</div>';

      var region = REG[day.region];
      var effort = EFF[day.effort];
      var isToday = (i === ti);

      html +=
        '<button class="cal-cell' + (isToday ? ' is-today' : '') + '" ' +
          'style="--region-color:' + regionColorVar(day.region) + '" ' +
          'data-day-index="' + i + '" ' +
          'aria-label="Jour ' + day.id + ', ' + esc(day.place) + '. ' + esc(effort.label) + '">' +
          '<span class="cal-band" aria-hidden="true"></span>' +
          '<span class="cal-body">' +
            '<span class="cal-daynum">' +
              '<span>Jour ' + day.id + '</span>' +
              '<span class="cal-effort-dots" style="color:' + effort.color + '" ' +
                'aria-hidden="true">' + effort.dots + '</span>' +
            '</span>' +
            '<span class="cal-place">' + esc(day.place) + '</span>' +
            '<span class="cal-summary">' + esc(day.summary) + '</span>' +
          '</span>' +
        '</button>';
    });

    html += '</div>';
    el("calendar-mount").innerHTML = html;

    var cells = el("calendar-mount").querySelectorAll(".cal-cell");
    Array.prototype.forEach.call(cells, function (cell) {
      cell.addEventListener("click", function () {
        var idx = parseInt(cell.getAttribute("data-day-index"), 10);
        renderDay(idx);
        activateView("today");
        scrollTop();
      });
    });
  }

  // =======================================================================
  // VUE 3 : CARTE — légende + liste des étapes
  // =======================================================================
  function renderMap() {
    // Légende régions + code trait
    var swatches = "";
    Object.keys(REG).forEach(function (key) {
      swatches +=
        '<span class="legend-item">' +
          '<span class="legend-swatch" style="background:' + regionColorVar(key) + '"></span>' +
          esc(REG[key].label) +
        '</span>';
    });

    var legendHtml =
      '<div class="legend-group">' +
        '<h3>Régions</h3>' +
        '<div class="legend-items">' + swatches + '</div>' +
      '</div>' +
      '<div class="legend-group">' +
        '<h3>Type de trajet</h3>' +
        '<div class="legend-items">' +
          '<span class="legend-item"><span class="legend-line"></span>Bus / route</span>' +
          '<span class="legend-item"><span class="legend-line dashed"></span>Avion</span>' +
        '</div>' +
      '</div>';

    el("map-legend-mount").innerHTML = legendHtml;

    // Liste des étapes
    var stagesHtml = "";
    D.mapStages.forEach(function (stage) {
      stagesHtml +=
        '<button class="stage-item" style="--region-color:' + regionColorVar(stage.region) + '" ' +
          'data-day-index="' + firstDayIndexForStage(stage) + '" ' +
          'aria-label="Étape ' + stage.num + ', ' + esc(stage.label) + ', ' + esc(stage.days) + '">' +
          '<span class="stage-num" aria-hidden="true">' + stage.num + '</span>' +
          '<span class="stage-text">' +
            '<span class="stage-label">' + esc(stage.label) + '</span>' +
            '<span class="stage-days">' + esc(stage.days) + '</span>' +
          '</span>' +
          '<span class="stage-chevron" aria-hidden="true">›</span>' +
        '</button>';
    });
    el("stage-list-mount").innerHTML = stagesHtml;

    var items = el("stage-list-mount").querySelectorAll(".stage-item");
    Array.prototype.forEach.call(items, function (item) {
      item.addEventListener("click", function () {
        var idx = parseInt(item.getAttribute("data-day-index"), 10);
        renderDay(idx);
        activateView("today");
        scrollTop();
      });
    });
  }

  // Le "Jours 1–3" -> premier numéro de jour de l'étape -> index dans D.days
  function firstDayIndexForStage(stage) {
    var m = String(stage.days).match(/\d+/);
    if (!m) return 0;
    var dayId = parseInt(m[0], 10);
    for (var i = 0; i < D.days.length; i++) {
      if (D.days[i].id === dayId) return i;
    }
    return 0;
  }

  // =======================================================================
  // VUE 4 : PRATIQUE — Trajets, Budget, Infos
  // =======================================================================
  function renderLegs() {
    var offline = !navigator.onLine;
    var html = "";

    D.legs.forEach(function (leg) {
      var bookHtml;
      if (!leg.bookingURL) {
        bookHtml = '<p class="book-none">Réservation sur place, pas de lien en ligne.</p>';
      } else if (offline) {
        bookHtml =
          '<div class="book-offline" data-book-url="' + esc(leg.bookingURL) + '" ' +
            'data-book-platform="' + esc(leg.bookingPlatform) + '">' +
            '<span aria-hidden="true">📶</span> Connexion nécessaire pour réserver' +
          '</div>';
      } else {
        bookHtml =
          '<a class="book-btn" href="' + esc(leg.bookingURL) + '" target="_blank" ' +
            'rel="noopener" data-book-url="' + esc(leg.bookingURL) + '" ' +
            'data-book-platform="' + esc(leg.bookingPlatform) + '" ' +
            'aria-label="Réserver via ' + esc(leg.bookingPlatform) + ' (nécessite internet)">' +
            'Réserver · ' + esc(leg.bookingPlatform) +
          '</a>';
      }

      html +=
        '<article class="leg-card">' +
          '<h3>' + esc(leg.title) + '</h3>' +
          '<div class="leg-meta">' +
            '<span class="leg-chip">⏱ ' + esc(leg.duration) + '</span>' +
            '<span class="leg-chip">💶 ' + esc(leg.cost) + '</span>' +
          '</div>' +
          '<p>' + esc(leg.howAndWhy) + '</p>' +
          '<div class="leg-alt">' +
            '<p><strong>Alternative écartée :</strong> ' + esc(leg.alternative) + '</p>' +
            '<p>' + esc(leg.whyNotAlternative) + '</p>' +
          '</div>' +
          bookHtml +
        '</article>';
    });

    el("legs-mount").innerHTML = html;
  }

  function renderBudget() {
    var low = D.budget.reduce(function (s, it) { return s + it.lowEstimate; }, 0);
    var high = D.budget.reduce(function (s, it) { return s + it.highEstimate; }, 0);

    var html =
      '<div class="budget-total">' +
        '<div class="bt-label">Budget total estimé</div>' +
        '<div class="bt-amount">' + low + ' € à ' + high + ' €</div>' +
        '<div class="bt-note">par personne, hors vols internationaux.</div>' +
      '</div>';

    D.budget.forEach(function (it) {
      html +=
        '<div class="budget-item">' +
          '<div class="bi-head">' +
            '<span class="bi-cat">' + esc(it.category) + '</span>' +
            '<span class="bi-range">' + it.lowEstimate + '–' + it.highEstimate + ' €</span>' +
          '</div>' +
          '<div class="bi-detail">' + esc(it.detail) + '</div>' +
        '</div>';
    });

    el("budget-mount").innerHTML = html;
  }

  function renderInfo() {
    var html = '<div class="info-list">';
    D.usefulInfo.forEach(function (tip) {
      html +=
        '<div class="info-tip">' +
          '<span class="tip-icon" aria-hidden="true">' + tip.icon + '</span>' +
          '<span class="tip-text">' + esc(tip.text) + '</span>' +
        '</div>';
    });
    html += '</div>';
    el("info-mount").innerHTML = html;
  }

  // Sous-onglets (pills) de la vue Pratique
  function initPills() {
    var pills = document.querySelectorAll(".pill");
    Array.prototype.forEach.call(pills, function (pill) {
      pill.addEventListener("click", function () {
        var target = pill.getAttribute("data-subview");
        Array.prototype.forEach.call(pills, function (p) {
          var on = (p === pill);
          p.classList.toggle("active", on);
          p.setAttribute("aria-selected", on ? "true" : "false");
        });
        ["legs", "budget", "info"].forEach(function (name) {
          el("subview-" + name).classList.toggle("active", name === target);
        });
      });
    });
  }

  // =======================================================================
  // Navigation entre vues (tab bar)
  // =======================================================================
  function activateView(name) {
    var views = document.querySelectorAll(".view");
    Array.prototype.forEach.call(views, function (v) {
      v.classList.toggle("active", v.getAttribute("data-view") === name);
    });

    var tabs = document.querySelectorAll(".tab");
    Array.prototype.forEach.call(tabs, function (t) {
      var on = (t.getAttribute("data-target") === name);
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });

    updateFab();
  }

  function initTabs() {
    var tabs = document.querySelectorAll(".tab");
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener("click", function () {
        activateView(tab.getAttribute("data-target"));
        scrollTop();
      });
    });
  }

  // Bouton flottant "Aujourd'hui" : visible sauf quand on est déjà
  // sur la vue Today en train de regarder le jour du voyage en cours.
  function updateFab() {
    var fab = el("today-fab");
    var todayView = el("view-today").classList.contains("active");
    var onCurrentDay = (currentDayIndex === todayIndex());
    var hide = todayView && onCurrentDay;
    fab.classList.toggle("hidden", hide);
  }

  function initFab() {
    el("today-fab").addEventListener("click", function () {
      renderDay(todayIndex());
      activateView("today");
      scrollTop();
    });
  }

  // =======================================================================
  // Détection réseau
  // =======================================================================
  function applyNetworkState() {
    var offline = !navigator.onLine;
    document.body.classList.toggle("is-offline", offline);
    // Re-rendre les trajets pour basculer boutons Réserver <-> message
    renderLegs();
  }

  function initNetwork() {
    window.addEventListener("online", applyNetworkState);
    window.addEventListener("offline", applyNetworkState);
    applyNetworkState();
  }

  // =======================================================================
  // Service worker
  // =======================================================================
  function initServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("service-worker.js").catch(function (err) {
          // En file:// ou navigateur non compatible, on ignore silencieusement :
          // le site reste pleinement fonctionnel, sans le cache hors-ligne.
          console.warn("Service worker non enregistré :", err);
        });
      });
    }
  }

  // =======================================================================
  // Démarrage
  // =======================================================================
  function init() {
    renderDay(todayIndex());  // ouverture directe sur le jour courant
    renderCalendar();
    renderMap();
    renderBudget();
    renderInfo();
    // renderLegs() est appelé par initNetwork()
    initPills();
    initTabs();
    initFab();
    initNetwork();
    initServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
