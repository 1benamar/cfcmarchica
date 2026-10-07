(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var escHTML = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var waLink = function (text) {
    return "https://wa.me/" + (data.whatsapp || "212661214201") + "?text=" + encodeURIComponent(text);
  };

  function setCardStatus(text) {
    var el = $("[data-pcard-status]");
    if (el) el.textContent = text;
  }

  /* ---------- Splash ---------- */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    var count = $("[data-splash-count]");
    var start = performance.now();
    var done = false;
    var hide = function () {
      if (done) return;
      done = true;
      if (count) count.textContent = "100";
      splash.classList.add("is-out");
    };
    (function tick(now) {
      var p = Math.min((now - start) / 800, 1);
      if (count) count.textContent = String(Math.round(p * 100));
      if (p < 1 && !done) requestAnimationFrame(tick);
    })(start);
    if (document.readyState === "complete") setTimeout(hide, 850);
    else window.addEventListener("load", function () { setTimeout(hide, 500); });
    setTimeout(hide, 3000);
  }

  /* ---------- Barra de progreso + nav que se esconde ---------- */
  function initScrollUI() {
    var bar = $("[data-progress]");
    var nav = $("[data-nav]");
    var menu = $("[data-menu]");
    var lastY = window.scrollY;
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
      if (nav && !(menu && menu.classList.contains("is-open"))) {
        nav.classList.toggle("is-hidden", y > lastY && y > 400);
      }
      lastY = y;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  function initMenu() {
    var burger = $("[data-burger]");
    var menu = $("[data-menu]");
    if (!burger || !menu) return;
    var setOpen = function (open) {
      menu.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.textContent = open ? "Fermer" : "Menu";
      document.body.style.overflow = open ? "hidden" : "";
    };
    menu.id = "menu";
    burger.addEventListener("click", function () { setOpen(!menu.classList.contains("is-open")); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });

    // Enlace activo según la sección visible
    var links = {};
    $$("a", menu).forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = links[e.target.id];
        if (a) a.classList.toggle("is-active", e.isIntersecting);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Cursor con coordenadas de Nador ---------- */
  function initCursor() {
    if (!canHover) return;
    var cursor = $("[data-cursor]");
    var label = $("[data-cursor-label]");
    if (!cursor) return;
    window.addEventListener("mousemove", function (e) {
      cursor.classList.add("is-on");
      cursor.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
      if (label) {
        var lat = 35.1681 + (0.5 - e.clientY / window.innerHeight) * 0.02;
        var lon = 2.9335 + (0.5 - e.clientX / window.innerWidth) * 0.03;
        label.textContent = "N " + lat.toFixed(4) + "° · W " + lon.toFixed(4) + "°";
      }
    }, { passive: true });
    document.addEventListener("mouseout", function (e) { if (!e.relatedTarget) cursor.classList.remove("is-on"); });
    document.addEventListener("mouseover", function (e) {
      var hit = e.target.closest && e.target.closest("a, button, label, summary, [data-pcard]");
      cursor.classList.toggle("is-link", !!hit);
    });
  }

  /* ---------- Reveal al hacer scroll ---------- */
  function initReveals() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-visible"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---------- Carte professionnelle: inclinación + giro ---------- */
  function initPcard() {
    var card = $("[data-pcard]");
    if (!card) return;
    var toggle = function () {
      var on = card.classList.toggle("is-flipped");
      card.setAttribute("aria-pressed", String(on));
    };
    card.addEventListener("click", toggle);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
    if (!canHover) return;
    var zone = card.parentElement;
    zone.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = "rotateY(" + (x * 18).toFixed(2) + "deg) rotateX(" + (-y * 14).toFixed(2) + "deg)";
    });
    zone.addEventListener("mouseleave", function () { card.style.transform = ""; });
  }

  /* ---------- Hora de Nador, abierto/cerrado ---------- */
  function initClock() {
    var h = data.hours || { open: 9, close: 17, openDays: [1, 2, 3, 4, 5, 6], timeZone: "Africa/Casablanca" };
    var days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    var wk = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat("en-US", { timeZone: h.timeZone, hourCycle: "h23", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch (e) {
      fmt = new Intl.DateTimeFormat("en-US", { hourCycle: "h23", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    var status = $("[data-status]");
    var statusText = $("[data-status-text]");
    var clock = $("[data-clock]");
    var state = $("[data-clock-state]");
    var needle = $("[data-day-now]");
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var openStr = pad(h.open) + ":00";

    function nextOpening(day, beforeOpen) {
      if (beforeOpen && h.openDays.indexOf(day) !== -1) return "à " + openStr;
      for (var i = 1; i <= 7; i++) {
        var d = (day + i) % 7;
        if (h.openDays.indexOf(d) !== -1) return (i === 1 ? "demain" : days[d]) + " à " + openStr;
      }
      return "";
    }

    function tick() {
      var parts = {};
      fmt.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      var hh = parseInt(parts.hour, 10) % 24, mm = parseInt(parts.minute, 10), ss = parseInt(parts.second, 10);
      var day = wk[parts.weekday];
      var mins = hh * 60 + mm;
      var isOpen = h.openDays.indexOf(day) !== -1 && mins >= h.open * 60 && mins < h.close * 60;
      var txt;
      if (isOpen) {
        var left = h.close * 60 - mins;
        txt = "Ouvert · ferme dans " + (left >= 60 ? Math.floor(left / 60) + " h " + pad(left % 60) : left + " min");
      } else {
        txt = "Fermé · ouvre " + nextOpening(day, mins < h.open * 60);
      }
      if (clock) clock.textContent = pad(hh) + ":" + pad(mm) + ":" + pad(ss);
      if (state) { state.textContent = txt; state.className = "clock__state mono " + (isOpen ? "is-open" : "is-closed"); }
      if (status) { status.classList.toggle("is-open", isOpen); status.classList.toggle("is-closed", !isOpen); }
      if (statusText) statusText.textContent = txt;
      if (needle) needle.style.left = ((mins + ss / 60) / 1440 * 100).toFixed(3) + "%";
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Quiz ---------- */
  function initQuiz() {
    var box = $("[data-quiz]");
    var body = $("[data-quiz-body]");
    var qs = data.quiz || [];
    if (!box || !body || !qs.length) return;
    var stepEl = $("[data-quiz-step]"), scoreEl = $("[data-quiz-score]"), bar = $("[data-quiz-bar]");
    var i = 0, score = 0;
    var letters = ["A", "B", "C", "D"];

    function top(answered) {
      if (stepEl) stepEl.textContent = "Question " + (i + 1) + " / " + qs.length;
      if (scoreEl) scoreEl.textContent = "Score " + score;
      if (bar) bar.style.width = ((i + (answered ? 1 : 0)) / qs.length * 100) + "%";
    }

    function render() {
      var q = qs[i];
      top(false);
      body.innerHTML =
        '<div class="quiz__card' + (q.sign ? "" : " quiz__card--nosign") + '">' +
          (q.sign ? '<div class="quiz__sign">' + q.sign + "</div>" : "") +
          "<div>" +
            '<p class="quiz__q">' + escHTML(q.q) + "</p>" +
            '<div class="quiz__opts">' +
              q.a.map(function (txt, k) {
                return '<button type="button" class="quiz__opt" data-k="' + k + '"><span class="mono">' + letters[k] + "</span>" + escHTML(txt) + "</button>";
              }).join("") +
            "</div>" +
            "<div data-quiz-after></div>" +
          "</div>" +
        "</div>";
      $$(".quiz__opt", body).forEach(function (btn) { btn.addEventListener("click", function () { answer(+btn.getAttribute("data-k")); }); });
      var first = $(".quiz__opt", body);
      if (first && box.contains(document.activeElement)) first.focus();
    }

    function answer(k) {
      var q = qs[i];
      var right = k === q.ok;
      if (right) score++;
      $$(".quiz__opt", body).forEach(function (btn, n) {
        btn.disabled = true;
        if (n === q.ok) btn.classList.add("is-right");
        else if (n === k) btn.classList.add("is-wrong");
        else btn.classList.add("is-dim");
      });
      top(true);
      var last = i === qs.length - 1;
      var after = $("[data-quiz-after]", body);
      after.innerHTML =
        '<div class="quiz__why"><b>' + (right ? "Bonne réponse" : "Pas tout à fait") + "</b>" + escHTML(q.why) + "</div>" +
        '<button type="button" class="btn btn--ink quiz__next">' + (last ? "Voir mon résultat" : "Question suivante") + ' <span aria-hidden="true">→</span></button>';
      var next = $(".quiz__next", after);
      next.addEventListener("click", function () { if (last) result(); else { i++; render(); } });
      next.focus({ preventScroll: true });
    }

    function result() {
      var n = qs.length;
      var msg = score === n
        ? "Sans faute. Vous avez les réflexes d'un pro : il ne manque plus que la carte."
        : score >= n - 2
          ? "Très bien. Quelques réflexes à consolider : c'est exactement le rôle de la formation."
          : "La route s'apprend. Venez en parler avec nous : on part de là où vous en êtes.";
      if (stepEl) stepEl.textContent = "Résultat";
      if (bar) bar.style.width = "100%";
      if (score === n) setCardStatus("PRÊT ✓");
      body.innerHTML =
        '<div class="quiz__result">' +
          '<p class="quiz__score"><span data-count>0</span><small>/' + n + "</small></p>" +
          '<p class="quiz__q">' + escHTML(msg) + "</p>" +
          '<div class="quiz__actions">' +
            '<a class="btn btn--yellow" target="_blank" rel="noopener" href="' + escHTML(waLink("Bonjour CFC Marchica, j'ai obtenu " + score + "/" + n + " au quiz de votre site. Je voudrais des informations sur la carte professionnelle.")) + '">Envoyer mon score sur WhatsApp <span aria-hidden="true">→</span></a>' +
            '<button type="button" class="btn btn--line" data-quiz-restart>Recommencer</button>' +
          "</div>" +
        "</div>";
      countUp($("[data-count]", body), score, 700);
      $("[data-quiz-restart]", body).addEventListener("click", function () { i = 0; score = 0; render(); });
    }

    var start = $("[data-quiz-start]", body);
    if (start) start.addEventListener("click", function () { render(); var f = $(".quiz__opt", body); if (f) f.focus({ preventScroll: true }); });
  }

  function countUp(el, to, ms) {
    if (!el) return;
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min((now - t0) / ms, 1);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- Checklist del dossier ---------- */
  function initChecklist() {
    var list = $("[data-checklist]");
    if (!list) return;
    var boxes = $$("input[type=checkbox]", list);
    var cells = $$("[data-gauge] span");
    var gauge = $("[data-gauge]");
    var pctEl = $("[data-gauge-pct]");
    var msgEl = $("[data-gauge-msg]");
    var KEY = "cfc-dossier";
    var current = 0;

    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      boxes.forEach(function (b) { b.checked = saved.indexOf(b.value) !== -1; });
    } catch (e) { /* sin almacenamiento: no pasa nada */ }

    function update(animate) {
      var on = boxes.filter(function (b) { return b.checked; });
      var n = on.length, total = boxes.length;
      var pct = Math.round(n / total * 100);
      cells.forEach(function (c, k) { c.classList.toggle("is-on", k < n); });
      if (gauge) gauge.classList.toggle("is-full", n === total);
      if (pctEl) {
        if (animate) {
          var from = current, t0 = performance.now();
          (function step(now) {
            var p = Math.min((now - t0) / 400, 1);
            pctEl.textContent = String(Math.round(from + (pct - from) * p));
            if (p < 1) requestAnimationFrame(step);
          })(t0);
        } else pctEl.textContent = String(pct);
      }
      current = pct;
      if (msgEl) {
        msgEl.textContent = n === 0 ? "Réservoir vide. On commence ?"
          : n === total ? "Dossier prêt ! Passez nous voir entre 9 h et 17 h."
          : "Encore " + (total - n) + " document" + (total - n > 1 ? "s" : "") + ".";
      }
      if (n === total) setCardStatus("DOSSIER PRÊT");
      try { localStorage.setItem(KEY, JSON.stringify(on.map(function (b) { return b.value; }))); } catch (e) { /* ignorar */ }
    }
    boxes.forEach(function (b) { b.addEventListener("change", function () { update(true); }); });
    update(false);
  }

  /* ---------- Formulario → WhatsApp ---------- */
  function initWhatsApp() {
    var form = $("[data-wa]");
    if (!form) return;
    var nameEl = $("[data-wa-name]", form);
    var msgEl = $("[data-wa-msg]", form);
    var preview = $("[data-wa-preview]", form);
    var topics = data.waTopics || {};

    function compose() {
      var name = (nameEl && nameEl.value || "").trim();
      var checked = $("input[name=objet]:checked", form);
      var topic = topics[checked ? checked.value : "inscription"] || topics.inscription || "";
      var text = name
        ? "Bonjour CFC Marchica, je m'appelle " + name + " et " + topic
        : "Bonjour CFC Marchica, " + topic;
      var extra = (msgEl && msgEl.value || "").trim();
      if (extra) text += "\n\n" + extra;
      return text;
    }
    function refresh() { if (preview) preview.textContent = compose(); }
    form.addEventListener("input", refresh);
    form.addEventListener("change", refresh);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      window.open(waLink(compose()), "_blank", "noopener");
    });
    refresh();
  }

  /* ---------- GSAP: camión, marquee, recorrido horizontal ---------- */
  function initTruck() {
    var truck = $("[data-truck]");
    var road = $("[data-road]");
    var hero = $(".hero");
    if (!truck || !road || !hero) return;
    gsap.to(truck, {
      x: function () { return Math.max(0, road.clientWidth * 0.82 - truck.offsetWidth); },
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true }
    });
  }

  function initMarquee() {
    var track = $("[data-marquee]");
    if (!track) return;
    track.classList.add("is-js");
    var tw = gsap.to(track, { xPercent: -50, ease: "none", duration: 38, repeat: -1 });
    tw.totalTime(38 * 500); // margen para poder ir hacia atrás
    var dir = 1;
    ScrollTrigger.create({
      onUpdate: function (self) {
        dir = self.direction;
        var speed = Math.min(1 + Math.abs(self.getVelocity()) / 350, 7);
        gsap.to(tw, {
          timeScale: dir * speed, duration: 0.2, overwrite: true,
          onComplete: function () { gsap.to(tw, { timeScale: dir, duration: 0.9, overwrite: true }); }
        });
      }
    });
  }

  function initParcours() {
    var section = $("[data-parcours]");
    if (!section) return;
    var pin = $(".parcours__pin", section);
    var track = $("[data-track]", section);
    var fill = $("[data-parcours-fill]", section);
    var truck = $("[data-parcours-truck]", section);
    var road = $(".parcours__road", section);
    var move = function (p) {
      if (fill) fill.style.transform = "scaleX(" + p + ")";
      if (truck && road) truck.style.transform = "translateX(" + (p * (road.clientWidth - truck.offsetWidth)) + "px)";
    };
    var mm = gsap.matchMedia();
    mm.add("(min-width: 961px)", function () {
      section.classList.add("is-h");
      var cs = getComputedStyle(pin);
      var inner = function () { return pin.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); };
      var dist = function () { return Math.max(0, track.scrollWidth - inner()); };
      gsap.to(track, {
        x: function () { return -dist(); },
        ease: "none",
        scrollTrigger: {
          trigger: section, start: "top top", end: function () { return "+=" + (dist() + window.innerHeight * 0.3); },
          pin: true, scrub: 0.8, invalidateOnRefresh: true,
          onUpdate: function (self) { move(self.progress); }
        }
      });
      return function () { section.classList.remove("is-h"); move(0); };
    });
    mm.add("(max-width: 960px)", function () {
      ScrollTrigger.create({
        trigger: section, start: "top 70%", end: "bottom 70%",
        onUpdate: function (self) { move(self.progress); }
      });
    });
  }

  function initYear() {
    var y = $("[data-year]");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "] failed:", e); }
  }

  function boot() {
    safe(initSplash, "initSplash");
    safe(initYear, "initYear");
    safe(initScrollUI, "initScrollUI");
    safe(initMenu, "initMenu");
    safe(initCursor, "initCursor");
    safe(initReveals, "initReveals");
    safe(initPcard, "initPcard");
    safe(initClock, "initClock");
    safe(initQuiz, "initQuiz");
    safe(initChecklist, "initChecklist");
    safe(initWhatsApp, "initWhatsApp");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initMarquee, "initMarquee");
      safe(initParcours, "initParcours");
      if (!reduced) safe(initTruck, "initTruck");
      window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    }
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
