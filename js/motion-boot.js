/* ═══════════════ MOTION · arranque ═══════════════
   Se carga en <head>, antes del primer pintado. Hace dos cosas:

   1. Habilita los estados iniciales de las animaciones agregando `motion` a <html>.
      Sin esa clase, css/motion.css no oculta nada: si este archivo no carga, si el
      navegador no soporta lo necesario o si js/motion.js falla, el contenido se ve
      completo. El temporizador de abajo es la red de seguridad.

   2. Decide la dirección de la transición entre páginas (View Transitions entre
      documentos) según el orden Inicio → Proyectos → Marcas. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supported = 'IntersectionObserver' in window && 'MutationObserver' in window &&
    window.CSS && CSS.supports &&
    CSS.supports('clip-path', 'inset(0 0 0 0 round 1px)') &&
    CSS.supports('translate', '0 1px') &&
    CSS.supports('scale', '1');

  if (supported && !reduce) {
    root.classList.add('motion');
    // Si motion.js no confirma que arrancó, se muestra todo.
    setTimeout(function () {
      if (!window.__motion) root.classList.remove('motion');
    }, 2000);
  }

  // ── Transiciones entre páginas ──
  var ORDER = { '/': 0, '/index.html': 0, '/index': 0, '/proyectos.html': 1, '/proyectos': 1, '/marcas.html': 2, '/marcas': 2 };

  window.addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    var from = null;
    try {
      var act = window.navigation && window.navigation.activation;
      var url = (act && act.from && act.from.url) || document.referrer;
      if (url) from = new URL(url, location.href).pathname;
    } catch (err) { /* sin origen conocido: transición neutra */ }

    var a = ORDER[from];
    var b = ORDER[location.pathname];
    var dir = (a === undefined || b === undefined || a === b) ? 'neutral' : (b > a ? 'forward' : 'back');

    root.setAttribute('data-vt', dir);
    window.__vt = dir;
    var clear = function () { root.removeAttribute('data-vt'); };
    e.viewTransition.finished.then(clear, clear);
  });
})();
