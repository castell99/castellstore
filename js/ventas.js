// ═══════════════════════════════════════════
//  ventas.js — CRUD Ventas + Abonos
// ═══════════════════════════════════════════

// ── Abrir modal nueva venta ───────────────
function abrirNuevaVenta() {
  editVentaId = null;
  document.getElementById('modal-venta-title').textContent = '💰 Nueva Venta';
  document.getElementById('btn-sv').textContent = 'Guardar venta';
  // Limpiar campos
  document.getElementById('v-cli').value    = '';
  document.getElementById('v-precio').value = '';
  document.getElementById('v-pago').value   = 'Efectivo';
  document.getElementById('v-cuotas').value = '0';
  document.getElementById('v-estado').value = 'Completada';
  document.getElementById('v-fin-prev').style.display = 'none';
  // Mostrar select de productos (modo nuevo)
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
  // Llenar campos con datos existentes
  document.getElementById('v-cli').value    = v.cliente   || '';
  document.getElementById('v-precio').value = v.precio    || '';
  document.getElementById('v-cuotas').value = v.cuotas    || '0';
  // Mostrar nombre del producto como texto (no cambiar producto en edición)
  document.getElementById('v-prod').style.display     = 'none';
  document.getElementById('v-prod-txt').style.display = '';
  document.getElementById('v-prod-txt').value         = v.producto || '';
  // Estado y pago
  setSelectVal('v-pago',   v.pago);
  setSelectVal('v-estado', v.estado);
  document.getElementById('v-fin-prev').style.display = 'none';
  openModal('modal-venta');
}

// ── Guardar (crear o actualizar) ──────────
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
      // ── ACTUALIZAR ──
      await sb('ventas', 'PATCH', payload, `?id=eq.${editVentaId}`);
      const idx = ventas.findIndex(x => x.id === editVentaId);
      if (idx !== -1) ventas[idx] = { ...ventas[idx], ...payload };
      toast('Venta actualizada ✓');
    } else {
      // ── CREAR ──
      const pid  = document.getElementById('v-prod').value;
      if (!pid) { toast('Selecciona un producto', 'err'); setBtn('btn-sv', false, 'Guardar venta'); return; }
      const prod = productos.find(x => x.id == pid);
      payload.producto = prod.nombre;
      payload.fecha    = today();
      const [v] = await sb('ventas', 'POST', payload);
      ventas.unshift(v);
      // Descontar stock
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
  if (!confirm('¿Eliminar esta venta? También se eliminarán sus abonos.')) return;
  try {
    await sb('ventas',  'DELETE', null, `?id=eq.${id}`);
    await sb('abonos',  'DELETE', null, `?tipo=eq.venta&ref_id=eq.${id}`);
    ventas  = ventas.filter(v => v.id !== id);
    abonos  = abonos.filter(a => !(a.tipo === 'venta' && a.ref_id === id));
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
    const ab  = abonadoPor('venta', v.id);
    const sal = saldoPendiente('venta', v.id, v.precio);
    const pct = Math.min(100, Math.round((ab / parseFloat(v.precio || 1)) * 100));
    const esF = v.cuotas > 0 || v.estado === 'Financiada';
    return `<tr>
      <td style="font-size:11px;color:var(--text3)">${v.fecha}</td>
      <td><strong>${v.cliente}</strong></td>
      <td style="color:var(--text2)">${v.producto}</td>
      <td style="font-family:var(--mono);font-weight:600">${fmt(v.precio)}</td>
      <td><span class="badge blue">${v.pago}${v.cuotas > 0 ? ' · ' + v.cuotas + 'm' : ''}</span></td>
      <td style="font-family:var(--mono);color:var(--green)">${fmt(ab)}
        ${esF ? `<div class="progress-bar" style="width:80px"><div class="progress-fill" style="width:${pct}%"></div></div>` : ''}</td>
      <td style="font-family:var(--mono);color:${sal > 0 ? 'var(--amber)' : 'var(--green)'}">${fmt(sal)}</td>
      <td><span class="badge ${v.estado === 'Completada' ? 'green' : v.estado === 'Cancelada' ? 'red' : v.estado === 'Financiada' ? 'amber' : 'muted'}">${v.estado}</span></td>
      <td style="white-space:nowrap;display:flex;gap:4px;align-items:center">
        ${esF ? `<button class="btn sm" onclick="openAbonoV(${v.id})">💳 Abono</button>` : ''}
        <button class="btn sm" onclick="editarVenta(${v.id})" title="Editar">✏️</button>
        <button class="icon-btn" onclick="delVenta(${v.id})" title="Eliminar">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

// ── Helpers ───────────────────────────────
function fillProdSel() {
  const s = document.getElementById('v-prod');
  s.innerHTML = '<option value="">Seleccionar producto...</option>';
  productos.filter(p => p.stock > 0).forEach(p => {
    s.innerHTML += `<option value="${p.id}" data-p="${p.precio}">${p.emoji || ''} ${p.nombre} — ${fmt(p.precio)}</option>`;
  });
}

function fillVPrecio() {
  const o = document.getElementById('v-prod').selectedOptions[0];
  if (o && o.dataset.p) {
    document.getElementById('v-precio').value = o.dataset.p;
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

// ── Abonos de ventas ──────────────────────
function openAbonoV(id) {
  abonoVId = id;
  const v   = ventas.find(x => x.id === id);
  const ab  = abonadoPor('venta', id);
  const sal = saldoPendiente('venta', id, v.precio);
  const pct = Math.min(100, Math.round((ab / parseFloat(v.precio || 1)) * 100));
  document.getElementById('abono-v-info').innerHTML = `
    <div class="alert info" style="flex-direction:column;align-items:flex-start;gap:6px">
      <div><strong>${v.cliente}</strong> — ${v.producto}</div>
      <div>Total: <strong>${fmt(v.precio)}</strong> · Abonado: <strong style="color:var(--green)">${fmt(ab)}</strong> · Saldo: <strong style="color:var(--amber)">${fmt(sal)}</strong></div>
      <div class="progress-bar" style="width:100%"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div style="font-size:11px;color:var(--text2)">${pct}% pagado</div>
    </div>`;
  renderAbonoLista('venta', id, 'av-lista');
  openModal('modal-abono-v');
}

async function guardarAbonoV() {
  const monto = parseFloat(document.getElementById('av-monto').value) || 0;
  const obs   = document.getElementById('av-obs').value;
  if (!monto) { toast('Ingresa un monto válido', 'err'); return; }
  const v   = ventas.find(x => x.id === abonoVId);
  const sal = saldoPendiente('venta', abonoVId, v?.precio || 0);
  if (monto > sal + 0.01) { toast(`El abono supera el saldo (${fmt(sal)})`, 'err'); return; }
  try {
    const [a] = await sb('abonos', 'POST', { tipo: 'venta', ref_id: abonoVId, monto, obs, fecha: today() });
    abonos.push(a);
    document.getElementById('av-monto').value = '';
    document.getElementById('av-obs').value   = '';
    // Si saldo llega a 0 → marcar completada
    const nuevoSal = saldoPendiente('venta', abonoVId, v?.precio || 0);
    if (nuevoSal <= 0) {
      await sb('ventas', 'PATCH', { estado: 'Completada' }, `?id=eq.${abonoVId}`);
      const vr = ventas.find(x => x.id === abonoVId);
      if (vr) vr.estado = 'Completada';
    }
    openAbonoV(abonoVId);
    renderVentas();
    renderDashboard();
    toast('Abono registrado ✓');
  } catch (e) { toast('Error: ' + e.message, 'err'); }
}

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
