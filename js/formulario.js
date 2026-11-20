    // WhatsApp de destino (Miguel — Pragma Studio).
    // Formato internacional sin + ni espacios: 54 (país) + 9 (celular) + 351 (Córdoba) + número.
    const WHATSAPP_NUMERO = '5493516017576';

    const LS_KEY = 'pragma-consulta-v1';
    const form = document.getElementById('form');
    const pfill = document.getElementById('pfill');
    const pcount = document.getElementById('pcount');
    const ptotal = document.getElementById('ptotal');
    const modal = document.getElementById('modal');
    const resumen = document.getElementById('resumen');
    const toast = document.getElementById('toast');
    const btnWa = document.getElementById('btn-wa');
    const btnCopy = document.getElementById('btn-copy');
    const btnDownload = document.getElementById('btn-download');

    const LABELS = {
      negocio_nombre: 'Negocio',
      negocio_rubro: 'Rubro',
      negocio_ubicacion: 'Ubicación',
      sucursales_actuales: 'Sucursales actuales',
      cajeros_total: 'Personas en caja',
      mas_sucursales: '¿Más sucursales próximo año?',
      cant_productos: 'Cantidad de productos',
      sistema_actual: 'Sistema actual',
      pain: 'Qué le falta o molesta',
      facturacion: 'Facturación electrónica',
      barcode: 'Lector de código de barras',
      promos: 'Manejo de promociones',
      ctacte: 'Cuenta corriente con clientes',
      ecommerce: 'Necesita tienda online',
      'pagos[]': 'Medios de pago online',
      envios: 'Entrega de pedidos',
      volumen_web: 'Volumen web estimado',
      dominio_logo: 'Dominio / logo',
      presupuesto: 'Rango de inversión',
      mensual: 'Abono mensual',
      timing: 'Timing',
      comentarios: 'Comentarios',
    };

    // Recolectar respuestas actuales
    function recolectar() {
      const data = new FormData(form);
      const out = {};
      for (const key of Object.keys(LABELS)) {
        if (key.endsWith('[]')) {
          const all = data.getAll(key);
          if (all.length) out[key] = all;
        } else {
          const v = (data.get(key) || '').toString().trim();
          if (v) out[key] = v;
        }
      }
      return out;
    }

    // Contar campos completos vs totales
    function actualizarProgreso() {
      const data = recolectar();
      const totales = Object.keys(LABELS).length;
      const completos = Object.keys(data).length;
      pcount.textContent = completos;
      ptotal.textContent = totales;
      pfill.style.width = ((completos / totales) * 100).toFixed(1) + '%';
      guardarLocal();
    }

    // Auto-guardar en localStorage
    function guardarLocal() {
      try {
        const raw = new FormData(form);
        const obj = {};
        for (const [k, v] of raw.entries()) {
          if (k.endsWith('[]')) {
            if (!obj[k]) obj[k] = [];
            obj[k].push(v);
          } else {
            obj[k] = v;
          }
        }
        localStorage.setItem(LS_KEY, JSON.stringify(obj));
      } catch (e) { /* localStorage lleno o disabled */ }
    }

    // Restaurar de localStorage al cargar
    function restaurar() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        const obj = JSON.parse(raw);
        for (const [k, v] of Object.entries(obj)) {
          if (Array.isArray(v)) {
            v.forEach(val => {
              const el = form.querySelector(`input[name="${k}"][value="${val}"]`);
              if (el) el.checked = true;
            });
          } else {
            const els = form.querySelectorAll(`[name="${k}"]`);
            for (const el of els) {
              if (el.type === 'radio' || el.type === 'checkbox') {
                if (el.value === v) el.checked = true;
              } else {
                el.value = v;
              }
            }
          }
        }
      } catch (e) { /* ignore */ }
    }

    // Armar texto plano para copiar / WhatsApp
    function armarResumen(data) {
      const secciones = [
        ['NEGOCIO', ['negocio_nombre', 'negocio_rubro', 'negocio_ubicacion', 'sucursales_actuales', 'cajeros_total', 'mas_sucursales', 'cant_productos']],
        ['OPERATORIA ACTUAL', ['sistema_actual', 'pain', 'facturacion', 'barcode', 'promos', 'ctacte']],
        ['ECOMMERCE', ['ecommerce', 'pagos[]', 'envios', 'volumen_web', 'dominio_logo']],
        ['ALCANCE E INVERSIÓN', ['presupuesto', 'mensual', 'timing']],
        ['COMENTARIOS', ['comentarios']],
      ];
      let out = '📋 CONSULTA DE SISTEMA — Pragma Studio\n';
      out += '─────────────────────────────────\n\n';
      for (const [titulo, campos] of secciones) {
        const lineas = [];
        for (const campo of campos) {
          const val = data[campo];
          if (!val) continue;
          const label = LABELS[campo];
          if (Array.isArray(val)) {
            lineas.push(`• ${label}:\n   - ${val.join('\n   - ')}`);
          } else {
            lineas.push(`• ${label}: ${val}`);
          }
        }
        if (lineas.length) {
          out += `▶ ${titulo}\n${lineas.join('\n')}\n\n`;
        }
      }
      return out.trim();
    }

    function mostrarToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }

    // Enviar → abrir modal
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = recolectar();
      const texto = armarResumen(data);
      resumen.textContent = texto;
      // WhatsApp
      const encoded = encodeURIComponent(texto);
      btnWa.href = `https://wa.me/${WHATSAPP_NUMERO}?text=${encoded}`;
      modal.classList.add('open');
    });

    // Copiar al portapapeles
    btnCopy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(resumen.textContent);
        mostrarToast('✓ Copiado al portapapeles');
      } catch (err) {
        // Fallback antiguo
        const t = document.createElement('textarea');
        t.value = resumen.textContent;
        document.body.appendChild(t);
        t.select();
        try { document.execCommand('copy'); mostrarToast('✓ Copiado'); }
        catch (e) { mostrarToast('No pudimos copiar — seleccioná el texto manualmente'); }
        document.body.removeChild(t);
      }
    });

    // Descargar como .txt
    btnDownload.addEventListener('click', () => {
      const blob = new Blob([resumen.textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fecha = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `consulta-pragma-${fecha}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      mostrarToast('✓ Descargado');
    });

    // Cerrar modal clickeando afuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });

    // Autoguardado en cada cambio
    form.addEventListener('input', actualizarProgreso);
    form.addEventListener('change', actualizarProgreso);

    // Inicialización
    restaurar();
    actualizarProgreso();
