  const TOTAL = 6;
  let current = 1;

  function updateProgress() {
    const pct = ((current - 1) / TOTAL) * 100;
    document.getElementById('progressBar').style.width = pct + '%';
    document.getElementById('progressText').textContent = current <= TOTAL
      ? `Sección ${current} de ${TOTAL}`
      : 'Resumen final';
  }

  function showSection(n) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelector('.summary').classList.remove('active');
    if (n <= TOTAL) {
      document.getElementById('sec' + n).classList.add('active');
      document.getElementById('navBar').style.display = 'flex';
    } else {
      buildSummary();
      document.getElementById('summary').classList.add('active');
      document.getElementById('navBar').style.display = 'none';
    }
    document.getElementById('btnPrev').disabled = n <= 1;
    document.getElementById('btnNext').textContent = n >= TOTAL ? 'Ver resumen →' : 'Siguiente →';
    window.scrollTo(0, 0);
    updateProgress();
  }

  function nextSection() {
    if (current <= TOTAL) { current++; showSection(current); }
  }
  function prevSection() {
    if (current > 1) { current--; showSection(current); }
  }

  function toggleChip(el) {
    el.classList.toggle('selected');
  }

  // Mark selected radio options
  document.querySelectorAll('.option-item input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', function() {
      const name = this.name;
      document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
        r.closest('.option-item').classList.remove('selected');
      });
      this.closest('.option-item').classList.add('selected');
    });
  });

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
  function getRadio(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.closest('.option-item').querySelector('label').textContent.trim() : '';
  }
  function getChips(id) {
    const chips = document.querySelectorAll(`#${id} .chip.selected`);
    return Array.from(chips).map(c => c.textContent.trim()).join(', ') || '';
  }

  function buildSummary() {
    const sections = [
      {
        title: '1. General',
        items: [
          { q: 'Total de personas en la empresa', a: getVal('q1_1') },
          { q: 'Personas que acceden al sistema', a: getVal('q1_2') },
          { q: 'Dispositivos', a: getChips('chips_dispositivos') },
          { q: 'Responsable interno', a: getVal('q1_4') },
          { q: 'Fecha estimada', a: getVal('q1_5') },
        ]
      },
      {
        title: '2. Obras y trabajos',
        items: [
          { q: 'Inicio de obra', a: getRadio('inicio_obra') },
          { q: 'Obras simultáneas', a: getVal('q2_2') },
          { q: 'Quién carga avance', a: getRadio('carga_avance') },
          { q: 'Fotos por obra', a: getVal('q2_4') },
          { q: 'Planos', a: getRadio('plano') },
          { q: 'Estados de obra', a: getChips('chips_estados') },
          { q: 'Materiales por obra', a: getRadio('materiales') },
          { q: 'Incidencias', a: getVal('q2_8') },
        ]
      },
      {
        title: '3. Clientes y documentación',
        items: [
          { q: 'Clientes principales', a: getChips('chips_clientes') + (getVal('q3_1_otros') ? ', ' + getVal('q3_1_otros') : '') },
          { q: 'Documentos por cliente', a: getChips('chips_docs') },
          { q: 'Permisos de Claro', a: getVal('q3_3') },
          { q: 'Compartir docs con clientes', a: getRadio('compartir_docs') },
          { q: 'Estructura de documentación', a: getRadio('docs_estructura') },
        ]
      },
      {
        title: '4. Contabilidad',
        items: [
          { q: 'Contador externo', a: getRadio('contador') },
          { q: 'Caja chica', a: getRadio('caja_chica') },
          { q: 'Registro de gastos', a: getChips('chips_gastos') },
          { q: 'Rentabilidad por obra', a: getRadio('rentabilidad') },
          { q: 'Facturación AFIP', a: getRadio('afip') },
          { q: 'Cuenta corriente', a: getVal('q4_6') },
        ]
      },
      {
        title: '5. Roles y usuarios',
        items: [
          { q: 'Acceso de Maca', a: getRadio('maca_acceso') },
          { q: 'Ricardo ve finanzas', a: getRadio('ricardo_finanzas') },
          { q: 'Nico acceso móvil', a: getRadio('nico_cel') },
          { q: 'Permisos por persona', a: getVal('q5_4') },
          { q: 'Historial de acciones', a: getRadio('historial') },
        ]
      },
      {
        title: '6. Prioridades',
        items: [
          { q: 'Prioridad número 1', a: getRadio('prioridad1') },
          { q: 'Qué mantener del Excel', a: getVal('q6_2') },
          { q: 'Mayor dolor actual', a: getVal('q6_3') },

          { q: 'Comentarios adicionales', a: getVal('q6_5') },
        ]
      }
    ];

    let html = '';
    sections.forEach(sec => {
      const items = sec.items.filter(i => i.a);
      if (items.length === 0) return;
      html += `<div class="summary-card">
        <div class="summary-section-title">${sec.title}</div>`;
      items.forEach(item => {
        html += `<div class="summary-item">
          <div class="summary-q">${item.q}</div>
          <div class="summary-a">${item.a || '<span class="summary-empty">Sin respuesta</span>'}</div>
        </div>`;
      });
      html += '</div>';
    });

    document.getElementById('summaryContent').innerHTML = html;
  }

  function copyResults() {
    const sections = [
      { title: 'GENERAL', items: [
        ['Total personas empresa', getVal('q1_1')],
        ['Personas con acceso al sistema', getVal('q1_2')],
        ['Dispositivos', getChips('chips_dispositivos')],
        ['Responsable interno', getVal('q1_4')],
        ['Fecha estimada', getVal('q1_5')],
      ]},
      { title: 'OBRAS Y TRABAJOS', items: [
        ['Inicio de obra', getRadio('inicio_obra')],
        ['Obras simultáneas', getVal('q2_2')],
        ['Quién carga avance', getRadio('carga_avance')],
        ['Fotos por obra', getVal('q2_4')],
        ['Planos', getRadio('plano')],
        ['Estados de obra', getChips('chips_estados')],
        ['Materiales por obra', getRadio('materiales')],
        ['Incidencias', getVal('q2_8')],
      ]},
      { title: 'CLIENTES Y DOCUMENTACIÓN', items: [
        ['Clientes', getChips('chips_clientes') + (getVal('q3_1_otros') ? ', ' + getVal('q3_1_otros') : '')],
        ['Documentos', getChips('chips_docs')],
        ['Permisos Claro', getVal('q3_3')],
        ['Compartir docs', getRadio('compartir_docs')],
        ['Estructura docs', getRadio('docs_estructura')],
      ]},
      { title: 'CONTABILIDAD', items: [
        ['Contador externo', getRadio('contador')],
        ['Caja chica', getRadio('caja_chica')],
        ['Registro gastos', getChips('chips_gastos')],
        ['Rentabilidad por obra', getRadio('rentabilidad')],
        ['AFIP', getRadio('afip')],
        ['Cuenta corriente', getVal('q4_6')],
      ]},
      { title: 'ROLES Y USUARIOS', items: [
        ['Acceso Maca', getRadio('maca_acceso')],
        ['Ricardo ve finanzas', getRadio('ricardo_finanzas')],
        ['Nico acceso móvil', getRadio('nico_cel')],
        ['Permisos por persona', getVal('q5_4')],
        ['Historial acciones', getRadio('historial')],
      ]},
      { title: 'PRIORIDADES', items: [
        ['Prioridad 1', getRadio('prioridad1')],
        ['Mantener del Excel', getVal('q6_2')],
        ['Mayor dolor', getVal('q6_3')],

        ['Comentarios', getVal('q6_5')],
      ]},
    ];

    let text = 'RELEVAMIENTO — PRAGMA STUDIO\n';
    text += '================================\n\n';
    sections.forEach(sec => {
      const items = sec.items.filter(i => i[1]);
      if (!items.length) return;
      text += `--- ${sec.title} ---\n`;
      items.forEach(([q, a]) => { if (a) text += `${q}: ${a}\n`; });
      text += '\n';
    });

    navigator.clipboard.writeText(text).then(() => {
      const el = document.getElementById('copyConfirm');
      el.style.display = 'block';
      setTimeout(() => el.style.display = 'none', 3000);
    });
  }

  updateProgress();
