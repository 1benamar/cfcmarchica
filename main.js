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

  /* ================= Idioma (FR / AR) ================= */
  var I18N = { lang: "fr", listeners: [] };
  function isAr() { return I18N.lang === "ar"; }
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
    var ar = B.ar || {};
    $$("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var html = lang === "ar" ? ar[key] : el.__fr;
      if (html == null) return;
      if (el.hasAttribute("data-words")) splitWords(el, html);
      else el.innerHTML = html;
    });
    $$("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var p = pair.split(":"), attr = p[0], key = p[1];
        var v = lang === "ar" ? ar[key] : (el.__frAttr || {})[attr];
        if (v != null) el.setAttribute(attr, v);
      });
    });
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    if (B.titles) doc.title = B.titles[lang] || B.titles.fr;
    I18N.lang = lang;
    store.set("cfc-lang", lang);
    I18N.listeners.forEach(function (fn) { safe(fn, "lang"); });
  }

  function initI18n() {
    captureFr();
    var saved = store.get("cfc-lang");
    if (saved === "ar") applyLang("ar");
    else { root.lang = "fr"; root.dir = "ltr"; }
    $$("[data-lang-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = isAr() ? "fr" : "ar";
        if (doc.startViewTransition && !reduced) doc.startViewTransition(function () { applyLang(next); });
        else applyLang(next);
      });
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
    function ready() { setTimeout(hide, Math.max(0, 1650 - (performance.now() - t0))); }
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

  /* ================= Vídeo del hero ================= */
  function initHeroVideo() {
    var v = $("[data-hero-video]"), btn = $("[data-video-toggle]");
    if (!v) return;
    var conn = navigator.connection || {};
    if (conn.saveData || /(^|-)2g/.test(conn.effectiveType || "")) return;   // datos limitados: solo póster
    var portrait = matchMedia("(orientation: portrait)").matches;
    var w = innerWidth * Math.min(devicePixelRatio || 1, 2);
    var mp4 = v.canPlayType('video/mp4; codecs="avc1.640028"') !== "";
    var src = mp4
      ? (portrait ? v.getAttribute("data-src-tall") : (w > 1500 ? v.getAttribute("data-src-wide") : v.getAttribute("data-src-mid")))
      : (portrait ? v.getAttribute("data-src-tall-webm") : v.getAttribute("data-src-webm"));
    if (portrait) v.poster = v.getAttribute("data-poster-tall");
    v.removeAttribute("autoplay");
    v.autoplay = false;
    v.muted = true;
    v.setAttribute("muted", "");
    v.preload = "auto";
    v.src = src;
    var userPaused = reduced;   // con movimiento reducido no arranca solo
    var visible = true;
    function label() {
      if (!btn) return;
      btn.classList.toggle("is-paused", v.paused);
      btn.setAttribute("aria-label", t(v.paused ? "video.play" : "video.pause"));
    }
    function play() {
      if (userPaused || !visible || !heroStarted) return;
      var p = v.play();
      if (p && p.catch) p.catch(function () { label(); });
    }
    v.addEventListener("playing", function () { v.classList.add("is-playing"); label(); });
    v.addEventListener("pause", label);
    window.__playHero = play;
    if (heroStarted) play();
    if (btn) {
      btn.hidden = false;
      label();
      btn.addEventListener("click", function () {
        if (v.paused) { userPaused = false; v.classList.add("is-playing"); play(); }
        else { userPaused = true; v.pause(); }
        label();
      });
    }
    onLang(label);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible) play(); else v.pause();
      }, { threshold: 0 }).observe(v);
    }
  }

  /* ================= Apariciones al hacer scroll ================= */
  function initReveals() {
    var els = $$(".reveal");
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
    $$(".facts, .head").forEach(function (g) {
      $$(".reveal", g).forEach(function (e, i) { e.style.transitionDelay = (i * 0.09).toFixed(2) + "s"; });
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

  /* ================= 03 · Programa: el capítulo activo cambia el icono ================= */
  function initProgramme() {
    var chaps = $$("[data-chap]"), icons = $$("[data-prog-icon]"), num = $("[data-prog-num]");
    if (!chaps.length || !("IntersectionObserver" in window)) return;
    function activate(i) {
      chaps.forEach(function (c, j) { c.classList.toggle("is-active", i === j); });
      icons.forEach(function (ic, j) { ic.classList.toggle("is-on", i === j); });
      if (num) num.textContent = pad2(i + 1);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) activate(+en.target.getAttribute("data-chap")); });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    chaps.forEach(function (c) { io.observe(c); });
  }

  /* ================= 04 · La carretera que se dibuja (firma) ================= */
  function initRoute() {
    var body = $("[data-route-body]"), svg = $("[data-route-svg]");
    if (!body || !svg) return;
    var asphalt = $("[data-route-path]"), line = $("[data-route-line]"), done = $("[data-route-done]"), car = $("[data-route-car]");
    var steps = $$("[data-step]", body);
    var dots = steps.map(function (s) { return $(".step__dot", s); });
    var len = 0, stepAt = [], cur = 0, built = false;

    function lengthAtY(y) {
      var lo = 0, hi = len;
      for (var k = 0; k < 22; k++) {
        var mid = (lo + hi) / 2;
        if (done.getPointAtLength(mid).y < y) lo = mid; else hi = mid;
      }
      return lo;
    }
    function build() {
      var br = body.getBoundingClientRect();
      if (!br.width || !br.height) return;
      svg.setAttribute("viewBox", "0 0 " + br.width.toFixed(1) + " " + br.height.toFixed(1));
      var pts = dots.map(function (d) {
        var r = d.getBoundingClientRect();
        return { x: r.left + r.width / 2 - br.left, y: r.top + r.height / 2 - br.top };
      });
      var all = [{ x: pts[0].x, y: 0 }].concat(pts, [{ x: pts[pts.length - 1].x, y: br.height }]);
      var wide = innerWidth >= 960;
      var d = "M" + all[0].x.toFixed(1) + " " + all[0].y.toFixed(1);
      for (var i = 1; i < all.length; i++) {
        var a = all[i - 1], b = all[i], my = (b.y - a.y) * 0.5;
        // en móvil la línea es recta: se le da una ligera curva en S
        var wig = wide ? 0 : (i % 2 ? 22 : -22);
        d += " C" + (a.x + wig).toFixed(1) + " " + (a.y + my).toFixed(1) + " " + (b.x - wig).toFixed(1) + " " + (b.y - my).toFixed(1) + " " + b.x.toFixed(1) + " " + b.y.toFixed(1);
      }
      [asphalt, line, done].forEach(function (p) { p.setAttribute("d", d); });
      len = done.getTotalLength();
      done.style.strokeDasharray = len + " " + len;
      stepAt = pts.map(function (p) { return lengthAtY(p.y); });
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
      var br = body.getBoundingClientRect();
      var targetY = innerHeight * 0.62 - br.top;
      var target = targetY <= 0 ? 0 : (targetY >= br.height ? len : lengthAtY(targetY));
      cur = reduced ? target : lerp(cur, target, 0.12);
      done.style.strokeDashoffset = (len - cur).toFixed(1);
      var p = done.getPointAtLength(cur), q = done.getPointAtLength(Math.min(len, cur + 2));
      var ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
      if (cur >= len - 2) ang = 90;
      car.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ") rotate(" + ang.toFixed(1) + ")");
      steps.forEach(function (s, i) { s.classList.toggle("is-reached", cur >= stepAt[i] - 4); });
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
    function update() {
      var tr = track.getBoundingClientRect();
      var padStart = parseFloat(getComputedStyle(track).paddingInlineStart) || 0;
      var best = 0, bd = Infinity;
      shots.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var edge = rtl() ? tr.right - r.right : r.left - tr.left;
        var dd = Math.abs(edge - padStart);
        if (dd < bd) { bd = dd; best = i; }
        var c = (r.left + r.width / 2 - (tr.left + tr.width / 2)) / tr.width;
        s.style.setProperty("--px", (clamp(c, -1.2, 1.2) * -5).toFixed(2) + "%");
      });
      var max = track.scrollWidth - track.clientWidth;
      if (max > 0 && Math.abs(track.scrollLeft) >= max - 4) best = shots.length - 1;
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
      if (e.pointerType !== "mouse" || e.button !== 0) return;
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
      var ar = B.ar || {};
      var q = isAr() ? ar["quiz.start.q"] : "Panneaux, distances, premiers secours… vous connaissez&nbsp;?";
      var b = isAr() ? ar["quiz.start"] : "Commencer le quiz";
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
    function tick() {
      var n = now(), st = statusText(n);
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

  /* ================= FAQ con altura animada ================= */
  function initFaq() {
    $$(".qa").forEach(function (d) {
      var s = $("summary", d), a = $(".qa__a", d);
      if (!s || !a) return;
      s.addEventListener("click", function (e) {
        if (reduced) return;
        e.preventDefault();
        var end = function () { a.style.height = ""; a.removeEventListener("transitionend", end); };
        if (d.open) {
          a.style.height = a.scrollHeight + "px";
          requestAnimationFrame(function () {
            a.style.height = "0px";
            setTimeout(function () { d.open = false; end(); }, 560);
          });
        } else {
          d.open = true;
          var h = a.scrollHeight;
          a.style.height = "0px";
          requestAnimationFrame(function () {
            a.style.height = h + "px";
            setTimeout(end, 600);
          });
        }
      });
    });
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
    safe(initReveals, "initReveals");
    safe(initWords, "initWords");
    safe(initFormations, "initFormations");
    safe(initProgramme, "initProgramme");
    safe(initRoute, "initRoute");
    safe(initDocs, "initDocs");
    safe(initGallery, "initGallery");
    safe(initQuiz, "initQuiz");
    safe(initBooking, "initBooking");
    safe(initComposer, "initComposer");
    safe(initStatus, "initStatus");
    safe(initFaq, "initFaq");
    safe(initYear, "initYear");
    safe(initAnchors, "initAnchors");
    safe(initLoop, "initLoop");
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
