    // Mobile nav (el estado "scrolled" de la barra y el cierre con Escape viven en js/motion.js)
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    toggle.setAttribute('aria-controls', 'navLinks');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));

    // Reveal
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    // Grid Lens
    (function gridLens() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (window.matchMedia('(max-width: 900px)').matches) return;
      if (window.matchMedia('(pointer: coarse)').matches) return;
      const lens = document.getElementById('gridLens');
      const core = document.getElementById('gridLensCore');
      let tx = window.innerWidth/2, ty = window.innerHeight/2;
      let cx = tx, cy = ty;
      const root = document.documentElement.style;
      let idleTimer;
      document.addEventListener('mousemove', (e) => {
        tx = e.clientX; ty = e.clientY;
        lens.classList.add('active'); core.classList.add('active');
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { lens.classList.remove('active'); core.classList.remove('active'); }, 3000);
      });
      function loop() {
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        root.setProperty('--mx', cx + 'px');
        root.setProperty('--my', cy + 'px');
        root.setProperty('--gx', ((cx / window.innerWidth - 0.5) * -18) + 'px');
        root.setProperty('--gy', ((cy / window.innerHeight - 0.5) * -18) + 'px');
        requestAnimationFrame(loop);
      }
      loop();
    })();

    // Language toggle
    (function langToggle() {
      document.querySelectorAll('[data-i18n-en]').forEach(el => { el.dataset.i18nEs = el.textContent; });
      document.querySelectorAll('[data-i18n-en-href]').forEach(el => { el.dataset.i18nEsHref = el.getAttribute('href') || ''; });
      document.querySelectorAll('[data-i18n-en-placeholder]').forEach(el => { el.dataset.i18nEsPlaceholder = el.getAttribute('placeholder') || ''; });
      document.querySelectorAll('[data-i18n-en-aria-label]').forEach(el => { el.dataset.i18nEsAriaLabel = el.getAttribute('aria-label') || ''; });

      function setLang(lang) {
        document.documentElement.setAttribute('lang', lang);
        document.querySelectorAll('[data-i18n-en]').forEach(el => {
          const en = el.getAttribute('data-i18n-en');
          const es = el.dataset.i18nEs;
          el.textContent = (lang === 'en') ? en : es;
        });
        document.querySelectorAll('[data-i18n-en-href]').forEach(el => {
          const en = el.getAttribute('data-i18n-en-href');
          const es = el.dataset.i18nEsHref;
          el.setAttribute('href', (lang === 'en') ? en : es);
        });
        document.querySelectorAll('[data-i18n-en-placeholder]').forEach(el => {
          const en = el.getAttribute('data-i18n-en-placeholder');
          const es = el.dataset.i18nEsPlaceholder;
          el.setAttribute('placeholder', (lang === 'en') ? en : es);
        });
        document.querySelectorAll('[data-i18n-en-aria-label]').forEach(el => {
          const en = el.getAttribute('data-i18n-en-aria-label');
          const es = el.dataset.i18nEsAriaLabel;
          el.setAttribute('aria-label', (lang === 'en') ? en : es);
        });
        document.querySelectorAll('.lang-toggle button').forEach(b => {
          b.classList.toggle('active', b.dataset.lang === lang);
        });
        try { localStorage.setItem('pragma_lang', lang); } catch (e) {}
      }

      const btns = document.querySelectorAll('.lang-toggle button');
      btns.forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

      try {
        // 'pragma_lang' es la clave que usa la home; 'pragma-lang' era la de estas páginas
        const saved = localStorage.getItem('pragma_lang') || localStorage.getItem('pragma-lang');
        if (saved === 'en') setLang('en');
      } catch (e) {}
    })();
