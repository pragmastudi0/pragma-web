/* ============================================================
   pragma studio — gestión de consentimiento de cookies
   - Google Consent Mode v2 (denegado por defecto, ver <head>)
   - Banner con Aceptar / Rechazar / Configurar (igual facilidad)
   - Preferencias persistidas en localStorage y revocables desde el footer
   ============================================================ */
(function () {
  'use strict';

  var STORE = 'pragma-consent-v1';

  function gtagSafe() {
    if (typeof window.gtag === 'function') {
      window.gtag.apply(window, arguments);
    }
  }

  function readConsent() {
    try { return JSON.parse(localStorage.getItem(STORE) || 'null'); }
    catch (e) { return null; }
  }

  function applyConsent(analytics) {
    gtagSafe('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied'
    });
  }

  function saveConsent(analytics) {
    var data = { analytics: !!analytics, ts: new Date().toISOString(), v: 1 };
    try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) {}
    applyConsent(data.analytics);
    return data;
  }

  // ---- Construcción del DOM --------------------------------------------
  var root, banner, modal, analyticsToggle, lastFocus;

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) { for (var k in attrs) { n.setAttribute(k, attrs[k]); } }
    if (html != null) { n.innerHTML = html; }
    return n;
  }

  function buildUI() {
    root = el('div', { id: 'pragma-consent', 'data-ready': 'true' });

    // --- Banner ---
    banner = el('div', {
      class: 'pc-banner',
      role: 'dialog',
      'aria-live': 'polite',
      'aria-label': 'Aviso de cookies',
      hidden: 'hidden'
    });
    banner.innerHTML =
      '<div class="pc-banner-inner">' +
        '<div class="pc-banner-text">' +
          '<strong>Usamos cookies</strong>' +
          '<p>Usamos Google Analytics para entender cómo se usa el sitio. ' +
          'No se activa ninguna cookie de analítica hasta que lo autorices. ' +
          '<a href="/privacidad.html">Más info</a>.</p>' +
        '</div>' +
        '<div class="pc-banner-actions">' +
          '<button type="button" class="pc-btn pc-btn-ghost" data-pc="config">Configurar</button>' +
          '<button type="button" class="pc-btn pc-btn-outline" data-pc="reject">Rechazar</button>' +
          '<button type="button" class="pc-btn pc-btn-solid" data-pc="accept">Aceptar</button>' +
        '</div>' +
      '</div>';

    // --- Modal de preferencias ---
    modal = el('div', {
      class: 'pc-modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Preferencias de cookies',
      hidden: 'hidden'
    });
    modal.innerHTML =
      '<div class="pc-modal-backdrop" data-pc="close"></div>' +
      '<div class="pc-modal-card" role="document">' +
        '<div class="pc-modal-head">' +
          '<h2>Preferencias de cookies</h2>' +
          '<button type="button" class="pc-close" data-pc="close" aria-label="Cerrar">&times;</button>' +
        '</div>' +
        '<div class="pc-modal-body">' +
          '<div class="pc-cat">' +
            '<div class="pc-cat-top">' +
              '<span class="pc-cat-name">Necesarias</span>' +
              '<span class="pc-cat-fixed">Siempre activas</span>' +
            '</div>' +
            '<p>Imprescindibles para que el sitio funcione (por ejemplo, recordar el idioma elegido). ' +
            'Se guardan solo en tu navegador y no se comparten.</p>' +
          '</div>' +
          '<div class="pc-cat">' +
            '<div class="pc-cat-top">' +
              '<label class="pc-switch">' +
                '<input type="checkbox" id="pc-analytics">' +
                '<span class="pc-slider" aria-hidden="true"></span>' +
                '<span class="pc-cat-name">Analítica</span>' +
              '</label>' +
            '</div>' +
            '<p>Google Analytics (GA4), de Google. Mide visitas y uso de forma agregada ' +
            'y puede transferir datos a Google. Desactivada por defecto.</p>' +
          '</div>' +
        '</div>' +
        '<div class="pc-modal-foot">' +
          '<button type="button" class="pc-btn pc-btn-outline" data-pc="reject">Rechazar todo</button>' +
          '<button type="button" class="pc-btn pc-btn-solid" data-pc="save">Guardar preferencias</button>' +
        '</div>' +
      '</div>';

    root.appendChild(banner);
    root.appendChild(modal);
    document.body.appendChild(root);

    analyticsToggle = modal.querySelector('#pc-analytics');

    root.addEventListener('click', onClick);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hasAttribute('hidden')) { closeModal(); }
    });
  }

  // ---- Interacciones ---------------------------------------------------
  function showBanner() { banner.removeAttribute('hidden'); }
  function hideBanner() { banner.setAttribute('hidden', 'hidden'); }

  function openModal() {
    var c = readConsent();
    analyticsToggle.checked = !!(c && c.analytics);
    lastFocus = document.activeElement;
    modal.removeAttribute('hidden');
    var card = modal.querySelector('.pc-modal-card');
    if (card) { card.focus(); }
  }
  function closeModal() {
    modal.setAttribute('hidden', 'hidden');
    if (lastFocus && typeof lastFocus.focus === 'function') { lastFocus.focus(); }
  }

  function onClick(e) {
    var t = e.target.closest('[data-pc]');
    if (!t) { return; }
    var action = t.getAttribute('data-pc');
    switch (action) {
      case 'accept':
        saveConsent(true); hideBanner(); closeModal(); break;
      case 'reject':
        saveConsent(false); hideBanner(); closeModal(); break;
      case 'config':
        openModal(); break;
      case 'save':
        saveConsent(analyticsToggle.checked); hideBanner(); closeModal(); break;
      case 'close':
        closeModal(); break;
    }
  }

  // Enlace "Preferencias de cookies" del footer (u otros disparadores)
  function bindTriggers() {
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-cookie-preferences]');
      if (trigger) { e.preventDefault(); openModal(); }
    });
  }

  // ---- Arranque --------------------------------------------------------
  function init() {
    buildUI();
    bindTriggers();
    if (!readConsent()) { showBanner(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API pública mínima
  window.PragmaConsent = {
    open: function () { if (modal) { openModal(); } },
    get: readConsent
  };
})();
