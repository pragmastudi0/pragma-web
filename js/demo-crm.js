/* ════════════════════════════════════════════════════════════
   PRAGMA · Ordenar para crecer — recorrido + demo interactiva
   Sin backend: todo vive en memoria, en esta pestaña.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ───────── reveals ───────── */
  var revealEls = $$('.step, .resultado-head, .app, .dcta-inner');
  revealEls.forEach(function (el) { el.classList.add('reveal'); });
  if ('IntersectionObserver' in window) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); revObs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { revObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ───────── escenario: etapa según el paso visible ───────── */
  var stage = $('#stage');
  if (stage && 'IntersectionObserver' in window) {
    var stepObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) stage.dataset.stage = e.target.dataset.stage;
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    $$('.step').forEach(function (s) { stepObs.observe(s); });
  }

  /* ───────── toast ───────── */
  var toastT;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.innerHTML = '<span class="tdot"></span>' + msg;
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('show'); });
    clearTimeout(toastT);
    toastT = setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.hidden = true; }, 300);
    }, 3200);
  }

  /* ───────── tabs ───────── */
  var tabs = $$('.app-tab');
  function setTab(name) {
    tabs.forEach(function (b) {
      var on = b.dataset.panel === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    $$('.app-panel').forEach(function (p) {
      p.classList.toggle('active', p.dataset.panel === name);
    });
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { setTab(b.dataset.panel); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus();
      setTab(n.dataset.panel);
    });
  });

  function updateCounts() {
    ['consultas', 'presupuestos', 'proyectos'].forEach(function (name) {
      var n = $$('#panel-' + name + ' > article').length;
      var b = $('[data-count="' + name + '"]');
      if (!b) return;
      if (b.textContent !== String(n)) {
        b.textContent = n;
        var tab = b.closest('.app-tab');
        if (tab) {
          tab.classList.remove('bump');
          void tab.offsetWidth;
          tab.classList.add('bump');
        }
      }
    });
  }

  /* ───────── datos de las conversiones (ficticios) ───────── */
  var PRESU_DESDE_CONSULTA = {
    c14: {
      id: 'p32', code: 'P-032',
      titulo: 'Vivienda Serra — Villa Allende',
      meta: 'Familia Serra · a partir de la consulta C-014',
      items: [
        ['Anteproyecto', '$ 2.600.000'],
        ['Documentación de obra', '$ 3.400.000'],
        ['Dirección de obra', '$ 5.200.000']
      ],
      total: '$ 11.200.000'
    }
  };

  var PROYECTO_DESDE_PRESU = {
    p31: {
      id: 'pr8', code: 'PR-08',
      nombre: 'Dúplex en Lote 12', meta: 'Hnos. Castro · dirección: Marcos',
      anticipo: '$ 3.120.000'
    },
    p32: {
      id: 'pr9', code: 'PR-09',
      nombre: 'Vivienda Serra', meta: 'Familia Serra · dirección: Julia',
      anticipo: '$ 3.360.000'
    }
  };

  function presuCardHTML(p) {
    return '' +
      '<div class="card-row">' +
        '<span class="tag tag-warn"><span class="tag-dot"></span>Borrador · listo para revisar</span>' +
        '<span class="card-id">' + p.code + '</span>' +
      '</div>' +
      '<h4>' + p.titulo + '</h4>' +
      '<p class="card-meta">' + p.meta + '</p>' +
      '<ul class="items">' +
        p.items.map(function (it) { return '<li><span>' + it[0] + '</span><b>' + it[1] + '</b></li>'; }).join('') +
        '<li class="items-total"><span>Total</span><b>' + p.total + '</b></li>' +
      '</ul>' +
      '<div class="card-foot">' +
        '<span class="owner"><i class="av av-m">MV</i>Marcos</span>' +
        '<button class="btn-mini btn-confirm" data-act="confirmar-trabajo" data-id="' + p.id + '">Confirmar trabajo' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
        '</button>' +
      '</div>';
  }

  function proyCardHTML(pr) {
    var task = function (txt, av, nombre) {
      return '<label class="task"><input type="checkbox" data-proj="' + pr.id + '">' +
        '<span class="task-box" aria-hidden="true"></span>' +
        '<span class="task-txt">' + txt + '</span>' +
        '<span class="owner sm"><i class="av ' + av + '">' + (av === 'av-j' ? 'JP' : av === 'av-m' ? 'MV' : 'SR') + '</i>' + nombre + '</span></label>';
    };
    return '' +
      '<button class="proj-head" aria-expanded="true" data-act="toggle-proyecto">' +
        '<span class="proj-main">' +
          '<span class="card-row">' +
            '<span class="tag tag-ok"><span class="tag-dot"></span>Inicio</span>' +
            '<span class="card-id">' + pr.code + '</span>' +
          '</span>' +
          '<h4>' + pr.nombre + '</h4>' +
          '<p class="card-meta">' + pr.meta + '</p>' +
        '</span>' +
        '<span class="proj-side">' +
          '<span class="proj-prog"><b data-prog="' + pr.id + '">0/3</b> tareas</span>' +
          '<svg class="proj-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>' +
        '</span>' +
      '</button>' +
      '<div class="proj-body">' +
        '<p class="proj-next"><b>Próximo paso</b> Agendar reunión de arranque — esta semana <span class="owner"><i class="av av-j">JP</i>Julia</span></p>' +
        '<div class="proj-cols">' +
          '<div class="proj-tasks"><h5>Tareas</h5>' +
            task('Reunión de arranque con el cliente', 'av-j', 'Julia') +
            task('Relevamiento del terreno', 'av-m', 'Marcos') +
            task('Facturar anticipo (30%)', 'av-s', 'Sol') +
          '</div>' +
          '<div class="proj-pay"><h5>Cobros</h5>' +
            '<div class="pay-row"><span>Anticipo (30%)</span><b>' + pr.anticipo + '</b><em class="pay-due">A facturar</em></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ───────── acciones ───────── */
  function convertirConsulta(id) {
    var data = PRESU_DESDE_CONSULTA[id];
    var card = $('#panel-consultas [data-id="' + id + '"]');
    if (!data || !card || card.dataset.done) return;
    card.dataset.done = '1';

    card.querySelector('.card-row .tag').outerHTML =
      '<span class="tag tag-ok"><span class="tag-dot"></span>Presupuesto en curso · ' + data.code + '</span>';
    var foot = card.querySelector('.card-foot');
    foot.querySelector('.btn-mini').outerHTML =
      '<span class="next-step">Próximo paso: revisar y enviar ' + data.code + '</span>';

    var nueva = document.createElement('article');
    nueva.className = 'card flash';
    nueva.dataset.id = data.id;
    nueva.innerHTML = presuCardHTML(data);
    $('#panel-presupuestos .panel-title').insertAdjacentElement('afterend', nueva);

    updateCounts();
    setTab('presupuestos');
    toast('La consulta ' + id.toUpperCase().replace('C', 'C-0') + ' ya es el presupuesto ' + data.code + '.');
  }

  function confirmarTrabajo(id) {
    var data = PROYECTO_DESDE_PRESU[id];
    var card = $('#panel-presupuestos [data-id="' + id + '"]');
    if (!data || !card || card.dataset.done) return;
    card.dataset.done = '1';

    card.querySelector('.card-row .tag').outerHTML =
      '<span class="tag tag-ok"><span class="tag-dot"></span>Confirmado · ahora es ' + data.code + '</span>';
    var btn = card.querySelector('.btn-mini');
    if (btn) btn.outerHTML = '<span class="next-step">Próximo paso: seguir el proyecto en ' + data.code + '</span>';

    $$('#panel-proyectos .proj.open .proj-head').forEach(function (h) {
      h.closest('.proj').classList.remove('open');
      h.setAttribute('aria-expanded', 'false');
    });
    var nuevo = document.createElement('article');
    nuevo.className = 'proj open flash';
    nuevo.dataset.id = data.id;
    nuevo.innerHTML = proyCardHTML(data);
    $('#panel-proyectos .panel-title').insertAdjacentElement('afterend', nuevo);

    updateCounts();
    setTab('proyectos');
    toast('Trabajo confirmado: se creó el proyecto ' + data.code + ' con sus tareas.');
  }

  function toggleProyecto(head) {
    var proj = head.closest('.proj');
    var open = proj.classList.toggle('open');
    head.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function updateProgress(projId) {
    var boxes = $$('input[data-proj="' + projId + '"]');
    var done = boxes.filter(function (b) { return b.checked; }).length;
    var el = $('[data-prog="' + projId + '"]');
    if (el) el.textContent = done + '/' + boxes.length;
    if (done === boxes.length && boxes.length) toast('Todas las tareas del proyecto están al día. Así da gusto.');
  }

  /* ───────── eventos (delegados) ───────── */
  var app = $('#app');
  if (app) {
    app.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]');
      if (!el) return;
      var act = el.dataset.act;
      if (act === 'convertir-presupuesto') convertirConsulta(el.dataset.id);
      else if (act === 'confirmar-trabajo') confirmarTrabajo(el.dataset.id);
      else if (act === 'toggle-proyecto') toggleProyecto(el);
    });
    app.addEventListener('change', function (e) {
      if (e.target.matches('input[data-proj]')) updateProgress(e.target.dataset.proj);
    });
    updateCounts();
  }
})();
