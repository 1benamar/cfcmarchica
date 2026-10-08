/* C.F.C.P Marchica — interacción. Script clásico (sin módulos): funciona
   abriendo index.html con doble clic y en cualquier hosting. Todo el
   contenido está escrito en el HTML; aquí solo se anima y se enriquece. */
(function () {
  "use strict";

  var B = window.__BRAND__ || {};
  var doc = document;
  var root = doc.documentElement;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* modo privado */ } }
  };
  function fill(str, map) {
    return String(str).replace(/\{(\w+)\}/g, function (_, k) { return map[k] != null ? map[k] : ""; });
  }

  /* ================= Idioma (FR por defecto · EN · ES · DE) ================= */
  var LANGS = ["fr", "en", "es", "de"];
  var I18N = { lang: "fr", listeners: [] };
  // texto de la página en el idioma actual; si falta la traducción, el francés
  function tr(key, frText) {
    var d = I18N.lang === "fr" ? null : B[I18N.lang];
    return d && d[key] != null ? d[key] : frText;
  }
  function t(key, map) {
    var e = (B.ui || {})[key];
    if (!e) return key;
    var v = e[I18N.lang] != null ? e[I18N.lang] : e.fr;
    return map ? fill(v, map) : v;
  }
  function onLang(fn) { I18N.listeners.push(fn); }

  function captureFr() {
    $$("[data-i18n]").forEach(function (el) { el.__fr = el.innerHTML; });
    $$("[data-i18n-attr]").forEach(function (el) {
      el.__frAttr = {};
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var attr = pair.split(":")[0];
        el.__frAttr[attr] = el.getAttribute(attr) || "";
      });
    });
  }

  function applyLang(lang) {
    var d = lang === "fr" ? {} : (B[lang] || {});
    $$("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var html = d[key] != null ? d[key] : el.__fr;
      if (html == null) return;
      if (el.hasAttribute("data-words")) splitWords(el, html);
      else el.innerHTML = html;
    });
    $$("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var p = pair.split(":"), attr = p[0], key = p[1];
        var v = d[key] != null ? d[key] : (el.__frAttr || {})[attr];
        if (v != null) el.setAttribute(attr, v);
      });
    });
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    if (B.titles) doc.title = B.titles[lang] || B.titles.fr;
    I18N.lang = lang;
    store.set("cfc-lang", lang);
    $$("[data-lang-current]").forEach(function (el) { el.textContent = lang === "ar" ? "ع" : lang.toUpperCase(); });
    $$("[data-set-lang]").forEach(function (b) { b.setAttribute("aria-current", b.getAttribute("data-set-lang") === lang ? "true" : "false"); });
    I18N.listeners.forEach(function (fn) { safe(fn, "lang"); });
  }

  function setLang(lang) {
    if (LANGS.indexOf(lang) < 0 || lang === I18N.lang) return;
    if (doc.startViewTransition && !reduced) doc.startViewTransition(function () { applyLang(lang); });
    else applyLang(lang);
  }

  function initI18n() {
    captureFr();
    var saved = store.get("cfc-lang");
    if (saved && saved !== "fr" && LANGS.indexOf(saved) > -1) applyLang(saved);
    else applyLang("fr");

    // menú desplegable de la cabecera
    var wrap = $("[data-langs]"), btn = $("[data-lang-btn]"), list = $("[data-lang-list]");
    function close(focus) {
      if (!list || list.hidden) return;
      list.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      if (focus) btn.focus();
    }
    if (wrap && btn && list) {
      btn.addEventListener("click", function () {
        var open = list.hidden;
        list.hidden = !open;
        btn.setAttribute("aria-expanded", String(open));
        if (open) { var cur = $("[aria-current='true']", list) || $("button", list); if (cur) cur.focus(); }
      });
      doc.addEventListener("click", function (e) { if (!wrap.contains(e.target)) close(false); });
      wrap.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { close(true); return; }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          var items = $$("button", list), i = items.indexOf(doc.activeElement);
          if (i < 0) return;
          e.preventDefault();
          items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
        }
      });
    }
    $$("[data-set-lang]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-set-lang")); close(b.closest("[data-lang-list]") != null); });
    });
  }

  /* ================= Utilidades de scroll: un solo bucle rAF ================= */
  var fx = [];
  var rafId = 0;
  function frame() {
    rafId = 0;
    var again = false;
    for (var i = 0; i < fx.length; i++) {
      try { if (fx[i]() === true) again = true; } catch (e) { console.warn("[fx]", e); }
    }
    if (again) rafId = requestAnimationFrame(frame);
  }
  function kick() { if (!rafId) rafId = requestAnimationFrame(frame); }
  function initLoop() {
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    kick();
  }

  /* ================= Pantalla de entrada ================= */
  var heroStarted = false;
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    root.classList.add("is-loaded");
    if (window.__playHero) window.__playHero();
  }
  function initSplash() {
    var s = $("[data-splash]");
    if (!s) { startHero(); return; }
    var t0 = performance.now(), done = false;
    function hide() {
      if (done) return;
      done = true;
      s.classList.add("is-out");
      setTimeout(startHero, 260);
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 1400);
    }
    function ready() { setTimeout(hide, Math.max(0, 900 - (performance.now() - t0))); }
    if (doc.readyState === "complete") ready();
    else addEventListener("load", ready);
    setTimeout(hide, 3600);
  }

  /* ================= Cabecera ================= */
  function initHeader() {
    var hdr = $("[data-hdr]"), bar = $("[data-progress]"), hero = $(".hero"), mbar = $("[data-mbar]");
    if (!hdr) return;
    var lastY = scrollY;
    fx.push(function () {
      var y = scrollY, h = hero ? hero.offsetHeight : 600;
      hdr.classList.toggle("is-solid", y > h - 100);
      if (!root.classList.contains("menu-open")) {
        if (y > h && y > lastY + 6) hdr.classList.add("is-hidden");
        else if (y < lastY - 6 || y < h) hdr.classList.remove("is-hidden");
      }
      lastY = y;
      var max = root.scrollHeight - innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ")";
      if (mbar) mbar.classList.toggle("is-on", y > h * 0.7 && innerHeight + y < root.scrollHeight - 160);
    });
  }

  /* ================= Menú ================= */
  function initMenu() {
    var menu = $("[data-menu]"), openBtn = $("[data-menu-open]"), closeBtn = $("[data-menu-close]"), fig = $("[data-menu-fig]");
    if (!menu || !openBtn) return;
    menu.hidden = false;
    menu.setAttribute("aria-hidden", "true");
    var links = $$(".menu__nav a", menu);
    links.forEach(function (a, i) { a.style.setProperty("--i", i); });
    var isOpen = false;
    function open() {
      isOpen = true;
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      root.classList.add("menu-open");
      openBtn.setAttribute("aria-expanded", "true");
      setTimeout(function () { closeBtn.focus(); }, 350);
    }
    function close(focusBack) {
      isOpen = false;
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      root.classList.remove("menu-open");
      openBtn.setAttribute("aria-expanded", "false");
      if (focusBack) openBtn.focus();
    }
    openBtn.addEventListener("click", function () { if (isOpen) close(true); else open(); });
    closeBtn.addEventListener("click", function () { close(true); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a[href^='#']")) close(false); });
    doc.addEventListener("keydown", function (e) {
      if (!isOpen) return;
      if (e.key === "Escape") { close(true); return; }
      if (e.key === "Tab") {
        var f = $$("a, button", menu).filter(function (el) { return el.offsetParent !== null; });
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    if (fig) {
      var swapT;
      links.forEach(function (a) {
        a.addEventListener("mouseover", function () {
          var src = a.getAttribute("data-menu-img");
          if (!src || fig.getAttribute("src") === src) return;
          fig.classList.add("is-swap");
          clearTimeout(swapT);
          swapT = setTimeout(function () {
            fig.src = src;
            fig.onload = function () { fig.classList.remove("is-swap"); };
          }, 200);
        });
      });
    }
  }

  /* ================= Vídeo del hero: cuatro planos que se funden =================
     Cada plano dura como mucho CLIP segundos; el siguiente se precarga mientras
     suena el actual. La barra de planos muestra el avance y permite saltar. */
  function initHeroVideo() {
    var media = $("[data-hero-media]"), vids = $$("[data-clip]"), bar = $("[data-clips]");
    if (!media || !vids.length) return;
    var conn = navigator.connection || {};
    if (conn.saveData || /(^|-)2g/.test(conn.effectiveType || "")) {   // datos limitados: solo la portada
      vids.forEach(function (v, i) { if (i) v.parentNode.removeChild(v); else { v.removeAttribute("autoplay"); v.preload = "none"; } });
      return;
    }
    // en móvil el primer plano es el más ligero (manos al volante) y el autobús pasa al final:
    // los <source media> ya lo hacen; aquí se cambian también las portadas
    if (matchMedia("(max-width: 759px)").matches && vids.length > 3) {
      var p0 = vids[0].getAttribute("poster");
      vids[0].setAttribute("poster", vids[3].getAttribute("poster"));
      vids[3].setAttribute("poster", p0);
    }
    var CLIP = 8, FADE = 1.3;
    var cur = 0, switching = false, inView = true, looping = false, dots = [];
    vids.forEach(function (v) { v.muted = true; v.defaultMuted = true; v.setAttribute("muted", ""); });
    function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); return p; }
    function warm(v) { if (v && v.preload === "none") { v.preload = "auto"; v.load(); } }
    function len(v) { return Math.max(2, Math.min(CLIP, (v.duration || CLIP) - FADE)); }
    function paintDots() {
      dots.forEach(function (d, k) {
        d.setAttribute("aria-current", k === cur ? "true" : "false");
        if (k !== cur) d.style.setProperty("--p", k < cur ? "1" : "0");
      });
    }
    function go(n) {
      n = (n + vids.length) % vids.length;
      if (n === cur || switching) return;
      var from = vids[cur], to = vids[n];
      switching = true;
      if (to.preload === "none") to.preload = "auto";
      try { to.currentTime = 0; } catch (e) { /* aún sin datos */ }
      var p = play(to);
      var done = function () {
        cur = n;
        vids.forEach(function (x, k) { x.classList.toggle("is-active", k === n); });
        paintDots();
        warm(vids[(n + 1) % vids.length]);
        setTimeout(function () { from.pause(); switching = false; }, FADE * 1000 + 100);
      };
      if (p && p.then) p.then(done).catch(function () { switching = false; });
      else done();
    }
    // bucle propio: llena la barra del plano actual y cambia de plano a tiempo
    var stuck = 0;
    function loop() {
      if (!inView || document.hidden) { looping = false; return; }
      var v = vids[cur], l = len(v);
      if (dots[cur]) dots[cur].style.setProperty("--p", clamp(v.currentTime / l, 0, 1).toFixed(3));
      if (!switching && vids.length > 1 && v.currentTime >= l) go(cur + 1);   // tras el último vuelve al primero
      // vigilancia: si el plano activo se queda parado, se relanza; si no arranca en 4 s, se salta
      if (!switching && v.paused) {
        if (++stuck % 30 === 0) play(v);
        if (stuck > 240 && vids.length > 1) { stuck = 0; go(cur + 1); }
      } else stuck = 0;
      requestAnimationFrame(loop);
    }
    vids.forEach(function (v, k) {
      v.loop = true;
      v.addEventListener("error", function () { if (k === cur && vids.length > 1) { switching = false; go(cur + 1); } });
    });
    function startLoop() { if (!looping) { looping = true; requestAnimationFrame(loop); } }

    if (bar && vids.length > 1) {
      vids.forEach(function (_, k) {
        var b = doc.createElement("button");
        b.type = "button";
        b.addEventListener("click", function () { go(k); });
        bar.appendChild(b);
        dots.push(b);
      });
      var labels = function () { dots.forEach(function (b, k) { b.setAttribute("aria-label", t("video.clip", { n: k + 1, t: dots.length })); }); };
      labels();
      onLang(labels);
      paintDots();
    }

    vids[0].addEventListener("playing", function () { warm(vids[1]); startLoop(); }, { once: true });
    function resume() { if (inView && !document.hidden && vids[cur].paused) play(vids[cur]); startLoop(); }
    window.__playHero = resume;
    // si el móvil bloquea el autoplay (ahorro de batería), arranca al primer toque o scroll
    ["touchstart", "pointerdown", "scroll", "keydown"].forEach(function (ev) { addEventListener(ev, resume, { passive: true, once: true }); });
    doc.addEventListener("visibilitychange", resume);
    addEventListener("pageshow", resume);
    resume();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        inView = en[0].isIntersecting;
        if (inView) resume(); else vids[cur].pause();
      }, { threshold: 0 }).observe(media);
    }
  }

  // al bajar, el texto del hero sube y se desvanece; el vídeo baja un poco (profundidad)
  function initHeroScroll() {
    var hero = $(".hero"), copy = $("[data-hero-copy]"), media = $("[data-hero-media]");
    if (!hero || !copy) return;
    fx.push(function () {
      var r = hero.getBoundingClientRect();
      if (r.bottom < -80) return false;
      var p = clamp(-r.top / Math.max(1, r.height), 0, 1);
      copy.style.transform = p ? "translate3d(0," + (-p * 90).toFixed(1) + "px,0)" : "";
      copy.style.opacity = p ? clamp(1 - p * 1.4, 0, 1).toFixed(3) : "";
      if (media) media.style.transform = p ? "translate3d(0," + (p * r.height * 0.22).toFixed(1) + "px,0)" : "";
      return false;
    });
  }

  /* ================= La salle en grand: la foto crece hasta llenar la pantalla ================= */
  function easeInOut(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function initZoom() {
    $$("[data-zoom]").forEach(function (sec) {
      sec.classList.add("zb-active");
      fx.push(function () {
        var r = sec.getBoundingClientRect(), vh = innerHeight;
        if (r.bottom < -50 || r.top > vh + 50) return false;
        var total = Math.max(1, r.height - vh);
        var p = clamp(-r.top / (total * 0.7), 0, 1);
        var e = easeInOut(p);
        var mx = innerWidth < 700 ? 6 : 24;
        sec.style.setProperty("--iy", ((1 - e) * 14).toFixed(2) + "%");
        sec.style.setProperty("--ix", ((1 - e) * mx).toFixed(2) + "%");
        sec.style.setProperty("--ir", ((1 - e) * 28).toFixed(1) + "px");
        sec.style.setProperty("--zs", (1.22 - 0.22 * e).toFixed(4));
        sec.style.setProperty("--to", clamp((p - 0.42) / 0.38, 0, 1).toFixed(3));
        return false;
      });
    });
  }

  /* ================= Cinta de oficios: avanza sola y se inclina con la velocidad del scroll ================= */
  function initRibbon() {
    var rib = $("[data-ribbon]");
    if (!rib) return;
    var track = $("[data-ribbon-track]", rib), skew = $("[data-ribbon-skew]", rib), base = $(".ribbon__set", rib);
    var w = 1, x = 0, dir = -1, vel = 0, sk = 0, lastY = scrollY, t0 = 0, visible = false, running = false;
    function fill() {
      $$(".ribbon__set", track).forEach(function (s) { if (s !== base) s.parentNode.removeChild(s); });
      w = base.offsetWidth || 1;
      var n = Math.ceil((innerWidth * 2) / w) + 1;
      for (var i = 0; i < n; i++) track.appendChild(base.cloneNode(true));
      x = x % w;
    }
    fill();
    var rt;
    addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(fill, 150); });
    onLang(function () { setTimeout(fill, 30); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fill);
    function frameRib(now) {
      if (!visible) { running = false; return; }
      var dt = t0 ? Math.min(64, now - t0) : 16;
      t0 = now;
      var dy = scrollY - lastY;
      lastY = scrollY;
      vel += (dy - vel) * 0.12;
      if (vel > 0.6) dir = -1; else if (vel < -0.6) dir = 1;   // al subir, la cinta va al revés
      var speed = 0.05 + Math.min(Math.abs(vel) * 0.045, 0.9);
      x += dir * speed * dt;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      track.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)";
      var target = clamp(-vel * 0.5, -9, 9);
      sk += (target - sk) * 0.1;
      skew.style.transform = Math.abs(sk) > 0.02 ? "skewX(" + sk.toFixed(2) + "deg)" : "";
      requestAnimationFrame(frameRib);
    }
    function go() { if (!running) { running = true; t0 = 0; lastY = scrollY; requestAnimationFrame(frameRib); } }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) go(); }, { rootMargin: "100px 0px" }).observe(rib);
    } else { visible = true; go(); }
  }

  /* ================= Fotos con relieve: inclinación 3D y brillo bajo el puntero ================= */
  function initTilt() {
    if (!fineHover) return;
    $$("[data-tilt]").forEach(function (el) {
      if (el.__tilt) return;
      el.__tilt = true;
      if (el.classList.contains("card")) {
        var s = doc.createElement("span");
        s.className = "card__shine";
        s.setAttribute("aria-hidden", "true");
        el.appendChild(s);
      }
      var max = el.classList.contains("card") ? 6 : 3.5;
      el.addEventListener("pointermove", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transition = "transform .18s ease-out, color .6s, border-color .6s, box-shadow .6s";
        el.style.transform = "perspective(1100px) rotateX(" + ((0.5 - y) * max).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * max).toFixed(2) + "deg) translateY(-4px)";
        el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", function () { el.style.transition = ""; el.style.transform = ""; });
    });
  }

  /* ================= Botones magnéticos (nunca los de enviar formularios) ================= */
  function initMagnetic() {
    if (!fineHover) return;
    $$("a.btn, .round").forEach(function (b) {
      b.setAttribute("data-magnetic", "");
      var k = b.classList.contains("round") ? 0.35 : 0.2;
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.translate = ((e.clientX - r.left - r.width / 2) * k).toFixed(1) + "px " + ((e.clientY - r.top - r.height / 2) * k * 1.2).toFixed(1) + "px";
      });
      b.addEventListener("pointerleave", function () { b.style.translate = ""; });
    });
  }

  /* ================= GPS: ruta animada, brújula y distancia real (si la persona lo permite) =================
     La posición solo se usa en el navegador para calcular distancia y rumbo; no se envía a ningún sitio. */
  function initGps() {
    var box = $("[data-gps]");
    if (!box) return;
    var tabs = $$("[data-gps-tab]", box), panels = $$("[data-gps-panel]", box);
    tabs.forEach(function (tb) {
      tb.addEventListener("click", function () {
        var k = tb.getAttribute("data-gps-tab");
        tabs.forEach(function (o) { o.setAttribute("aria-selected", o === tb ? "true" : "false"); });
        panels.forEach(function (p) { p.hidden = p.getAttribute("data-gps-panel") !== k; });
        var fr = $("iframe[data-src]", box);
        if (k === "map" && fr && !fr.getAttribute("src")) fr.setAttribute("src", fr.getAttribute("data-src"));   // el mapa real solo carga si se pide
      });
    });

    var visible = false;
    // coche que recorre la ruta
    var route = $("[data-gps-route]", box), car = $("[data-gps-car]", box), driving = false, t0 = 0;
    var L = route && route.getTotalLength ? route.getTotalLength() : 0;
    function drive(now) {
      if (!visible || !L) { driving = false; return; }
      if (!t0) t0 = now;
      var p = ((now - t0) / 9000) % 1, e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      var a = route.getPointAtLength(e * L), b = route.getPointAtLength(Math.min(L, e * L + 1));
      var ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90;
      car.setAttribute("transform", "translate(" + a.x.toFixed(1) + " " + a.y.toFixed(1) + ") rotate(" + ang.toFixed(1) + ")");
      requestAnimationFrame(drive);
    }

    // brújula: sigue al ratón; tras localizar, apunta hacia el centro
    var comp = $("[data-compass]", box), needle = $("[data-compass-needle]", box);
    var target = 0, cur = 0, locked = false, spinning = 0;
    function turn() {
      var d = ((target - cur + 540) % 360) - 180;
      cur += d * 0.08;
      needle.style.setProperty("--deg", cur.toFixed(1) + "deg");
      spinning = Math.abs(d) > 0.1 ? requestAnimationFrame(turn) : 0;
    }
    function aim(deg) { target = deg; if (!spinning) spinning = requestAnimationFrame(turn); }
    if (comp && needle) {
      if (fineHover) {
        addEventListener("pointermove", function (e) {
          if (locked || !visible) return;
          var r = comp.getBoundingClientRect();
          aim(Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI + 90);
        }, { passive: true });
      } else {
        setInterval(function () { if (!locked && visible) aim(-40 + Math.random() * 80); }, 2600);
      }
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && !driving && L) { driving = true; requestAnimationFrame(drive); }
      }, { threshold: 0.1 }).observe(box);
    }

    // localización opcional
    var btn = $("[data-gps-locate]", box), distEl = $("[data-gps-dist]", box), hint = $("[data-gps-hint]", box);
    var P = B.place || { lat: 35.1681, lng: -2.9335 }, res = null;
    function rad(x) { return x * Math.PI / 180; }
    function render() {
      if (!res || !distEl || !hint) return;
      if (res.err) { hint.textContent = t("gps.denied"); return; }
      if (res.km < 3) { distEl.textContent = "Nador"; hint.textContent = t("gps.near"); return; }
      var num;
      try { num = new Intl.NumberFormat(I18N.lang, { maximumFractionDigits: res.km < 100 ? 1 : 0 }).format(res.km); } catch (e) { num = res.km.toFixed(res.km < 100 ? 1 : 0); }
      var dirs = t("compass");
      distEl.textContent = "≈ " + num + " km";
      hint.textContent = t("gps.far", { d: num, c: dirs[Math.round(res.brg / 45) % 8] || "" });
    }
    onLang(render);
    if (btn) btn.addEventListener("click", function () {
      if (!navigator.geolocation) { res = { err: true }; render(); return; }
      btn.classList.add("is-busy");
      if (hint) hint.textContent = t("gps.locating");
      navigator.geolocation.getCurrentPosition(function (pos) {
        btn.classList.remove("is-busy");
        var la1 = rad(pos.coords.latitude), la2 = rad(P.lat), dl = rad(P.lng - pos.coords.longitude);
        var h = Math.pow(Math.sin((la2 - la1) / 2), 2) + Math.cos(la1) * Math.cos(la2) * Math.pow(Math.sin(dl / 2), 2);
        var km = 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
        var brg = (Math.atan2(Math.sin(dl) * Math.cos(la2), Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dl)) * 180 / Math.PI + 360) % 360;
        res = { km: km, brg: brg };
        locked = true;
        aim(brg);
        render();
      }, function () {
        btn.classList.remove("is-busy");
        res = { err: true };
        render();
      }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
    });
  }

  /* ================= Semáforo del pie: rojo → ámbar → verde; en verde fijo al apuntar a los botones ================= */
  function initTrafficLight() {
    var box = $("[data-fcta]"), tl = $("[data-tlight]");
    if (!box || !tl) return;
    var seq = ["is-r", "is-r", "is-a", "is-g", "is-g", "is-g"], i = 0, timer = 0, hold = false, visible = false;
    function set(c) { tl.classList.remove("is-r", "is-a", "is-g"); tl.classList.add(c); }
    function stepLight() {
      clearTimeout(timer);
      if (hold || !visible) return;
      set(seq[i % seq.length]);
      i++;
      timer = setTimeout(stepLight, 700);
    }
    set("is-r");
    var btns = $(".fcta__btns", box);
    if (btns) {
      btns.addEventListener("pointerenter", function () { hold = true; clearTimeout(timer); set("is-g"); });
      btns.addEventListener("pointerleave", function () { hold = false; stepLight(); });
      btns.addEventListener("focusin", function () { hold = true; clearTimeout(timer); set("is-g"); });
      btns.addEventListener("focusout", function () { hold = false; stepLight(); });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) stepLight(); else clearTimeout(timer); }, { threshold: 0.2 }).observe(box);
    } else { visible = true; stepLight(); }
  }

  /* ================= Señales que se inclinan con la velocidad del scroll y vuelven a su sitio ================= */
  function initSignLean() {
    var signs = $$(".rsign");
    if (!signs.length) return;
    var last = scrollY, v = 0, lean = 0, raf = 0;
    function loop() {
      var dy = scrollY - last;
      last = scrollY;
      v += (dy - v) * 0.2;
      lean += (clamp(v * 0.35, -14, 14) - lean) * 0.12;
      var deg = lean.toFixed(2) + "deg";
      signs.forEach(function (s) { s.style.setProperty("--lean", deg); });
      if (Math.abs(lean) > 0.05 || Math.abs(v) > 0.05) raf = requestAnimationFrame(loop);
      else { raf = 0; signs.forEach(function (s) { s.style.removeProperty("--lean"); }); }
    }
    addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
  }

  /* ================= Cifras tipo cuentakilómetros: la columna rueda 0-9 y para en el número ================= */
  function initOdometers() {
    var els = $$("[data-odo]");
    if (!els.length) return;
    els.forEach(function (el, k) {
      var n = parseInt(el.getAttribute("data-odo"), 10) || 0;
      var digits = [];
      for (var i = 0; i < 10 + n + 1; i++) digits.push("<span>" + (i % 10) + "</span>");
      el.className = "odo";
      el.setAttribute("aria-label", String(n));
      el.innerHTML = '<span class="odo__col" aria-hidden="true" style="--d:' + (k * 0.15).toFixed(2) + 's">' + digits.join("") + "</span>";
      el.__target = 10 + n;
    });
    function roll(el) { var col = el.firstChild; if (col) col.style.transform = "translateY(" + (-el.__target) + "em)"; }
    if (!("IntersectionObserver" in window)) { els.forEach(roll); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); roll(en.target); } });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ================= Fotos de las tarjetas: se desplazan más despacio que la página ================= */
  function initPhotoParallax() {
    var imgs = $$("[data-parallax-img]");
    if (!imgs.length) return;
    fx.push(function () {
      var vh = innerHeight;
      imgs.forEach(function (im) {
        var r = im.parentNode.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var c = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
        im.style.setProperty("--py", (-7.5 + c * 6).toFixed(2) + "%");
      });
      return false;
    });
  }

  /* ================= Titulares que suben palabra a palabra ================= */
  // Se respeta <em> y <br>; el espacio duro (&nbsp;) no parte la palabra.
  function splitHeading(el) {
    var i = 0, html = "";
    function pieces(text) {
      return text.split(/([ \t\n\r]+)/).map(function (w) {
        if (!w) return "";
        if (/^[ \t\n\r]+$/.test(w)) return " ";
        return '<span class="split-w"><span style="--i:' + (i++) + '">' + esc(w) + "</span></span>";
      }).join("");
    }
    Array.prototype.forEach.call(el.childNodes, function (n) {
      if (n.nodeType === 3) html += pieces(n.textContent);
      else if (n.nodeName === "BR") html += "<br>";
      else if (n.nodeType === 1) { var tag = n.nodeName.toLowerCase(); html += "<" + tag + ">" + pieces(n.textContent) + "</" + tag + ">"; }
    });
    el.innerHTML = html;
    el.setAttribute("data-split", "");
  }
  function initSplit() {
    var heads = $$(".h2.reveal");
    function run() { heads.forEach(function (h) { safe(function () { splitHeading(h); }, "split"); }); }
    run();
    onLang(run);   // al cambiar de idioma el texto se reescribe: se vuelve a partir
    // más elementos que entran en cascada
    $$(".foot__cols > div, .chap").forEach(function (e) { e.classList.add("reveal"); });
  }

  /* ================= El título del hero sigue al ratón con algo de profundidad ================= */
  function initHeroDepth() {
    var hero = $(".hero");
    if (!hero || !fineHover) return;
    var layers = [[$(".hero__title"), 22], [$(".hero__lead"), 10], [$(".hero__eyebrow"), 6]];
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function loop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      layers.forEach(function (l) { if (l[0]) l[0].style.translate = (-cx * l[1]).toFixed(2) + "px " + (-cy * l[1]).toFixed(2) + "px"; });
      raf = Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(loop) : 0;
    }
    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener("pointerleave", function () { tx = ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  }

  /* ================= Apariciones al hacer scroll ================= */
  function initReveals() {
    var els = $$(".reveal, .shot");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
    // red de seguridad: lo que esté en pantalla a los 6 s se muestra
    setTimeout(function () {
      els.forEach(function (e) {
        if (!e.classList.contains("is-in") && e.getBoundingClientRect().top < innerHeight) e.classList.add("is-in");
      });
    }, 6000);
    // cascada en grupos
    $$(".facts, .head, .stats, .faq__list, .info, .socials, .foot__cols, .prog__list").forEach(function (g) {
      $$(".reveal", g).forEach(function (e, i) { e.style.transitionDelay = (i * 0.07).toFixed(2) + "s"; });
    });
  }

  /* ================= 01 · Palabras que se encienden + logo que se monta ================= */
  function splitWords(el, html) {
    var tmp = doc.createElement("div");
    tmp.innerHTML = html;
    var text = (tmp.textContent || "").replace(/\s+/g, " ").trim();
    el.innerHTML = text.split(" ").map(function (w) { return '<span class="w">' + esc(w) + "</span>"; }).join(" ");
    el.__words = $$(".w", el);
    el.__lit = -1;
    kick();
  }
  function initWords() {
    $$("[data-words]").forEach(function (el) {
      splitWords(el, el.innerHTML);
      var cur = 0;
      fx.push(function () {
        var r = el.getBoundingClientRect(), vh = innerHeight;
        var p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.4), 0, 1);
        var words = el.__words || [];
        var target = p * words.length;
        cur = reduced ? target : lerp(cur, target, 0.18);
        var lit = Math.round(cur);
        if (lit !== el.__lit) {
          words.forEach(function (w, i) { w.classList.toggle("on", i < lit); });
          el.__lit = lit;
        }
        return Math.abs(target - cur) > 0.05;
      });
    });
    var em = $("[data-assemble]");
    if (em) {
      var k = 1;
      fx.push(function () {
        var r = em.getBoundingClientRect(), vh = innerHeight;
        var p = clamp((vh - r.top) / (vh * 0.55 + r.height * 0.3), 0, 1);
        var target = 1 - p * p * (3 - 2 * p);
        k = reduced ? target : lerp(k, target, 0.12);
        em.style.setProperty("--k", k.toFixed(4));
        return Math.abs(target - k) > 0.001;
      });
    }
  }

  /* ================= 02 · Formaciones ================= */
  function setFormation(v) {
    $$("[data-formation-select]").forEach(function (s) { s.value = v; });
    $$(".card").forEach(function (c) { c.classList.toggle("is-picked", c.getAttribute("data-formation") === v); });
    var comp = $("[data-composer]");
    if (comp) comp.dispatchEvent(new Event("change"));
  }
  function initFormations() {
    // visto que marca la formación elegida en el formulario
    $$(".card").forEach(function (c) {
      if ($(".card__check", c)) return;
      var s = doc.createElement("span");
      s.className = "card__check";
      s.setAttribute("aria-hidden", "true");
      s.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      c.appendChild(s);
    });
    $$("[data-choose]").forEach(function (a) {
      a.addEventListener("click", function () { setFormation(a.getAttribute("data-choose")); });
    });
    // los dos selectores y los dos campos de nombre van sincronizados
    $$("[data-formation-select]").forEach(function (s) {
      s.addEventListener("change", function () {
        $$("[data-formation-select]").forEach(function (o) { if (o !== s) o.value = s.value; });
        $$(".card").forEach(function (c) { c.classList.toggle("is-picked", c.getAttribute("data-formation") === s.value); });
      });
    });
    $$("[data-name-input]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        $$("[data-name-input]").forEach(function (o) { if (o !== inp) o.value = inp.value; });
      });
    });
  }

  /* ================= 03 · Programa: acordeón que avanza solo + panel visual =================
     Cambia de capítulo cada STEP ms mientras se ve; se para con el ratón encima
     y deja de avanzar en cuanto la persona elige un capítulo. */
  function initProgramme() {
    var box = $("[data-prog]");
    if (!box) return;
    var chaps = $$("[data-chap]", box), icons = $$("[data-prog-icon]", box);
    var num = $("[data-prog-num]", box), timer = $("[data-prog-timer]", box);
    var btns = chaps.map(function (c) { return $(".chap__btn", c); });
    var STEP = 6000, cur = 0, auto = true, inView = false, hovering = false, tm = 0;
    box.style.setProperty("--prog-time", STEP / 1000 + "s");
    function schedule() {
      clearTimeout(tm);
      if (timer) { timer.classList.remove("is-run"); void timer.offsetWidth; }
      if (!auto || !inView || hovering || doc.hidden) return;
      if (timer) timer.classList.add("is-run");
      tm = setTimeout(function () { activate(cur + 1); }, STEP);
    }
    function activate(i, byUser) {
      cur = (i + chaps.length) % chaps.length;
      chaps.forEach(function (c, j) { c.classList.toggle("is-active", j === cur); });
      btns.forEach(function (b, j) { if (b) b.setAttribute("aria-expanded", j === cur ? "true" : "false"); });
      icons.forEach(function (ic, j) { ic.classList.toggle("is-on", j === cur); });
      if (num) num.textContent = pad2(cur + 1);
      if (byUser) auto = false;
      schedule();
    }
    btns.forEach(function (b, i) {
      if (!b) return;
      b.addEventListener("click", function () { activate(i, true); });
      b.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : null;
        if (n === null) return;
        e.preventDefault();
        btns[(n + btns.length) % btns.length].focus();
      });
    });
    box.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { hovering = true; schedule(); } });
    box.addEventListener("pointerleave", function () { if (hovering) { hovering = false; schedule(); } });
    doc.addEventListener("visibilitychange", schedule);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; schedule(); }, { threshold: 0.35 }).observe(box);
    }
    activate(0);
  }

  /* ================= 04 · La carretera que se dibuja (firma) ================= */
  function initRoute() {
    var body = $("[data-route-body]"), svg = $("[data-route-svg]");
    if (!body || !svg) return;
    var asphalt = $("[data-route-path]"), line = $("[data-route-line]"), done = $("[data-route-done]"), car = $("[data-route-car]");
    var steps = $$("[data-step]", body);
    var dots = steps.map(function (s) { return $(".step__dot", s); });
    var len = 0, stepAt = [], cur = 0, built = false, horiz = false, light = null, lightState = "", chev = null, chevPath = null;
    var mqH = matchMedia("(min-width: 960px)");   // en escritorio los pasos van en fila y la carretera en horizontal

    // longitud del trazado en la que se alcanza una coordenada (x en horizontal, y en vertical)
    function lengthAt(v) {
      var lo = 0, hi = len;
      for (var k = 0; k < 22; k++) {
        var mid = (lo + hi) / 2, pt = done.getPointAtLength(mid);
        var c = horiz ? (root.dir === "rtl" ? -pt.x : pt.x) : pt.y;
        if (c < (horiz && root.dir === "rtl" ? -v : v)) lo = mid; else hi = mid;
      }
      return lo;
    }
    function build() {
      var br = body.getBoundingClientRect();
      if (!br.width || !br.height) return;
      horiz = mqH.matches;
      svg.setAttribute("viewBox", "0 0 " + br.width.toFixed(1) + " " + br.height.toFixed(1));
      var pts = dots.map(function (d) {
        var r = d.getBoundingClientRect();
        return { x: r.left + r.width / 2 - br.left, y: r.top + r.height / 2 - br.top };
      });
      var first = pts[0], last = pts[pts.length - 1], rtlH = horiz && root.dir === "rtl";
      var all = horiz
        ? [{ x: rtlH ? br.width : 0, y: first.y }].concat(pts, [{ x: rtlH ? 0 : br.width, y: last.y }])
        : [{ x: first.x, y: 0 }].concat(pts, [{ x: last.x, y: br.height }]);
      var wide = innerWidth >= 960;
      var d = "M" + all[0].x.toFixed(1) + " " + all[0].y.toFixed(1);
      for (var i = 1; i < all.length; i++) {
        var a = all[i - 1], b = all[i];
        if (horiz) {
          var mx = (b.x - a.x) * 0.5;
          d += " C" + (a.x + mx).toFixed(1) + " " + a.y.toFixed(1) + " " + (b.x - mx).toFixed(1) + " " + b.y.toFixed(1) + " " + b.x.toFixed(1) + " " + b.y.toFixed(1);
        } else {
          var my = (b.y - a.y) * 0.5;
          // en móvil la línea es recta: se le da una ligera curva en S
          var wig = wide ? 0 : (i % 2 ? 22 : -22);
          d += " C" + (a.x + wig).toFixed(1) + " " + (a.y + my).toFixed(1) + " " + (b.x - wig).toFixed(1) + " " + (b.y - my).toFixed(1) + " " + b.x.toFixed(1) + " " + b.y.toFixed(1);
        }
      }
      [asphalt, line, done].forEach(function (p) { p.setAttribute("d", d); });
      // flechas de dirección que avanzan por la carretera, como marcas viales
      if (!chev) {
        var NS = "http://www.w3.org/2000/svg";
        asphalt.id = "route-road";
        chev = doc.createElementNS(NS, "text");
        chev.setAttribute("class", "route__chev");
        chevPath = doc.createElementNS(NS, "textPath");
        chevPath.setAttribute("href", "#route-road");
        var an = doc.createElementNS(NS, "animate");
        an.setAttribute("attributeName", "startOffset");
        an.setAttribute("from", "0");
        an.setAttribute("to", "48");
        an.setAttribute("dur", "1.4s");
        an.setAttribute("repeatCount", "indefinite");
        chevPath.appendChild(an);
        chev.appendChild(chevPath);
        svg.insertBefore(chev, done);
        $(".route").classList.add("has-chev");
      }
      var pathLen = asphalt.getTotalLength ? asphalt.getTotalLength() : 1000;
      var unit = "›     ";
      while (chevPath.firstChild && chevPath.firstChild.nodeType === 3) chevPath.removeChild(chevPath.firstChild);
      chevPath.insertBefore(doc.createTextNode(new Array(Math.ceil(pathLen / 48) + 2).join(unit)), chevPath.firstChild);
      // semáforo al final de la carretera: se pone en verde cuando llega el coche
      var end = all[all.length - 1];
      if (!light) {
        light = doc.createElement("div");
        light.className = "route__light tlight is-r";
        light.setAttribute("aria-hidden", "true");
        light.innerHTML = '<i class="tl-r"></i><i class="tl-a"></i><i class="tl-g"></i>';
        body.appendChild(light);
      }
      light.style.left = (horiz ? end.x + (rtlH ? 26 : -26) : end.x).toFixed(1) + "px";
      // en fila va debajo del final de la carretera, en el margen, para no tapar el título
      light.style.top = (horiz ? end.y + 112 : end.y - 8).toFixed(1) + "px";
      len = done.getTotalLength();
      done.style.strokeDasharray = len + " " + len;
      stepAt = pts.map(function (p) { return lengthAt(horiz ? p.x : p.y); });
      built = true;
      kick();
    }
    var rt;
    function rebuild() { clearTimeout(rt); rt = setTimeout(build, 120); }
    addEventListener("resize", rebuild);
    onLang(function () { setTimeout(build, 60); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(build);
    addEventListener("load", build);
    if ("ResizeObserver" in window) new ResizeObserver(rebuild).observe(body);
    build();

    fx.push(function () {
      if (!built) return false;
      var br = body.getBoundingClientRect(), target;
      if (horiz) {
        // en fila: el coche recorre la carretera mientras la sección sube por la pantalla
        target = clamp((innerHeight * 0.88 - br.top) / (innerHeight * 0.62), 0, 1) * len;
      } else {
        var targetY = innerHeight * 0.62 - br.top;
        target = targetY <= 0 ? 0 : (targetY >= br.height ? len : lengthAt(targetY));
      }
      cur = reduced ? target : lerp(cur, target, 0.12);
      done.style.strokeDashoffset = (len - cur).toFixed(1);
      var p = done.getPointAtLength(cur), q = done.getPointAtLength(Math.min(len, cur + 2));
      var ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
      if (cur >= len - 2) ang = horiz ? (root.dir === "rtl" ? 180 : 0) : 90;
      car.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ") rotate(" + ang.toFixed(1) + ")");
      steps.forEach(function (s, i) { s.classList.toggle("is-reached", cur >= stepAt[i] - 4); });
      if (light) {
        var ratio = len ? cur / len : 0;
        var stt = ratio > 0.96 ? "is-g" : ratio > 0.6 ? "is-a" : "is-r";
        if (stt !== lightState) { light.classList.remove("is-r", "is-a", "is-g"); light.classList.add(stt); lightState = stt; }
      }
      return Math.abs(target - cur) > 0.4;
    });
  }

  /* ================= Lista de documentos ================= */
  function initDocs() {
    var box = $("[data-docs]");
    if (!box) return;
    var inputs = $$("input", box), arc = $("[data-docs-arc]", box), count = $("[data-docs-count]", box), msg = $("[data-docs-msg]", box);
    var saved = (store.get("cfc-docs") || "").split(",");
    inputs.forEach(function (i) { i.checked = saved.indexOf(i.value) > -1; });
    function update() {
      var on = inputs.filter(function (i) { return i.checked; });
      var n = on.length;
      count.textContent = n;
      arc.style.strokeDashoffset = (1 - n / inputs.length).toFixed(3);
      msg.textContent = t("docs." + n);
      store.set("cfc-docs", on.map(function (i) { return i.value; }).join(","));
    }
    inputs.forEach(function (i) { i.addEventListener("change", update); });
    onLang(update);
    update();
  }

  /* ================= 05 · Galería ================= */
  function initGallery() {
    var g = $("[data-gallery]");
    if (!g) return;
    var track = $("[data-gallery-track]", g), shots = $$(".shot", track);
    var curEl = $("[data-gallery-current]", g), bar = $("[data-gallery-bar]", g);
    var prev = $("[data-gallery-prev]", g), next = $("[data-gallery-next]", g);
    var index = 0;
    function rtl() { return root.dir === "rtl"; }

    // En escritorio la galería se fija y avanza en horizontal con el scroll vertical
    var mqPin = matchMedia("(min-width: 960px)");
    var pinned = false, dist = 0, pinP = 0;
    function measurePin() {
      pinned = mqPin.matches;
      g.classList.toggle("is-pinned", pinned);
      if (!pinned) { g.style.height = ""; track.style.transform = ""; update(); return; }
      track.scrollLeft = 0;
      dist = Math.max(0, track.offsetWidth - track.parentNode.clientWidth);   // la pista se mueve dentro de su ventana
      // el bloque fijado mide lo que su contenido y queda centrado en pantalla (sin huecos en blanco)
      var pin = $("[data-gallery-pin]", g), ph = pin ? pin.offsetHeight : innerHeight;
      pinTop = Math.max((innerWidth >= 960 ? 84 : 76), (innerHeight - ph) / 2);
      g.style.setProperty("--pin-top", pinTop.toFixed(0) + "px");
      g.style.height = (dist + ph) + "px";
      kick();
    }
    var pinTop = 0;
    fx.push(function () {
      if (!pinned) return false;
      var r = g.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) return false;
      pinP = dist > 0 ? clamp((pinTop - r.top) / dist, 0, 1) : 0;
      track.style.transform = "translate3d(" + ((rtl() ? 1 : -1) * pinP * dist).toFixed(1) + "px,0,0)";
      update();
      return false;
    });

    function update() {
      var tr = track.getBoundingClientRect();
      var padStart = parseFloat(getComputedStyle(track).paddingInlineStart) || 0;
      var best = 0, bd = Infinity;
      shots.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        // fijada, la pista se desplaza con transform: se mide contra la pantalla
        var edge = pinned ? (rtl() ? innerWidth - r.right : r.left) : (rtl() ? tr.right - r.right : r.left - tr.left);
        var dd = Math.abs(edge - padStart);
        if (dd < bd) { bd = dd; best = i; }
        var vr = pinned ? track.parentNode.getBoundingClientRect() : tr;
        var c = pinned ? (r.left + r.width / 2 - (vr.left + vr.width / 2)) / vr.width : (r.left + r.width / 2 - (tr.left + tr.width / 2)) / tr.width;
        s.style.setProperty("--px", (clamp(c, -1.2, 1.2) * -5).toFixed(2) + "%");
      });
      var max = track.scrollWidth - track.clientWidth;
      if (pinned) best = Math.round(pinP * (shots.length - 1));   // fijada: el número sigue al avance
      else if (max > 0 && Math.abs(track.scrollLeft) >= max - 4) best = shots.length - 1;
      index = best;
      curEl.textContent = pad2(best + 1);
      bar.style.width = (((best + 1) / shots.length) * 100).toFixed(1) + "%";
    }
    var ticking = false;
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    addEventListener("resize", update);
    function go(dir) {
      var i = clamp(index + dir, 0, shots.length - 1);
      if (pinned) {
        // fijada: se lleva la página al punto del scroll que corresponde a esa foto
        var p = shots.length > 1 ? i / (shots.length - 1) : 0;
        scrollTo({ top: g.getBoundingClientRect().top + scrollY - pinTop + p * dist + 1, behavior: reduced ? "auto" : "smooth" });
        return;
      }
      var tr = track.getBoundingClientRect(), r = shots[i].getBoundingClientRect();
      var padStart = parseFloat(getComputedStyle(track).paddingInlineStart) || 0;
      var delta = rtl() ? -((tr.right - padStart) - r.right) : (r.left - tr.left - padStart);
      track.scrollBy({ left: delta, behavior: reduced ? "auto" : "smooth" });
    }
    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });

    // arrastrar con el ratón
    var down = false, moved = false, sx = 0, sl = 0;
    track.addEventListener("pointerdown", function (e) {
      if (pinned || e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = track.scrollLeft;
    });
    addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add("is-drag"); }
      if (moved) { track.scrollLeft = sl - dx; e.preventDefault(); }
    });
    addEventListener("pointerup", function () {
      if (!down) return;
      down = false;
      if (moved) {
        track.classList.remove("is-drag");
        setTimeout(function () { go(0); }, 30);
        track.__justDragged = true;
        setTimeout(function () { track.__justDragged = false; }, 60);
      }
    });
    measurePin();
    var pt;
    addEventListener("resize", function () { clearTimeout(pt); pt = setTimeout(measurePin, 150); });
    addEventListener("load", measurePin);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(measurePin);
    onLang(function () { setTimeout(measurePin, 60); });
    update();

    // visor
    var dlg = $("[data-lightbox-dialog]");
    if (!dlg || typeof dlg.showModal !== "function") return;
    var img = $("[data-lightbox-img]", dlg), cap = $("[data-lightbox-cap]", dlg), li = 0;
    function show(i) {
      li = (i + shots.length) % shots.length;
      var simg = $("img", shots[li]);
      var srcs = (simg.getAttribute("srcset") || "").split(",").map(function (x) { return x.trim().split(" ")[0]; });
      img.src = srcs[srcs.length - 1] || simg.src;
      img.alt = simg.alt;
      var c = $("figcaption", shots[li]);
      cap.textContent = c ? c.textContent.replace(/\s+/g, " ").trim() : "";
    }
    $$("[data-lightbox]", track).forEach(function (b) {
      b.addEventListener("click", function (e) {
        if (track.__justDragged) { e.preventDefault(); return; }
        show(+b.getAttribute("data-lightbox"));
        dlg.showModal();
      });
    });
    $("[data-lightbox-prev]", dlg).addEventListener("click", function () { show(li + (rtl() ? 1 : -1)); });
    $("[data-lightbox-next]", dlg).addEventListener("click", function () { show(li + (rtl() ? -1 : 1)); });
    $("[data-lightbox-close]", dlg).addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(li + (rtl() ? 1 : -1));
      if (e.key === "ArrowRight") show(li + (rtl() ? -1 : 1));
    });
  }

  /* ================= 06 · Quiz ================= */
  function initQuiz() {
    var box = $("[data-quiz]");
    var Q = B.quiz || [];
    if (!box || !Q.length) return;
    var body = $("[data-quiz-body]", box), stepEl = $("[data-quiz-step]", box), scoreEl = $("[data-quiz-score]", box);
    var st = { i: -1, score: 0, picked: null };

    function L(item) { return item[I18N.lang] || item.fr; }
    function progress(n) { box.style.setProperty("--p", (n / Q.length * 100).toFixed(1) + "%"); }
    function animateIn() { body.classList.remove("is-in"); void body.offsetWidth; body.classList.add("is-in"); }
    function startHTML() {
      var q = tr("quiz.start.q", "Panneaux, distances, premiers secours… vous connaissez&nbsp;?");
      var b = tr("quiz.start", "Commencer le quiz");
      return '<div class="qbox__start"><p class="qbox__q">' + q + '</p><button class="btn btn--sun" type="button" data-quiz-start><span>' + esc(b) +
        '</span> <svg class="ico ico--arrow" aria-hidden="true"><use href="#i-arrow"/></svg></button></div>';
    }
    function render(anim) {
      scoreEl.textContent = st.score;
      if (st.i < 0) {
        stepEl.textContent = t("quiz.count");
        body.innerHTML = startHTML();
        progress(0);
      } else if (st.i >= Q.length) {
        stepEl.textContent = t("quiz.done");
        progress(Q.length);
        var r = st.score === Q.length ? "quiz.r3" : st.score >= 4 ? "quiz.r2" : "quiz.r1";
        body.innerHTML = '<div class="qbox__result"><p class="qbox__score" dir="ltr">' + st.score + '<small> / ' + Q.length + '</small></p>' +
          '<p class="qbox__msg">' + esc(t(r)) + '</p><div class="qbox__actions">' +
          '<a class="btn btn--sun" href="#contact"><span>' + esc(t("quiz.cta")) + '</span> <svg class="ico ico--arrow" aria-hidden="true"><use href="#i-arrow"/></svg></a>' +
          '<button class="btn btn--line" type="button" data-quiz-restart>' + esc(t("quiz.again")) + '</button></div></div>';
      } else {
        var item = Q[st.i], tx = L(item), keys = t("keys");
        stepEl.textContent = t("quiz.q", { n: st.i + 1, t: Q.length });
        progress(st.i);
        var sign = item.sign && B.signs && B.signs[item.sign]
          ? '<div class="qbox__sign" role="img" aria-label="' + esc(t("sign." + item.sign)) + '">' + B.signs[item.sign] + "</div>" : "";
        body.innerHTML = sign + '<p class="qbox__q">' + esc(tx.q) + '</p><div class="qbox__answers">' +
          tx.a.map(function (a, k) {
            return '<button class="ans" type="button" data-k="' + k + '"><span class="ans__k">' + esc(keys[k]) + "</span><span>" + esc(a) + "</span></button>";
          }).join("") + "</div>";
        if (st.picked != null) reveal(false);
      }
      if (anim !== false) animateIn();
    }
    function reveal(anim) {
      var item = Q[st.i], tx = L(item);
      $$(".ans", body).forEach(function (b) {
        var k = +b.getAttribute("data-k");
        b.disabled = true;
        if (k === item.ok) b.classList.add("is-ok");
        else if (k === st.picked) b.classList.add("is-ko");
      });
      var good = st.picked === item.ok;
      var last = st.i === Q.length - 1;
      var after = doc.createElement("div");
      after.innerHTML = '<p class="qbox__why"><b>' + esc(t(good ? "quiz.right" : "quiz.wrong")) + "</b>" + esc(tx.why) + "</p>" +
        '<button class="btn btn--ink qbox__next" type="button" data-quiz-next><span>' + esc(t(last ? "quiz.see" : "quiz.next")) +
        '</span> <svg class="ico ico--arrow" aria-hidden="true"><use href="#i-arrow"/></svg></button>';
      while (after.firstChild) body.appendChild(after.firstChild);
      if (anim) { var n = $("[data-quiz-next]", body); if (n) n.focus({ preventScroll: true }); }
    }
    body.addEventListener("click", function (e) {
      if (e.target.closest("[data-quiz-start]")) { st.i = 0; st.score = 0; st.picked = null; render(); var a = $(".ans", body); if (a) a.focus({ preventScroll: true }); return; }
      if (e.target.closest("[data-quiz-restart]")) { st.i = 0; st.score = 0; st.picked = null; render(); return; }
      if (e.target.closest("[data-quiz-next]")) { st.i++; st.picked = null; render(); var f = $(".ans, .qbox__result .btn", body); if (f) f.focus({ preventScroll: true }); return; }
      var ans = e.target.closest(".ans");
      if (ans && st.picked == null && !ans.disabled) {
        st.picked = +ans.getAttribute("data-k");
        if (st.picked === Q[st.i].ok) st.score++;
        scoreEl.textContent = st.score;
        progress(st.i + 1);
        reveal(true);
      }
    });
    onLang(function () { render(false); });
    render(false);
  }

  /* ================= WhatsApp ================= */
  function waURL(text) { return "https://wa.me/" + (B.whatsapp || "212755846785") + "?text=" + encodeURIComponent(text); }
  function buildMsg(objet, formation, name, extra) {
    var M = (B.msg || {})[I18N.lang] || (B.msg || {}).fr;
    if (!M) return "";
    var s = M.hello + (name ? fill(M.me, { n: name }) : "") + ". ";
    s += fill(M.want, { o: M.objets[objet] || M.objets.inscription });
    s += formation && M.formations[formation] ? fill(M.forma, { f: M.formations[formation] }) : M.nsp;
    s += ".";
    if (extra) s += "\n" + extra;
    return s;
  }
  function openWA(text) {
    var w = window.open(waURL(text), "_blank", "noopener");
    if (!w) location.href = waURL(text);
  }
  function initBooking() {
    var f = $("[data-booking]");
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      openWA(buildMsg("inscription", f.elements.formation.value, f.elements.nom.value.trim(), ""));
    });
  }
  function initComposer() {
    var f = $("[data-composer]");
    if (!f) return;
    var prev = $("[data-wa-preview]", f);
    function current() {
      var o = $("input[name=objet]:checked", f);
      return buildMsg(o ? o.value : "inscription", f.elements.formation.value, f.elements.nom.value.trim(), f.elements.text.value.trim());
    }
    function update() { prev.textContent = current(); }
    f.addEventListener("input", update);
    f.addEventListener("change", update);
    f.addEventListener("submit", function (e) { e.preventDefault(); openWA(current()); });
    onLang(update);
    update();
  }

  /* ================= Horario: abierto / cerrado y reloj de Nador ================= */
  function initStatus() {
    var H = B.hours;
    if (!H || !window.Intl) return;
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat("en-GB", { timeZone: H.timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", hourCycle: "h23" });
    } catch (e) { return; }
    var DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    function now() {
      var o = {};
      fmt.formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
      return { d: DAYS[o.weekday], h: +o.hour % 24, m: +o.minute, s: +o.second };
    }
    var hh = function (h) { return pad2(h) + ":00"; };
    function statusText(n) {
      var dayOpen = H.openDays.indexOf(n.d) > -1;
      if (dayOpen && n.h >= H.open && n.h < H.close) return { open: true, txt: t("st.open", { h: hh(H.close) }) };
      if (dayOpen && n.h < H.open) return { open: false, txt: t("st.later", { h: hh(H.open) }) };
      for (var k = 1; k <= 7; k++) {
        var d = (n.d + k) % 7;
        if (H.openDays.indexOf(d) > -1) {
          var name = k === 1 ? t("st.tomorrow") : t("days")[d];
          return { open: false, txt: t("st.next", { d: name, h: hh(H.open) }) };
        }
      }
      return { open: false, txt: "" };
    }
    var statusEls = $$("[data-status]"), clocks = $$("[data-clock]"), shorts = $$("[data-clock-short]");
    // barra del día: avance de la jornada entre la apertura y el cierre
    var bars = $$("[data-daybar]");
    bars.forEach(function (b) {
      var sm = $$("small", b);
      if (sm[0]) sm[0].textContent = hh(H.open);
      if (sm[1]) sm[1].textContent = hh(H.close);
    });
    function tick() {
      var n = now(), st = statusText(n);
      var frac = H.openDays.indexOf(n.d) > -1 ? clamp((n.h + n.m / 60 + n.s / 3600 - H.open) / (H.close - H.open), 0, 1) : 0;
      bars.forEach(function (b) { b.style.setProperty("--d", frac.toFixed(4)); b.classList.toggle("is-closed", !st.open); });
      statusEls.forEach(function (el) {
        el.classList.toggle("is-open", st.open);
        el.classList.toggle("is-closed", !st.open);
        var tx = $("[data-status-text]", el);
        if (tx) tx.textContent = st.txt;
      });
      var hm = pad2(n.h) + ":" + pad2(n.m);
      clocks.forEach(function (c) { c.textContent = hm + ":" + pad2(n.s); });
      shorts.forEach(function (c) { c.textContent = hm; });
    }
    tick();
    setInterval(tick, 1000);
    onLang(tick);
  }

  /* ================= Varios ================= */
  function initYear() { $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); }); }
  function initAnchors() {
    // los enlaces internos se desplazan con suavidad y dejan sitio a la cabecera
    doc.addEventListener("click", function (e) {
      var a = e.target.closest("a[href^='#']");
      if (!a) return;
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var el = doc.getElementById(id.slice(1));
      if (!el) return;
      e.preventDefault();
      var top = id === "#accueil" ? 0 : el.getBoundingClientRect().top + scrollY - (innerWidth >= 960 ? 84 : 76) + 1;
      scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
      if (history.replaceState) history.replaceState(null, "", id);
    });
  }

  /* ================= Arranque ================= */
  function boot() {
    root.classList.add("js-ok");
    safe(initI18n, "initI18n");
    safe(initSplash, "initSplash");
    safe(initHeader, "initHeader");
    safe(initMenu, "initMenu");
    safe(initHeroVideo, "initHeroVideo");
    safe(initHeroScroll, "initHeroScroll");
    safe(initHeroDepth, "initHeroDepth");
    safe(initSplit, "initSplit");
    safe(initReveals, "initReveals");
    safe(initWords, "initWords");
    safe(initZoom, "initZoom");
    safe(initRibbon, "initRibbon");
    safe(initPhotoParallax, "initPhotoParallax");
    safe(initOdometers, "initOdometers");
    safe(initTrafficLight, "initTrafficLight");
    safe(initGps, "initGps");
    safe(initSignLean, "initSignLean");
    safe(initTilt, "initTilt");
    safe(initMagnetic, "initMagnetic");
    safe(initFormations, "initFormations");
    safe(initProgramme, "initProgramme");
    safe(initRoute, "initRoute");
    safe(initDocs, "initDocs");
    safe(initGallery, "initGallery");
    safe(initQuiz, "initQuiz");
    safe(initBooking, "initBooking");
    safe(initComposer, "initComposer");
    safe(initStatus, "initStatus");
    safe(initYear, "initYear");
    safe(initAnchors, "initAnchors");
    safe(initLoop, "initLoop");
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
