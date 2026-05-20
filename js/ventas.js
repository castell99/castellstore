// ═══════════════════════════════════════════
//  ventas.js — CRUD Ventas + Financiamiento
//  flexible (cuotas fijas o abonos libres)
// ═══════════════════════════════════════════

let cuotas = [];

// ── Cargar cuotas ─────────────────────────
async function loadCuotas() {
  try {
    const data = await sb('cuotas', 'GET', null, '?order=venta_id.asc,numero.asc');
    cuotas = Array.isArray(data) ? data : [];
  } catch (e) { cuotas = []; }
}

// ── Abrir modal nueva venta ───────────────
function abrirNuevaVenta() {
  editVentaId = null;
  document.getElementById('modal-venta-title').textContent = '💰 Nueva Venta';
  document.getElementById('btn-sv').textContent = 'Guardar venta';
  document.getElementById('v-cli').value    = '';
  document.getElementById('v-precio').value = '';
  document.getElementById('v-pago').value   = 'Efectivo';
  document.getElementById('v-cuotas').value = '0';
  document.getElementById('v-estado').value = 'Completada';
  document.getElementById('v-fin-prev').style.display = 'none';
  document.getElementById('v-prod').style.display     = '';
  document.getElementById('v-prod-txt').style.display = 'none';
  fillProdSel();
  openModal('modal-venta');
}

// ── Abrir modal editar venta ──────────────
function editarVenta(id) {
  const v = ventas.find(x => x.id === id);
  if (!v) return;
  editVentaId = id;
  document.getElementById('modal-venta-title').textContent = '✏️ Editar Venta';
  document.getElementById('btn-sv').textContent = 'Actualizar venta';
  document.getElementById('v-cli').value    = v.cliente || '';
  document.getElementById('v-precio').value = v.precio  || '';
  document.getElementById('v-cuotas').value = v.cuotas  || '0';
  document.getElementById('v-prod').style.display     = 'none';
  document.getElementById('v-prod-txt').style.display = '';
  document.getElementById('v-prod-txt').value         = v.producto || '';
  setSelectVal('v-pago',   v.pago);
  setSelectVal('v-estado', v.estado);
  document.getElementById('v-fin-prev').style.display = 'none';
  openModal('modal-venta');
}

// ── Guardar venta ─────────────────────────
async function guardarVenta() {
  const cli    = document.getElementById('v-cli').value.trim();
  const precio = parseFloat(document.getElementById('v-precio').value) || 0;
  if (!cli || !precio) { toast('Completa los campos requeridos', 'err'); return; }

  const payload = {
    cliente : cli,
    precio,
    pago    : document.getElementById('v-pago').value,
    cuotas  : parseInt(document.getElementById('v-cuotas').value) || 0,
    estado  : document.getElementById('v-estado').value,
  };

  setBtn('btn-sv', true, 'Guardar venta');
  try {
    if (editVentaId) {
      await sb('ventas', 'PATCH', payload, `?id=eq.${editVentaId}`);
      const idx = ventas.findIndex(x => x.id === editVentaId);
      if (idx !== -1) ventas[idx] = { ...ventas[idx], ...payload };
      toast('Venta actualizada ✓');
    } else {
      const pid = document.getElementById('v-prod').value;
      if (!pid) { toast('Selecciona un producto', 'err'); setBtn('btn-sv', false, 'Guardar venta'); return; }
      const eq = equiposFin.find(x => x.id == pid);
      payload.producto = `${eq.marca} ${eq.modelo}`;
      payload.fecha    = today();
      const [v] = await sb('ventas', 'POST', payload);
      ventas.unshift(v);
      if (prod.stock > 0) {
        await sb('productos', 'PATCH', { stock: prod.stock - 1 }, `?id=eq.${prod.id}`);
        prod.stock--;
      }
    }
    closeModal('modal-venta');
    renderVentas();
    renderDashboard();
    renderInventario();
  } catch (e) { toast('Error: ' + e.message, 'err'); }
  setBtn('btn-sv', false, 'Guardar venta');
}

// ── Eliminar venta ────────────────────────
async function delVenta(id) {
  if (!confirm('¿Eliminar esta venta? También se eliminarán abonos y cuotas.')) return;
  try {
    await sb('ventas', 'DELETE', null, `?id=eq.${id}`);
    await sb('abonos', 'DELETE', null, `?tipo=eq.venta&ref_id=eq.${id}`);
    await sb('cuotas', 'DELETE', null, `?venta_id=eq.${id}`);
    ventas = ventas.filter(v => v.id !== id);
    abonos = abonos.filter(a => !(a.tipo === 'venta' && a.ref_id === id));
    cuotas = cuotas.filter(c => c.venta_id !== id);
    renderVentas();
    renderDashboard();
    toast('Venta eliminada');
  } catch (e) { toast('Error', 'err'); }
}

// ── Render tabla ventas ───────────────────
function renderVentas() {
  const tb = document.getElementById('tb-ventas');
  if (!ventas.length) {
    tb.innerHTML = '<tr class="empty-row"><td colspan="9">No hay ventas registradas</td></tr>';
    return;
  }
  tb.innerHTML = ventas.map(v => {
    const ab   = abonadoPor('venta', v.id);
    const sal  = saldoPendiente('venta', v.id, v.precio);
    const pct  = Math.min(100, Math.round((ab / parseFloat(v.precio || 1)) * 100));
    const esF  = v.estado === 'Financiada' || v.cuotas > 0;
    const venc = cuotas.filter(c => c.venta_id === v.id && c.estado === 'Vencida').length;
    return `<tr>
      <td style="font-size:11px;color:var(--text3)">${v.fecha}</td>
      <td><strong>${v.cliente}</strong></td>
      <td style="color:var(--text2)">${v.producto}</td>
      <td style="font-family:var(--mono);font-weight:600">${fmt(v.precio)}</td>
      <td><span class="badge blue">${v.pago}${v.cuotas > 0 ? ' · ' + v.cuotas + 'm' : ''}</span></td>
      <td style="font-family:var(--mono);color:var(--green)">${fmt(ab)}
        ${esF ? `<div class="progress-bar" style="width:80px"><div class="progress-fill" style="width:${pct}%"></div></div>` : ''}</td>
      <td style="font-family:var(--mono);color:${sal > 0 ? 'var(--amber)' : 'var(--green)'}">${fmt(sal)}
        ${venc > 0 ? `<span class="badge red" style="margin-left:4px">${venc} venc.</span>` : ''}</td>
      <td><span class="badge ${v.estado === 'Completada' ? 'green' : v.estado === 'Cancelada' ? 'red' : v.estado === 'Financiada' ? 'amber' : 'muted'}">${v.estado}</span></td>
      <td style="white-space:nowrap;display:flex;gap:4px;align-items:center;flex-wrap:wrap">
        <button class="btn sm" onclick="openFinanciamiento(${v.id})"
          style="${esF ? 'background:var(--amber-bg);border-color:var(--amber);color:var(--amber)' : ''}">
          ${esF ? '📋 Cuotas' : '💳 Financiar'}
        </button>
        ${v.estado === 'Completada'
          ? `<button class="btn sm" onclick="generarRecibo('venta',${v.id})"
              style="background:var(--green-bg);border-color:var(--green-bd);color:var(--green)">
              📄 Paz y Salvo
            </button>`
          : ''}
        <button class="btn sm" onclick="editarVenta(${v.id})">✏️</button>
        <button class="icon-btn" onclick="delVenta(${v.id})">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════
//  MÓDULO FINANCIAMIENTO POR VENTA
// ═══════════════════════════════════════════

let finVentaId = null;

function openFinanciamiento(id) {
  finVentaId = id;
  const v = ventas.find(x => x.id === id);
  if (!v) return;
  renderModalFin(v);
  openModal('modal-financiamiento');
}

function renderModalFin(v) {
  const ab        = abonadoPor('venta', v.id);
  const sal       = saldoPendiente('venta', v.id, v.precio);
  const pct       = Math.min(100, Math.round((ab / parseFloat(v.precio || 1)) * 100));
  const misCuotas = cuotas.filter(c => c.venta_id === v.id).sort((a, b) => a.numero - b.numero);
  const misAbonos = abonos.filter(a => a.tipo === 'venta' && a.ref_id === v.id).sort((a, b) => b.id - a.id);
  const tieneplan = misCuotas.length > 0;

  document.getElementById('fin-modal-title').textContent = `💳 Financiamiento — ${v.cliente}`;

  // Resumen
  document.getElementById('fin-resumen').innerHTML = `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div>
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">Producto</div>
          <div style="font-weight:600">${v.producto}</div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">Precio total</div>
          <div style="font-weight:700;font-family:var(--mono)">${fmt(v.precio)}</div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">Abonado</div>
          <div style="font-weight:700;font-family:var(--mono);color:var(--green)">${fmt(ab)}</div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">Saldo</div>
          <div style="font-weight:700;font-family:var(--mono);color:${sal > 0 ? 'var(--amber)' : 'var(--green)'}">${fmt(sal)}</div>
        </div>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div style="font-size:11px;color:var(--text2);margin-top:4px">${pct}% pagado</div>
    </div>`;

  // Tabs
  document.getElementById('fin-tabs').innerHTML = `
    <div style="display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:16px">
      <button class="fin-tab active" id="tab-abono" onclick="showFinTab('abono')">💵 Abono libre</button>
      <button class="fin-tab" id="tab-plan" onclick="showFinTab('plan')">
        ${tieneplan ? '📋 Ver plan de cuotas' : '🗓 Crear plan de cuotas'}
      </button>
    </div>`;

  // ── Tab: Abono libre ──
  let abonoHtml = sal <= 0
    ? `<div class="alert success">✓ Esta venta está completamente pagada.</div>`
    : `<div class="form-row" style="margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label>Monto del abono (COP $)</label>
          <input type="number" id="fin-av-monto" placeholder="0">
        </div>
        <div class="form-group" style="margin:0">
          <label>Observación</label>
          <input id="fin-av-obs" placeholder="Ej: Cuota 1, pago parcial...">
        </div>
      </div>
      <button class="btn primary" onclick="registrarAbonoLibre()" style="width:100%;justify-content:center">
        + Registrar abono
      </button>`;

  if (misAbonos.length) {
    abonoHtml += `
      <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:12px">
        <div style="font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px">
          Historial de abonos
        </div>
        ${misAbonos.map(a => `
          <div class="abono-item">
            <div>
              <strong style="font-family:var(--mono);color:var(--green)">${fmt(a.monto)}</strong>
              ${a.obs ? `<span style="color:var(--text3)"> · ${a.obs}</span>` : ''}
            </div>
            <div class="abono-fecha">${a.fecha}</div>
          </div>`).join('')}
      </div>`;
  }

  document.getElementById('fin-tab-abono').innerHTML = abonoHtml;

  // ── Tab: Plan de cuotas ──
  let planHtml = '';
  if (tieneplan) {
    planHtml = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:13px;font-weight:600">Plan de ${misCuotas.length} cuotas</div>
        <button class="btn danger" onclick="eliminarPlan()">🗑 Eliminar plan</button>
      </div>
      ${misCuotas.map(c => {
        const colorMap = { Pagada: 'green', Vencida: 'red', Pendiente: 'amber' };
        const iconMap  = { Pagada: '✅', Vencida: '🔴', Pendiente: '🟡' };
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg3);border-radius:var(--radius-sm);margin-bottom:6px;border:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:18px">${iconMap[c.estado] || '🟡'}</span>
              <div>
                <div style="font-size:12px;font-weight:600">Cuota ${c.numero}</div>
                <div style="font-size:11px;color:var(--text3)">Vence: ${c.fecha_venc}</div>
                ${c.fecha_pago ? `<div style="font-size:11px;color:var(--green)">Pagada: ${c.fecha_pago}</div>` : ''}
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-family:var(--mono);font-weight:600">${fmt(c.monto)}</div>
              <span class="badge ${colorMap[c.estado] || 'amber'}" style="margin-top:4px">${c.estado}</span>
              ${c.estado !== 'Pagada'
                ? `<div style="margin-top:6px">
                    <button class="btn sm" onclick="marcarCuotaPagada(${c.id})" style="font-size:11px">
                      ✓ Marcar pagada
                    </button>
                   </div>`
                : ''}
            </div>
          </div>`;
      }).join('')}`;
  } else {
    planHtml = `
      <div class="alert info" style="margin-bottom:16px">
        📅 Crea un plan de cuotas fijas con fechas de vencimiento. Cada cuota pagada se registra automáticamente como abono.
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Número de cuotas</label>
          <select id="fin-ncuotas" onchange="previewPlan()">
            <option value="2">2 cuotas</option>
            <option value="3" selected>3 cuotas</option>
            <option value="4">4 cuotas</option>
            <option value="5">5 cuotas</option>
            <option value="6">6 cuotas</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tasa mensual (%)</label>
          <input type="number" id="fin-tasa-plan" value="3.5" step="0.1" oninput="previewPlan()">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Cuota inicial (COP $)</label>
          <input type="number" id="fin-ini-plan" placeholder="0" oninput="previewPlan()">
        </div>
        <div class="form-group">
          <label>Fecha primer vencimiento</label>
          <input type="date" id="fin-fecha-plan" value="${nextMonth()}" oninput="previewPlan()">
        </div>
      </div>
      <div id="fin-plan-preview"></div>
      <button class="btn primary" onclick="crearPlan()" style="width:100%;justify-content:center;margin-top:12px">
        📋 Crear plan de cuotas
      </button>`;
  }

  document.getElementById('fin-tab-plan').innerHTML = planHtml;
  showFinTab('abono');
  if (!tieneplan) setTimeout(previewPlan, 100);
}

function showFinTab(tab) {
  document.querySelectorAll('.fin-tab').forEach(t => t.classList.remove('active'));
  const tabEl = document.getElementById('tab-' + tab);
  if (tabEl) tabEl.classList.add('active');
  document.getElementById('fin-tab-abono').style.display = tab === 'abono' ? 'block' : 'none';
  document.getElementById('fin-tab-plan').style.display  = tab === 'plan'  ? 'block' : 'none';
}

// ── Abono libre ───────────────────────────
async function registrarAbonoLibre() {
  const monto = parseFloat(document.getElementById('fin-av-monto')?.value) || 0;
  const obs   = document.getElementById('fin-av-obs')?.value || '';
  if (!monto) { toast('Ingresa un monto válido', 'err'); return; }
  const v   = ventas.find(x => x.id === finVentaId);
  const sal = saldoPendiente('venta', finVentaId, v?.precio || 0);
  if (monto > sal + 0.01) { toast(`El abono supera el saldo (${fmt(sal)})`, 'err'); return; }
  try {
    const [a] = await sb('abonos', 'POST', {
      tipo: 'venta', ref_id: finVentaId, monto, obs, fecha: today()
    });
    abonos.push(a);
    // Marcar como Financiada si no tenía estado especial
    if (v && v.estado !== 'Financiada' && v.estado !== 'Completada') {
      await sb('ventas', 'PATCH', { estado: 'Financiada' }, `?id=eq.${finVentaId}`);
      v.estado = 'Financiada';
    }
    // Si saldo llega a 0 → completada
    const nuevoSal = saldoPendiente('venta', finVentaId, v?.precio || 0);
    if (nuevoSal <= 0) {
      await sb('ventas', 'PATCH', { estado: 'Completada' }, `?id=eq.${finVentaId}`);
      if (v) v.estado = 'Completada';
      toast('¡Venta completamente pagada! ✓');
    } else {
      toast('Abono registrado ✓');
    }
    renderModalFin(ventas.find(x => x.id === finVentaId));
    renderVentas();
    renderDashboard();
  } catch (e) { toast('Error: ' + e.message, 'err'); }
}

// ── Preview plan ──────────────────────────
function previewPlan() {
  const v     = ventas.find(x => x.id === finVentaId);
  if (!v) return;
  const nc    = parseInt(document.getElementById('fin-ncuotas')?.value) || 3;
  const tasa  = parseFloat(document.getElementById('fin-tasa-plan')?.value) || 3.5;
  const ini   = parseFloat(document.getElementById('fin-ini-plan')?.value) || 0;
  const fecha = document.getElementById('fin-fecha-plan')?.value || nextMonth();
  const base  = parseFloat(v.precio) - ini;
  const cuota = calcCuota(base, tasa, nc);
  const total = cuota * nc + ini;
  const el    = document.getElementById('fin-plan-preview');
  if (!el) return;

  let rows = '';
  for (let i = 0; i < nc; i++) {
    rows += `<tr>
      <td>Cuota ${i + 1}</td>
      <td style="font-family:var(--mono);color:var(--green);font-weight:600">${fmt(Math.round(cuota))}</td>
      <td style="font-size:12px;color:var(--text2)">${addMonths(fecha, i)}</td>
    </tr>`;
  }

  el.innerHTML = `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-top:12px">
      <div style="padding:10px 14px;background:var(--green-bg);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <span style="font-size:12px;color:var(--text2)">Cuota/mes: <strong style="color:var(--green);font-family:var(--mono)">${fmt(Math.round(cuota))}</strong></span>
        <span style="font-size:12px;color:var(--text2)">Total: <strong style="font-family:var(--mono)">${fmt(Math.round(total))}</strong></span>
        ${ini > 0 ? `<span style="font-size:12px;color:var(--text2)">Inicial: <strong>${fmt(ini)}</strong></span>` : ''}
      </div>
      <table style="min-width:unset">
        <thead><tr><th>Cuota</th><th>Monto</th><th>Vencimiento</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── Crear plan ────────────────────────────
async function crearPlan() {
  const v     = ventas.find(x => x.id === finVentaId);
  if (!v) return;
  const nc    = parseInt(document.getElementById('fin-ncuotas')?.value) || 3;
  const tasa  = parseFloat(document.getElementById('fin-tasa-plan')?.value) || 3.5;
  const ini   = parseFloat(document.getElementById('fin-ini-plan')?.value) || 0;
  const fecha = document.getElementById('fin-fecha-plan')?.value || nextMonth();
  const base  = parseFloat(v.precio) - ini;
  const cuota = calcCuota(base, tasa, nc);
  try {
    // Marcar venta como Financiada
    await sb('ventas', 'PATCH', { estado: 'Financiada', cuotas: nc }, `?id=eq.${finVentaId}`);
    v.estado = 'Financiada';
    v.cuotas = nc;
    // Cuota inicial como abono
    if (ini > 0) {
      const [a] = await sb('abonos', 'POST', {
        tipo: 'venta', ref_id: finVentaId, monto: ini, obs: 'Cuota inicial', fecha: today()
      });
      abonos.push(a);
    }
    // Crear cuotas programadas
    for (let i = 0; i < nc; i++) {
      const [c] = await sb('cuotas', 'POST', {
        venta_id  : finVentaId,
        numero    : i + 1,
        monto     : Math.round(cuota),
        fecha_venc: addMonths(fecha, i),
        estado    : 'Pendiente'
      });
      cuotas.push(c);
    }
    renderModalFin(ventas.find(x => x.id === finVentaId));
    renderVentas();
    renderDashboard();
    toast(`Plan de ${nc} cuotas creado ✓`);
  } catch (e) { toast('Error: ' + e.message, 'err'); }
}

// ── Marcar cuota pagada ───────────────────
async function marcarCuotaPagada(cuotaId) {
  const c = cuotas.find(x => x.id === cuotaId);
  if (!c) return;
  try {
    await sb('cuotas', 'PATCH', { estado: 'Pagada', fecha_pago: today() }, `?id=eq.${cuotaId}`);
    c.estado = 'Pagada';
    c.fecha_pago = today();
    // Registrar abono automático
    const [a] = await sb('abonos', 'POST', {
      tipo: 'venta', ref_id: finVentaId,
      monto: c.monto, obs: `Cuota ${c.numero} pagada`, fecha: today()
    });
    abonos.push(a);
    // Verificar si todas pagadas
    const pendientes = cuotas.filter(x => x.venta_id === finVentaId && x.estado !== 'Pagada');
    if (pendientes.length === 0) {
      await sb('ventas', 'PATCH', { estado: 'Completada' }, `?id=eq.${finVentaId}`);
      const v = ventas.find(x => x.id === finVentaId);
      if (v) v.estado = 'Completada';
      toast('¡Venta completamente pagada! 🎉');
    } else {
      toast('Cuota marcada como pagada ✓');
    }
    renderModalFin(ventas.find(x => x.id === finVentaId));
    renderVentas();
    renderDashboard();
  } catch (e) { toast('Error: ' + e.message, 'err'); }
}

// ── Eliminar plan ─────────────────────────
async function eliminarPlan() {
  if (!confirm('¿Eliminar el plan de cuotas? Los abonos registrados se mantienen.')) return;
  try {
    await sb('cuotas', 'DELETE', null, `?venta_id=eq.${finVentaId}`);
    cuotas = cuotas.filter(c => c.venta_id !== finVentaId);
    const v = ventas.find(x => x.id === finVentaId);
    if (v) {
      v.cuotas = 0;
      await sb('ventas', 'PATCH', { cuotas: 0 }, `?id=eq.${finVentaId}`);
    }
    renderModalFin(ventas.find(x => x.id === finVentaId));
    renderVentas();
    toast('Plan eliminado');
  } catch (e) { toast('Error', 'err'); }
}

// ── Helpers fecha ─────────────────────────
function nextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

// ── Helpers modal venta ───────────────────
function fillProdSel() {
  const s = document.getElementById('v-prod');
  s.innerHTML = '<option value="">Seleccionar equipo...</option>';
  equiposFin
    .filter(e => e.disponible !== false)
    .forEach(e => {
      s.innerHTML += `<option value="${e.id}" data-p="${e.precio_contado}">${e.marca} ${e.modelo} — ${fmt(e.precio_contado)}</option>`;
    });
}

function fillVPrecio() {
  const o = document.getElementById('v-prod').selectedOptions[0];
  if (o && o.dataset.p) {
    document.getElementById('v-precio').value = o.dataset.p;
    const eq = equiposFin.find(e => e.id == document.getElementById('v-prod').value);
    if (eq) {
      const payload_prod = `${eq.marca} ${eq.modelo}`;
      document.getElementById('v-prod').dataset.nombre = payload_prod;
    }
    previewFinV();
  }
}

function previewFinV() {
  const c  = parseInt(document.getElementById('v-cuotas').value) || 0;
  const p  = parseFloat(document.getElementById('v-precio').value) || 0;
  const el = document.getElementById('v-fin-prev');
  if (c > 0 && p > 0) {
    const cuota = calcCuota(p, 3.5, c);
    el.style.display = 'block';
    el.innerHTML = `<div class="alert info">🧮 <strong>${c} meses</strong> · Cuota: <strong>${fmt(Math.round(cuota))}/mes</strong> · Total: <strong>${fmt(Math.round(cuota * c))}</strong></div>`;
  } else {
    el.style.display = 'none';
  }
}

// ── Abonos técnicos (reutilizado) ─────────
function renderAbonoLista(tipo, id, elId) {
  const list = abonos.filter(a => a.tipo === tipo && a.ref_id === id).sort((a, b) => b.id - a.id);
  const el   = document.getElementById(elId);
  if (!list.length) {
    el.innerHTML = '<p style="color:var(--text3);font-size:12px;margin-top:8px">No hay abonos registrados aún.</p>';
    return;
  }
  el.innerHTML = `
    <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px">
      <div style="font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">Historial de abonos</div>
      ${list.map(a => `
        <div class="abono-item">
          <div><strong style="font-family:var(--mono);color:var(--green)">${fmt(a.monto)}</strong>
          ${a.obs ? ` <span style="color:var(--text3)">· ${a.obs}</span>` : ''}</div>
          <div class="abono-fecha">${a.fecha}</div>
        </div>`).join('')}
    </div>`;
}
