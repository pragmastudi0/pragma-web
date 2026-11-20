    // ═══════════════ PAGE LOADER — hide after window.load, con min-show para ver la animación ═══════════════
    (function pageLoader() {
      const loader = document.getElementById('pageLoader');
      if (!loader) return;
      const start = performance.now();
      const MIN_SHOW = 1750; // ms — un poco más que la animación
      const HARD_MAX = 6000;
      let done = false;
      function hide() {
        if (done) return; done = true;
        const wait = Math.max(0, MIN_SHOW - (performance.now() - start));
        setTimeout(() => {
          loader.classList.add('done');
          document.body.classList.remove('loading');
        }, wait);
      }
      if (document.readyState === 'complete') hide();
      else window.addEventListener('load', hide);
      setTimeout(hide, HARD_MAX); // safety
    })();

    // ═══════════════ NAV SCROLL ═══════════════
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    });

    // ═══════════════ MOBILE NAV ═══════════════
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });

    // ═══════════════ SCROLL REVEAL (multi-variant, nolo-style) ═══════════════
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur, .reveal-mask');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.revealDelay || '0', 10);
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });

    reveals.forEach(el => observer.observe(el));


    // ═══════════════ REVEAL FALLBACK (siempre visible después de 2s) ═══════════════
    setTimeout(() => {
      document.querySelectorAll('.reveal:not(.visible), .reveal-left:not(.visible), .reveal-right:not(.visible), .reveal-scale:not(.visible), .reveal-blur:not(.visible), .reveal-mask:not(.visible)').forEach(el => el.classList.add('visible'));
    }, 2500);


    // ═══════════════ 3D TILT ON HOVER (mouse position) ═══════════════
    (function tiltCards() {
      if (window.matchMedia('(pointer: coarse)').matches) return;
      const cards = document.querySelectorAll('.service-card, .benefit-item, .web-card, .team-card');
      cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px)`;
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      });
    })();



    // ═══════════════ GRID LENS (mouse-follow) ═══════════════
    (function gridLens() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (window.matchMedia('(max-width: 900px)').matches) return;
      if (window.matchMedia('(pointer: coarse)').matches) return;
      const lens = document.getElementById('gridLens');
      const core = document.getElementById('gridLensCore');
      if (!lens || !core) return;

      let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
      let cx = tx, cy = ty;
      let active = false;
      const root = document.documentElement.style;

      document.addEventListener('mousemove', (e) => {
        tx = e.clientX; ty = e.clientY;
        if (!active) {
          lens.classList.add('active');
          core.classList.add('active');
          active = true;
        }
      });
      document.addEventListener('mouseleave', () => {
        lens.classList.remove('active');
        core.classList.remove('active');
        active = false;
      });

      function loop() {
        // Lerp muy suave para que la lente "arrastre" con delay orgánico
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        root.setProperty('--mx', cx + 'px');
        root.setProperty('--my', cy + 'px');
        // Deforma la grilla desplazando el background-position según el mouse
        // — crea el efecto de que la grilla "acompaña" al cursor
        root.setProperty('--gx', ((cx / window.innerWidth - 0.5) * -18) + 'px');
        root.setProperty('--gy', ((cy / window.innerHeight - 0.5) * -18) + 'px');
        requestAnimationFrame(loop);
      }
      loop();
    })();

    // ═══════════════ SCROLL PROGRESS BAR ═══════════════
    (function scrollProgress() {
      const bar = document.createElement('div');
      bar.className = 'scroll-progress';
      document.body.appendChild(bar);
      let ticking = false;
      function update() {
        const h = document.documentElement;
        const scrolled = h.scrollTop;
        const total = h.scrollHeight - h.clientHeight;
        const pct = total > 0 ? (scrolled / total) * 100 : 0;
        bar.style.width = pct + '%';
        ticking = false;
      }
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      }, { passive: true });
      update();
    })();

    // ═══════════════ PARALLAX LAYERS ═══════════════
    (function parallax() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // Desactivar parallax en mobile — los icons de industrias se mueven feo
      const mobileMQ = window.matchMedia('(max-width: 768px)');
      const layers = document.querySelectorAll('[data-parallax]');
      if (!layers.length) return;
      let ticking = false;
      function update() {
        if (mobileMQ.matches) {
          layers.forEach(el => el.style.setProperty('--parallax-y', '0px'));
          ticking = false;
          return;
        }
        layers.forEach(el => {
          const speed = parseFloat(el.dataset.parallax) || 0.15;
          const rect = el.getBoundingClientRect();
          const center = rect.top + rect.height / 2 - window.innerHeight / 2;
          el.style.setProperty('--parallax-y', (-center * speed) + 'px');
        });
        ticking = false;
      }
      window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
      mobileMQ.addEventListener('change', update);
      update();
    })();

    // ═══════════════ HERO SCROLL FADE + PARALLAX ═══════════════
    (function heroScroll() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const copy = document.querySelector('.hero-copy');
      if (!copy) return;
      let ticking = false;
      function update() {
        const y = window.scrollY;
        const vh = window.innerHeight;
        const p = Math.min(y / (vh * 0.7), 1);
        copy.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
        copy.style.opacity = String(1 - p);
        ticking = false;
      }
      window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
      update();
    })();

    // ═══════════════ IN-VIEW ANIMATIONS (scroll-fade, cap-num, servicio-num) ═══════════════
    (function inViewObserver() {
      const targets = document.querySelectorAll('.scroll-fade, .servicio-num');
      if (!targets.length) return;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          } else if (entry.target.classList.contains('scroll-fade-repeat')) {
            entry.target.classList.remove('in-view');
          }
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -60px 0px' });
      targets.forEach(el => obs.observe(el));
      // Fallback
      setTimeout(() => targets.forEach(el => el.classList.add('in-view')), 3000);
    })();

    // ═══════════════ MARQUEE DIRECTION FLIP ON SCROLL ═══════════════
    (function marqueeDirection() {
      const track = document.querySelector('.hero-marquee-track');
      if (!track) return;
      let lastY = window.scrollY;
      let dir = 'normal';
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        const newDir = y > lastY ? 'normal' : 'reverse';
        if (newDir !== dir) {
          dir = newDir;
          track.style.animationDirection = dir;
        }
        lastY = y;
      }, { passive: true });
    })();

    // ═══════════════ WORD-BY-WORD REVEAL ═══════════════
    (function wordReveal() {
      const targets = document.querySelectorAll('[data-word-reveal]');
      targets.forEach(el => {
        const html = el.innerHTML;
        // Split by spaces, preserve inline HTML tags roughly by using text nodes only
        const words = el.textContent.trim().split(/\s+/);
        el.innerHTML = words
          .map(w => `<span class="split-word-wrap"><span class="split-word">${w}</span></span>`)
          .join(' ');
      });

      const spans = document.querySelectorAll('.split-word');
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const wrap = entry.target.parentElement.parentElement;
            const siblings = wrap.querySelectorAll('.split-word');
            siblings.forEach((s, i) => {
              setTimeout(() => s.classList.add('visible'), i * 45);
            });
            siblings.forEach(s => obs.unobserve(s));
          }
        });
      }, { threshold: 0.3 });
      spans.forEach(s => obs.observe(s));

      // Fallback
      setTimeout(() => document.querySelectorAll('.split-word:not(.visible)').forEach(s => s.classList.add('visible')), 3000);
    })();

    // ═══════════════ ES/EN LANG TOGGLE ═══════════════
    (function langToggle() {
      const btns = document.querySelectorAll('.lang-toggle button');
      if (!btns.length) return;

      // Snapshot original ES values on load
      document.querySelectorAll('[data-i18n-en]').forEach(el => {
        el.dataset.i18nEs = el.textContent;
      });
      document.querySelectorAll('[data-i18n-en-href]').forEach(el => {
        el.dataset.i18nEsHref = el.getAttribute('href') || '';
      });
      document.querySelectorAll('[data-i18n-en-placeholder]').forEach(el => {
        el.dataset.i18nEsPlaceholder = el.getAttribute('placeholder') || '';
      });
      document.querySelectorAll('[data-i18n-en-aria-label]').forEach(el => {
        el.dataset.i18nEsAriaLabel = el.getAttribute('aria-label') || '';
      });

      function setLang(lang) {
        document.documentElement.lang = lang;
        const enMode = lang === 'en';

        document.querySelectorAll('[data-i18n-en]').forEach(el => {
          const en = el.getAttribute('data-i18n-en');
          const es = el.dataset.i18nEs;
          el.textContent = enMode ? en : es;
        });
        document.querySelectorAll('[data-i18n-en-href]').forEach(el => {
          const en = el.getAttribute('data-i18n-en-href');
          const es = el.dataset.i18nEsHref;
          el.setAttribute('href', enMode ? en : es);
        });
        document.querySelectorAll('[data-i18n-en-placeholder]').forEach(el => {
          const en = el.getAttribute('data-i18n-en-placeholder');
          const es = el.dataset.i18nEsPlaceholder;
          el.setAttribute('placeholder', enMode ? en : es);
        });
        document.querySelectorAll('[data-i18n-en-aria-label]').forEach(el => {
          const en = el.getAttribute('data-i18n-en-aria-label');
          const es = el.dataset.i18nEsAriaLabel;
          el.setAttribute('aria-label', enMode ? en : es);
        });

        btns.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
        try { localStorage.setItem('pragma_lang', lang); } catch {}
      }

      btns.forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

      try {
        const saved = localStorage.getItem('pragma_lang');
        if (saved === 'en') setLang('en');
      } catch {}
    })();

    // ═══════════════ SMOOTH SCROLL ═══════════════
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
