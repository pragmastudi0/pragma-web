/* ═══════════════ MOTION · motor ═══════════════
   Sistema de movimiento compartido (ver css/motion.css para el lenguaje visual).

   Uso en el HTML:
     data-m="rise | fade | eyebrow | lines | words | fill | clip | draw | draw-b"
     data-m-inner            dentro de un "clip": el medio que escala de 1.08 a 1
     data-m-group            contenedor cuya secuencia arranca al cargar la página;
                             cada hijo indica su momento con data-m-at="ms"
     data-m-stagger="ms"     paso entre los hijos animados de ese contenedor
     data-m-base="ms"        espera antes del primer hijo de ese contenedor
     data-m-parallax="px"    desplazamiento vertical leve ligado al scroll
     data-m-scroll="expand"  panel que se abre al ancho completo al entrar

   Garantías:
     · Sin la clase `motion` en <html> (la pone js/motion-boot.js) este archivo no hace nada.
     · Cualquier error durante el arranque quita la clase y deja todo visible.
     · Un solo IntersectionObserver para las entradas y un solo listener de scroll
       (pasivo, con requestAnimationFrame) para todo lo ligado al desplazamiento.
     · No toca el scroll nativo. */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('motion')) { initNav(); return; }

  var ac = new AbortController();
  var io = null;
  var timers = [];

  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

  function bail(err) {
    root.classList.remove('motion');
    window.__motion = 'off';
    try { ac.abort(); } catch (e) {}
    if (io) io.disconnect();
    timers.forEach(clearTimeout);
    document.querySelectorAll('.is-split').forEach(function (el) { unsplit(el); });
    if (err && window.console) console.error('[motion] desactivado:', err);
  }

  /* ───────────── Configuración responsive ───────────── */
  function cssNumber(name, fallback) {
    var v = parseFloat(getComputedStyle(root).getPropertyValue(name));
    return isNaN(v) ? fallback : v;
  }

  function config() {
    var mobile = window.matchMedia('(max-width: 768px)').matches;
    return {
      mobile: mobile,
      stagger: cssNumber('--m-stagger', 80),
      staggerIn: cssNumber('--m-stagger-in', 60),
      lineStep: mobile ? 75 : 90,
      wordStep: mobile ? 65 : 80,
      titleDur: mobile ? 1000 : 1200,
      timeScale: mobile ? 0.85 : 1,     // la secuencia de carga es algo más breve en mobile
      parallaxScale: mobile ? 0.5 : 1,
      margin: mobile ? '0px 0px -8% 0px' : '0px 0px -12% 0px'
    };
  }

  /* ───────────── División de títulos ─────────────
     Envuelve las palabras sin tocar los elementos [data-i18n-en]: el cambio de
     idioma reescribe su texto y un MutationObserver vuelve a dividir. */
  var PUNCT = /^[.,;:!?…)»”’]+$/;
  var SPLIT_TYPES = { lines: 1, words: 1, fill: 1 };

  function textNodes(el) {
    var out = [];
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      if (n.parentElement && n.parentElement.closest('.sr-only')) continue;
      out.push(n);
    }
    return out;
  }

  function split(el) {
    var mode = el.getAttribute('data-m');
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    var count = 0;

    textNodes(el).forEach(function (node) {
      var parts = node.nodeValue.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function (part, idx) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }

        var span = document.createElement('span');
        if (mode === 'fill') {
          span.className = 'm-f';
          span.textContent = part;
        } else if (idx === 0 && count > 0 && PUNCT.test(part)) {
          // Signo pegado a la palabra anterior: queda en línea para que no pueda
          // saltar solo al renglón siguiente.
          span.className = 'm-p';
          span.textContent = part;
        } else {
          span.className = 'm-w';
          var inner = document.createElement('span');
          inner.className = 'm-wi';
          inner.textContent = part;
          span.appendChild(inner);
        }
        span.setAttribute('aria-hidden', 'true');
        frag.appendChild(span);
        count++;
      });
      node.parentNode.replaceChild(frag, node);
    });

    // Los lectores de pantalla leen el título entero, no palabra por palabra.
    el.setAttribute('aria-label', label);
    el.classList.add('is-split');
  }

  function unsplit(el) {
    el.querySelectorAll('.m-w, .m-p, .m-f').forEach(function (s) {
      s.parentNode.replaceChild(document.createTextNode(s.textContent), s);
    });
    el.normalize();
    el.removeAttribute('aria-label');
    el.classList.remove('is-split');
  }

  // Asigna a cada palabra el índice de su línea (o de palabra, en "words").
  function indexUnits(el) {
    var mode = el.getAttribute('data-m');
    var units = el.querySelectorAll('.m-w, .m-p');
    var line = -1, lineTop = null, lineH = 0, word = -1, count = 0;
    var rects = [];
    units.forEach(function (u) { rects.push(u.getBoundingClientRect()); });  // lecturas
    units.forEach(function (u, i) {                                           // escrituras
      var r = rects[i];
      var isWord = u.classList.contains('m-w');
      if (isWord) word++;
      if (isWord && (lineTop === null || Math.abs(r.top - lineTop) > Math.max(lineH, r.height) * 0.55)) {
        line++; lineTop = r.top; lineH = r.height;
      }
      var value = mode === 'words' ? Math.max(word, 0) : Math.max(line, 0);
      u.style.setProperty('--l', value);
      count = value + 1;
    });
    return count;
  }

  function watchText(el, onChange) {
    var mo = new MutationObserver(function () {
      mo.disconnect();
      onChange();
      if (el.__m && !el.__m.done) mo.observe(el, { childList: true, subtree: true, characterData: true });
    });
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    ac.signal.addEventListener('abort', function () { mo.disconnect(); });
    return mo;
  }

  /* ───────────── Entradas ───────────── */
  var cfg;
  var pending = 0;

  function state(el) { return el.__m || (el.__m = { in: false, done: false, delay: 0 }); }

  function durationOf(el, units) {
    switch (el.getAttribute('data-m')) {
      case 'lines': return cfg.titleDur + units * cfg.lineStep + 700;
      case 'words': return 1000 + units * cfg.wordStep + 700;
      case 'clip': return 1700;
      case 'draw':
      case 'draw-b': return 1300;
      default: return 1200;
    }
  }

  function finish(el) {
    var st = state(el);
    if (st.done) return;
    st.done = true;
    st.in = true;
    if (io) io.unobserve(el);
    el.classList.add('is-in', 'is-done');
    el.style.removeProperty('--m-delay');
    if (st.mo) st.mo.disconnect();
    if (el.classList.contains('is-split')) unsplit(el);
    if (--pending <= 0 && io) { io.disconnect(); io = null; }
  }

  function reveal(el, delay) {
    var st = state(el);
    if (st.in) return;
    st.in = true;
    st.delay = delay;
    var units = 0;
    if (el.classList.contains('is-split')) units = indexUnits(el);
    if (delay) el.style.setProperty('--m-delay', Math.round(delay) + 'ms');
    el.classList.add('is-in');
    if (io) io.unobserve(el);
    later(function () { finish(el); }, delay + durationOf(el, units));
  }

  // Contenedor que define el ritmo de un elemento: la card que lo contiene o un
  // [data-m-stagger] (por ejemplo, la conversación de ejemplo de Claudia).
  function scopeOf(el) {
    var p = el.parentElement;
    return p ? p.closest('[data-m], [data-m-stagger]') : null;
  }
  function ownerOf(el) {
    var p = el.parentElement;
    return p ? p.closest('[data-m]') : null;
  }

  function onIntersect(entries) {
    var entering = [];
    entries.forEach(function (entry) {
      var el = entry.target;
      if (state(el).in) return;
      if (entry.isIntersecting) entering.push(el);
      else if (entry.boundingClientRect.bottom < 0) finish(el);   // ya quedó arriba: sin animación
    });
    if (!entering.length) return;

    // Orden de lectura
    entering.sort(function (a, b) {
      return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
    });

    var top = 0;                 // elementos sueltos que entran juntos
    var counters = new Map();    // hijos por contenedor
    entering.forEach(function (el) {
      var scope = scopeOf(el);
      var owner = ownerOf(el);
      if (!scope) {
        reveal(el, Math.min(top, 6) * cfg.stagger);
        top++;
        return;
      }
      var i = counters.get(scope) || 0;
      counters.set(scope, i + 1);
      var step = parseFloat(scope.getAttribute('data-m-stagger')) || cfg.staggerIn;
      var base = parseFloat(scope.getAttribute('data-m-base'));
      if (isNaN(base)) base = scope.hasAttribute('data-m') ? 180 : 0;
      // Si la card que lo contiene está entrando ahora, el contenido espera a la cortina.
      var ownerDelay = 0;
      if (owner && state(owner).in && !state(owner).done) ownerDelay = state(owner).delay;
      reveal(el, ownerDelay + base + Math.min(i, 8) * step);
    });
  }

  /* ───────────── Ligadas al scroll ───────────── */
  var fills = [];
  var parallax = [];
  var expands = [];
  var nav = null;
  var ticking = false;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function paintFill(item) {
    var words = item.el.querySelectorAll('.m-f');
    var n = words.length;
    var SPREAD = 3;   // cuántas palabras abarca el frente de tinta
    for (var i = 0; i < n; i++) {
      var a = clamp((item.p * (n + SPREAD) - i) / SPREAD);
      var o = (0.16 + 0.84 * a).toFixed(2);
      if (words[i].__o !== o) { words[i].__o = o; words[i].style.setProperty('--o', o); }
    }
  }

  function tick() {
    ticking = false;
    var vh = window.innerHeight;
    var atEnd = window.scrollY + vh >= document.documentElement.scrollHeight - 4;

    // Lecturas
    var fr = fills.map(function (f) { return f.done ? null : f.el.getBoundingClientRect(); });
    var pr = parallax.map(function (p) { return p.el.getBoundingClientRect(); });
    var er = expands.map(function (e) { return e.el.getBoundingClientRect(); });

    // Escrituras
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);

    fills.forEach(function (f, i) {
      if (f.done) return;
      var r = fr[i];
      var start = vh * 0.92, end = vh * 0.5;
      var p = atEnd || r.bottom < 0 ? 1 : clamp((start - r.top) / (start - end));
      if (p > f.p) { f.p = p; paintFill(f); }      // solo avanza: una vez leído, queda entintado
      if (f.p >= 1) { f.done = true; later(function () { finish(f.el); }, 500); }
    });

    parallax.forEach(function (p, i) {
      var r = pr[i];
      if (r.bottom < -80 || r.top > vh + 80) return;
      var center = r.top + r.height / 2 - p.y;      // posición sin el propio desplazamiento
      var y = -((center - vh / 2) / vh) * p.amp * cfg.parallaxScale;
      y = Math.round(y * 10) / 10;
      if (y !== p.y) { p.y = y; p.el.style.translate = '0 ' + y + 'px'; }
    });

    expands.forEach(function (e, i) {
      var r = er[i];
      var p = clamp((vh - r.top) / (vh * 0.55));
      p = Math.round(p * 1000) / 1000;
      if (p === e.p) return;
      e.p = p;
      e.el.style.setProperty('--p', p);
      e.el.classList.toggle('is-full', p >= 1);
    });
  }

  function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(tick);
  }

  /* ───────────── Arranque ───────────── */
  function init() {
    cfg = config();
    nav = document.getElementById('navbar');

    var all = Array.prototype.slice.call(document.querySelectorAll('[data-m]'));

    // 1. Títulos: dividir y vigilar cambios de texto (idioma)
    all.forEach(function (el) {
      var type = el.getAttribute('data-m');
      if (!SPLIT_TYPES[type]) return;
      split(el);
      var st = state(el);
      st.mo = watchText(el, function () {
        if (st.done) return;
        unsplit(el);
        split(el);
        if (type === 'fill') { var f = fills.filter(function (x) { return x.el === el; })[0]; if (f) paintFill(f); }
        else if (st.in) indexUnits(el);
      });
      if (type === 'fill') { fills.push({ el: el, p: 0, done: false }); pending++; }
    });

    // 2. Entradas por IntersectionObserver (todo salvo "fill" y los grupos de carga)
    io = new IntersectionObserver(onIntersect, { rootMargin: cfg.margin, threshold: 0 });
    var grouped = [];
    all.forEach(function (el) {
      if (el.getAttribute('data-m') === 'fill') return;
      pending++;
      if (el.closest('[data-m-group]')) grouped.push(el);
      else io.observe(el);
    });

    // 3. Secuencia de carga (hero). Arranca en el primer frame; si la página llega
    //    con una transición entre páginas, espera a que la cortina la descubra.
    if (grouped.length) {
      requestAnimationFrame(function () {
        var lead = window.__vt && window.__vt !== 'neutral' ? 320 : 0;
        grouped.forEach(function (el, i) {
          var at = parseFloat(el.getAttribute('data-m-at'));
          if (isNaN(at)) at = i * cfg.stagger;
          reveal(el, lead + at * cfg.timeScale);
        });
      });
    }

    // 4. Scroll
    document.querySelectorAll('[data-m-parallax]').forEach(function (el) {
      parallax.push({ el: el, amp: parseFloat(el.getAttribute('data-m-parallax')) || 14, y: 0 });
    });
    document.querySelectorAll('[data-m-scroll="expand"]').forEach(function (el) {
      expands.push({ el: el, p: -1 });
    });

    window.addEventListener('scroll', requestTick, { passive: true, signal: ac.signal });
    window.addEventListener('resize', requestTick, { passive: true, signal: ac.signal });
    window.addEventListener('orientationchange', requestTick, { passive: true, signal: ac.signal });
    window.addEventListener('load', requestTick, { once: true, signal: ac.signal });
    tick();

    // 5. Ajustes responsive y preferencia de movimiento reducido en caliente
    var mq = window.matchMedia('(max-width: 768px)');
    var onMq = function () { cfg = config(); requestTick(); };
    if (mq.addEventListener) mq.addEventListener('change', onMq, { signal: ac.signal });

    var rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    var onRm = function () { if (rm.matches) bail(); };
    if (rm.addEventListener) rm.addEventListener('change', onRm, { signal: ac.signal });

    // 6. Al volver desde el historial (bfcache) nada debe quedar oculto a medias
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) requestTick();
    }, { signal: ac.signal });
  }

  /* ───────────── Navegación (funciona también sin animaciones) ─────────────
     Estado "scrolled" de la barra y cierre del menú mobile con Escape o al tocar
     fuera. La apertura y el cierre con el botón siguen en el script de cada página. */
  function initNav() {
    var navEl = document.getElementById('navbar');
    var links = document.getElementById('navLinks');
    var toggle = document.getElementById('navToggle');

    if (navEl && !root.classList.contains('motion')) {
      var onScroll = function () { navEl.classList.toggle('scrolled', window.scrollY > 50); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    if (!links || !toggle) return;

    function close(returnFocus) {
      if (!links.classList.contains('open')) return;
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      if (returnFocus) toggle.focus();
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close(true);
    });
    document.addEventListener('click', function (e) {
      if (!links.contains(e.target) && !toggle.contains(e.target)) close(false);
    });
  }

  /* ───────────── Inicio ───────────── */
  try {
    initNav();
    init();
    window.__motion = 'on';
  } catch (err) {
    bail(err);
  }
})();
