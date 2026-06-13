// ═══════════════════════════════════════════
//  caja.js — Control de Caja (ingresos/egresos)
// ═══════════════════════════════════════════

let cajaMovs = [];
let cajaChartInstance = null;

async function loadCaja() {
  try {
    const data = await sb('caja_movimientos', 'GET', null, '?order=id.desc');
    cajaMovs = Array.isArray(data) ? data : [];
  } catch (e) {
    cajaMovs = [];
  }
  renderCaja();
}

function abrirNuevoMovCaja() {
  document.getElementById('cm-tipo').value     = 'ingreso';
  document.getElementById('cm-concepto').value = '';
  document.getElementById('cm-monto').value    = '';
  openModal('modal-caja');
}

async function guardarMovCaja() {
  const tipo     = document.getElementById('cm-tipo').value;
  const concepto = document.getElementById('cm-concepto').value.trim();
  const monto    = parseFloat(document.getElementById('cm-monto').value) || 0;

  if (!concepto || !monto) { toast('Completa concepto y monto', 'err'); return; }

  setBtn('btn-cm', true, 'Guardar movimiento');
  try {
    const payload = {
      tipo, concepto, monto,
      origen: 'manual',
      ref_id: null,
      fecha: today(),
    };
    const [m] = await sb('caja_movimientos', 'POST', payload);
    cajaMovs.unshift(m || { ...payload, id: Date.now() });
    toast('Movimiento registrado ✓');
    closeModal('modal-caja');
    renderCaja();
  } catch (e) {
    toast('Error: ' + e.message, 'err');
  }
  setBtn('btn-cm', false, 'Guardar movimiento');
}

async function delMovCaja(id) {
  if (!confirm('¿Eliminar este movimiento?')) return;
  try { await sb('caja_movimientos', 'DELETE', null, `?id=eq.${id}`); } catch (_) {}
  cajaMovs = cajaMovs.filter(m => m.id !== id);
  renderCaja();
  toast('Movimiento eliminado');
}

// ── Registrar movimiento automático (llamado desde ventas/tecnicos) ──
async function registrarMovCajaAuto(tipo, concepto, monto, origen, ref_id) {
  if (!monto) return;
  try {
    const payload = { tipo, concepto, monto, origen, ref_id, fecha: today() };
    const [m] = await sb('caja_movimientos', 'POST', payload);
    cajaMovs.unshift(m || { ...payload, id: Date.now() });
  } catch (e) {
    console.warn('caja auto:', e.message);
  }
}

const ORIGEN_LABEL = { manual: '✏️ Manual', venta: '🛒 Venta', tecnico: '🔧 Servicio' };

// ── Helpers de fecha (formato dd/mm/aaaa) ──
function parseFechaCaja(fechaStr) {
  // Soporta "dd/mm/aaaa" y "aaaa-mm-dd"
  if (!fechaStr) return null;
  if (fechaStr.includes('/')) {
    const [d, m, y] = fechaStr.split('/');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }
  return new Date(fechaStr + 'T00:00:00');
}

function ymKey(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

function renderCaja() {
  const filtroMes = document.getElementById('caja-mes')?.value || '';

  // Movimientos filtrados por mes (para tabla y stats)
  let movsFiltrados = cajaMovs;
  if (filtroMes) {
    movsFiltrados = cajaMovs.filter(m => {
      const d = parseFechaCaja(m.fecha);
      return d && ymKey(d) === filtroMes;
    });
  }

  const ingresos = movsFiltrados.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + parseFloat(m.monto || 0), 0);
  const egresos  = movsFiltrados.filter(m => m.tipo === 'egreso').reduce((s, m) => s + parseFloat(m.monto || 0), 0);
  const saldo    = ingresos - egresos;

  const el = id => document.getElementById(id);
  if (el('caja-saldo'))    el('caja-saldo').textContent    = fmt(saldo);
  if (el('caja-ingresos')) el('caja-ingresos').textContent = fmt(ingresos);
  if (el('caja-egresos'))  el('caja-egresos').textContent  = fmt(egresos);
  if (el('caja-total'))    el('caja-total').textContent    = movsFiltrados.length;

  // Ganancia neta de ventas (filtrada por mes si aplica)
  let ventasFiltradas = (typeof ventas !== 'undefined') ? ventas : [];
  if (filtroMes) {
    ventasFiltradas = ventasFiltradas.filter(v => {
      const d = parseFechaCaja(v.fecha);
      return d && ymKey(d) === filtroMes;
    });
  }
  const gananciaTotal = ventasFiltradas.reduce((s, v) => s + (parseFloat(v.ganancia) || 0), 0);
  if (el('caja-ganancia')) el('caja-ganancia').textContent = fmt(gananciaTotal);

  // Capital invertido en equipos (ventas)
  const capitalVentas = ventasFiltradas.reduce((s, v) => s + (parseFloat(v.costo_proveedor) || 0), 0);
  if (el('caja-capital-ventas')) el('caja-capital-ventas').textContent = fmt(capitalVentas);

  // Capital invertido en repuestos (servicios técnicos)
  let tecnicosFiltrados = (typeof tecnicos !== 'undefined') ? tecnicos : [];
  if (filtroMes) {
    tecnicosFiltrados = tecnicosFiltrados.filter(t => {
      const d = parseFechaCaja(t.fecha);
      return d && ymKey(d) === filtroMes;
    });
  }
  const capitalServicios = tecnicosFiltrados.reduce((s, t) => s + (parseFloat(t.costo_repuestos) || 0), 0);
  if (el('caja-capital-servicios')) el('caja-capital-servicios').textContent = fmt(capitalServicios);
  
  const tb = document.getElementById('tb-caja');
  if (tb) {
    if (!movsFiltrados.length) {
      tb.innerHTML = '<tr class="empty-row"><td colspan="6">No hay movimientos en este período</td></tr>';
    } else {
      tb.innerHTML = movsFiltrados.map(m => `
        <tr>
          <td style="font-size:11px;color:var(--text3)">${m.fecha}</td>
          <td>
            <span class="badge ${m.tipo === 'ingreso' ? 'green' : 'red'}">
              ${m.tipo === 'ingreso' ? '⬆️ Ingreso' : '⬇️ Egreso'}
            </span>
          </td>
          <td>${m.concepto}</td>
          <td><span class="badge muted">${ORIGEN_LABEL[m.origen] || m.origen}</span></td>
          <td style="font-family:var(--mono);font-weight:600;color:${m.tipo === 'ingreso' ? 'var(--green)' : 'var(--red)'}">
            ${m.tipo === 'ingreso' ? '+' : '-'}${fmt(m.monto)}
          </td>
          <td>
            <button class="icon-btn" onclick="delMovCaja(${m.id})">🗑</button>
          </td>
        </tr>`).join('');
    }
  }

  renderCajaChart();
}

// ── Gráfico de últimos 6 meses ──
function renderCajaChart() {
  const canvas = document.getElementById('caja-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  // Generar últimos 6 meses (incluyendo el actual)
  const meses = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    meses.push({ key: ymKey(d), label: d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }) });
  }

  const ingresosPorMes = meses.map(m =>
    cajaMovs.filter(mov => {
      const d = parseFechaCaja(mov.fecha);
      return mov.tipo === 'ingreso' && d && ymKey(d) === m.key;
    }).reduce((s, mov) => s + parseFloat(mov.monto || 0), 0)
  );

  const egresosPorMes = meses.map(m =>
    cajaMovs.filter(mov => {
      const d = parseFechaCaja(mov.fecha);
      return mov.tipo === 'egreso' && d && ymKey(d) === m.key;
    }).reduce((s, mov) => s + parseFloat(mov.monto || 0), 0)
  );

  if (cajaChartInstance) {
    cajaChartInstance.destroy();
  }

  cajaChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: meses.map(m => m.label),
      datasets: [
        {
          label: 'Ingresos',
          data: ingresosPorMes,
          backgroundColor: 'rgba(57, 255, 20, 0.6)',
          borderColor: 'rgba(57, 255, 20, 1)',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: 'Egresos',
          data: egresosPorMes,
          backgroundColor: 'rgba(255, 90, 90, 0.6)',
          borderColor: 'rgba(255, 90, 90, 1)',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#cccccc' } },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ctx.dataset.label + ': ' + fmt(ctx.parsed.y);
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: '#999999' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: {
          ticks: {
            color: '#999999',
            callback: function(value) { return fmt(value); }
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}
// ── Recalcular ganancias de ventas existentes ──
async function recalcularGanancias() {
  if (!confirm('Esto recalculará la ganancia de todas las ventas según el equipo asociado. ¿Continuar?')) return;

  if (!equiposFin.length) await loadEquiposFin();

  let actualizadas = 0;
  let sinEquipo = 0;

  for (const v of ventas) {
    const eq = equiposFin.find(e => `${e.marca} ${e.modelo}` === v.producto);
    if (!eq) { sinEquipo++; continue; }

    const costoProveedor = parseFloat(eq.precio_proveedor) || 0;
    const ganancia       = parseFloat(v.precio) - costoProveedor;

    try {
      await sb('ventas', 'PATCH', { costo_proveedor: costoProveedor, ganancia: ganancia }, `?id=eq.${v.id}`);
      v.costo_proveedor = costoProveedor;
      v.ganancia        = ganancia;
      actualizadas++;
    } catch (e) { console.warn('Error venta', v.id, e.message); }
  }

  toast(`${actualizadas} venta(s) actualizadas${sinEquipo ? ' · ' + sinEquipo + ' sin equipo asociado' : ''} ✓`);
  renderCaja();
}

// ── Desglose por tarjeta ──
function abrirDesglose(tipo) {
  const filtroMes = document.getElementById('caja-mes')?.value || '';
  let movs = cajaMovs;
  let vts  = (typeof ventas !== 'undefined') ? ventas : [];
  let tecs = (typeof tecnicos !== 'undefined') ? tecnicos : [];

  if (filtroMes) {
    movs = movs.filter(m => { const d = parseFechaCaja(m.fecha); return d && ymKey(d) === filtroMes; });
    vts  = vts.filter(v => { const d = parseFechaCaja(v.fecha); return d && ymKey(d) === filtroMes; });
    tecs = tecs.filter(t => { const d = parseFechaCaja(t.fecha); return d && ymKey(d) === filtroMes; });
  }

  let titulo = '';
  let rows   = '';

  if (tipo === 'saldo' || tipo === 'ingresos' || tipo === 'egresos') {
    const filtro = tipo === 'ingresos' ? 'ingreso' : tipo === 'egresos' ? 'egreso' : null;
    const lista  = filtro ? movs.filter(m => m.tipo === filtro) : movs;
    titulo = tipo === 'ingresos' ? '⬆️ Detalle de Ingresos' : tipo === 'egresos' ? '⬇️ Detalle de Egresos' : '💰 Detalle del Saldo';

    rows = lista.map(m => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600">${m.concepto}</div>
          <div style="font-size:11px;color:var(--text3)">${m.fecha} · ${ORIGEN_LABEL[m.origen] || m.origen}</div>
        </div>
        <div style="font-family:var(--mono);font-weight:700;color:${m.tipo === 'ingreso' ? 'var(--green)' : 'var(--red)'}">
          ${m.tipo === 'ingreso' ? '+' : '-'}${fmt(m.monto)}
        </div>
      </div>`).join('');

  } else if (tipo === 'ganancia') {
    titulo = '📈 Detalle de Ganancia Neta';
    const lista = vts.filter(v => parseFloat(v.ganancia) > 0 || parseFloat(v.ganancia) < 0);
    rows = lista.map(v => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600">${v.cliente} — ${v.producto}</div>
          <div style="font-size:11px;color:var(--text3)">${v.fecha} · Venta: ${fmt(v.precio)} − Costo: ${fmt(v.costo_proveedor)}</div>
        </div>
        <div style="font-family:var(--mono);font-weight:700;color:var(--green)">${fmt(v.ganancia)}</div>
      </div>`).join('');

  } else if (tipo === 'capital-ventas') {
    titulo = '📱 Capital Invertido en Equipos';
    rows = vts.filter(v => parseFloat(v.costo_proveedor) > 0).map(v => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600">${v.cliente} — ${v.producto}</div>
          <div style="font-size:11px;color:var(--text3)">${v.fecha}</div>
        </div>
        <div style="font-family:var(--mono);font-weight:700;color:var(--blue)">${fmt(v.costo_proveedor)}</div>
      </div>`).join('');

  } else if (tipo === 'capital-servicios') {
    titulo = '🔧 Capital Invertido en Repuestos';
    rows = tecs.filter(t => parseFloat(t.costo_repuestos) > 0).map(t => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:13px;font-weight:600">${t.cliente} — ${t.equipo}</div>
          <div style="font-size:11px;color:var(--text3)">${t.fecha}</div>
        </div>
        <div style="font-family:var(--mono);font-weight:700;color:var(--amber)">${fmt(t.costo_repuestos)}</div>
      </div>`).join('');
  }

  if (!rows) rows = '<p style="color:var(--text3);font-size:13px;text-align:center;padding:20px 0">No hay registros para mostrar.</p>';

  document.getElementById('desglose-title').textContent = titulo;
  document.getElementById('desglose-body').innerHTML = rows;
  openModal('modal-desglose');
}
