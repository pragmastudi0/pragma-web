    // ═══════════════ NAV SCROLL ═══════════════
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });

    // ═══════════════ MOBILE NAV ═══════════════
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    toggle.setAttribute('aria-controls', 'navLinks');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // ═══════════════ ES/EN LANG TOGGLE ═══════════════
    (function langToggle() {
      const btns = document.querySelectorAll('.lang-toggle button');
      if (!btns.length) return;

      // Atributos traducibles: [atributo EN, clave dataset para el valor ES]
      const ATTRS = [
        ['href', 'i18nEsHref'],
        ['placeholder', 'i18nEsPlaceholder'],
        ['aria-label', 'i18nEsAriaLabel'],
        ['alt', 'i18nEsAlt']
      ];

      // Snapshot original ES values on load
      document.querySelectorAll('[data-i18n-en]').forEach(el => {
        el.dataset.i18nEs = el.textContent;
      });
      ATTRS.forEach(([attr, key]) => {
        document.querySelectorAll(`[data-i18n-en-${attr}]`).forEach(el => {
          el.dataset[key] = el.getAttribute(attr) || '';
        });
      });

      function setLang(lang) {
        document.documentElement.lang = lang;
        const enMode = lang === 'en';

        document.querySelectorAll('[data-i18n-en]').forEach(el => {
          el.textContent = enMode ? el.getAttribute('data-i18n-en') : el.dataset.i18nEs;
        });
        ATTRS.forEach(([attr, key]) => {
          document.querySelectorAll(`[data-i18n-en-${attr}]`).forEach(el => {
            el.setAttribute(attr, enMode ? el.getAttribute(`data-i18n-en-${attr}`) : el.dataset[key]);
          });
        });

        btns.forEach(b => {
          const active = b.dataset.lang === lang;
          b.classList.toggle('active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        try { localStorage.setItem('pragma_lang', lang); } catch {}
      }

      btns.forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

      try {
        const saved = localStorage.getItem('pragma_lang');
        if (saved === 'en') setLang('en');
      } catch {}
    })();

    // ═══════════════ IN-PAGE LINKS ═══════════════
    // Scroll suave salvo que la persona pida movimiento reducido; el foco pasa al destino.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        const behavior = reduceMotion.matches ? 'auto' : 'smooth';
        if (!href || href === '#') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior });
          return;
        }
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior, block: 'start' });
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        history.pushState(null, '', href);
      });
    });
