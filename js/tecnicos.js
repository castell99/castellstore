// ═══════════════════════════════════════════
//  tecnicos.js — CRUD Servicios Técnicos + Abonos .
// ═══════════════════════════════════════════

// ── Abrir modal nuevo servicio ────────────
function abrirNuevoTecnico() {
  editTecId = null;
  document.getElementById('modal-tec-title').textContent = '🔧 Nuevo Servicio Técnico';
  document.getElementById('btn-st').textContent = 'Guardar servicio';
  document.getElementById('t-cli').value       = '';
  document.getElementById('t-equipo').value    = '';
  document.getElementById('t-diag').value      = '';
  document.getElementById('t-costo').value     = '';
  ddocument.getElementById('t-repuestos').value = '';
  document.getElementById('t-obs').value       = '';
  document.getElementById('t-estado').value    = 'Recibido';
  // Limpiar fotos
  window._tecFotos = { entrada: null, salida: null };
  ['entrada','salida'].forEach(tipo => {
    const prev = document.getElementById(`tec-prev-${tipo}`);
    if (prev) { prev.src = ''; prev.style.display = 'none'; }
  });
  openModal('modal-tecnico');
}

// ── Abrir modal editar servicio ───────────
function editarTecnico(id) {
  const t = tecnicos.find(x => x.id === id);
  if (!t) return;
  editTecId = id;
  document.getElementById('modal-tec-title').textContent = '✏️ Editar Servicio Técnico';
  document.getElementById('btn-st').textContent = 'Actualizar servicio';
  document.getElementById('t-cli').value       = t.cliente     || '';
  document.getElementById('t-equipo').value    = t.equipo      || '';
  document.getElementById('t-diag').value      = t.diagnostico || '';
  document.getElementById('t-costo').value     = t.costo       || '';
  document.getElementById('t-repuestos').value = t.costo_repuestos || '';
  document.getElementById('t-obs').value       = t.obs         || '';
  setSelectVal('t-estado', t.estado);
  openModal('modal-tecnico');
}

// ── Guardar (crear o actualizar) ──────────
async function guardarTecnico() {
  const cli = document.getElementById('t-cli').value.trim();
  const eq  = document.getElementById('t-equipo').value.trim();
  if (!cli || !eq) { toast('Completa los campos requeridos', 'err'); return; }

  const payload = {
    cliente         : cli,
    equipo          : eq,
    diagnostico     : document.getElementById('t-diag').value,
    costo           : parseFloat(document.getElementById('t-costo').value) || 0,
    costo_repuestos : parseFloat(document.getElementById('t-repuestos').value) || 0,
    estado          : document.getElementById('t-estado').value,
    obs             : document.getElementById('t-obs').value,
  };

  setBtn('btn-st', true, 'Guardar servicio');
  try {
    if (editTecId) {
      // ── ACTUALIZAR ──
      await sb('tecnicos', 'PATCH', payload, `?id=eq.${editTecId}`);
      const idx = tecnicos.findIndex(x => x.id === editTecId);
      if (idx !== -1) tecnicos[idx] = { ...tecnicos[idx], ...payload };
      toast('Servicio actualizado ✓');
    } else {
      // ── CREAR ──
      payload.fecha = today();
      const [t] = await sb('tecnicos', 'POST', payload);
      tecnicos.unshift(t);

      // Subir fotos si las hay
      if (t?.id) await guardarFotosServicio(t.id);

      // Egreso automático por repuestos
      if (payload.costo_repuestos > 0) {
        await registrarMovCajaAuto('egreso', `Repuestos: ${payload.equipo} — ${cli}`, payload.costo_repuestos, 'tecnico', t.id);
      }

      toast('Servicio registrado ✓');
    }
    closeModal('modal-tecnico');
    renderTecnicos();
    renderDashboard();
  } catch (e) { toast('Error: ' + e.message, 'err'); }
  setBtn('btn-st', false, 'Guardar servicio');
}

// ── Actualizar solo el estado (desde select en tabla) ──
async function updateTecEst(id, val) {
  try {
    await sb('tecnicos', 'PATCH', { estado: val }, `?id=eq.${id}`);
    const t = tecnicos.find(x => x.id === id);
    if (t) t.estado = val;
    renderDashboard();
    toast('Estado actualizado', 'inf');
  } catch (e) { toast('Error', 'err'); }
}

// ── Eliminar servicio ─────────────────────
async function delTec(id) {
  if (!confirm('¿Eliminar este servicio? También se eliminarán sus abonos.')) return;
  try {
    await sb('tecnicos', 'DELETE', null, `?id=eq.${id}`);
    await sb('abonos',   'DELETE', null, `?tipo=eq.tecnico&ref_id=eq.${id}`);
    tecnicos = tecnicos.filter(t => t.id !== id);
    abonos   = abonos.filter(a => !(a.tipo === 'tecnico' && a.ref_id === id));
    renderTecnicos();
    renderDashboard();
    toast('Servicio eliminado');
  } catch (e) { toast('Error', 'err'); }
}

// ── Render tabla técnicos ─────────────────
function renderTecnicos() {
  const tb = document.getElementById('tb-tecnicos');
  if (!tecnicos.length) {
    tb.innerHTML = '<tr class="empty-row"><td colspan="9">No hay servicios técnicos registrados</td></tr>';
    return;
  }
  tb.innerHTML = tecnicos.map(t => {
    const ab  = abonadoPor('tecnico', t.id);
    const sal = saldoPendiente('tecnico', t.id, t.costo);
    const pct = parseFloat(t.costo || 0) > 0
      ? Math.min(100, Math.round((ab / parseFloat(t.costo)) * 100))
      : 0;
    return `<tr>
      <td style="font-size:11px;color:var(--text3)">${t.fecha}</td>
      <td><strong>${t.cliente}</strong></td>
      <td>${t.equipo}</td>
      <td style="color:var(--text2);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.diagnostico || '—'}</td>
      <td style="font-family:var(--mono)">${fmt(t.costo)}
              ${parseFloat(t.costo_repuestos||0) > 0 ? `<div style="font-size:10px;color:var(--text3)">Repuestos: ${fmt(t.costo_repuestos)}</div><div style="font-size:11px;color:var(--green);font-weight:600">Ganancia: ${fmt(t.costo - t.costo_repuestos)}</div>` : ''}</td>
      <td style="font-family:var(--mono);color:var(--green)">${fmt(ab)}
        ${parseFloat(t.costo || 0) > 0 ? `<div class="progress-bar" style="width:70px"><div class="progress-fill" style="width:${pct}%"></div></div>` : ''}</td>
      <td style="font-family:var(--mono);color:${sal > 0 ? 'var(--amber)' : 'var(--green)'}">${fmt(sal)}</td>
      <td>
        <select class="status-sel" onchange="updateTecEst(${t.id}, this.value)">
          ${['Recibido','En diagnóstico','En reparación','Listo para entrega','Entregado']
            .map(s => `<option${s === t.estado ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td style="white-space:nowrap;display:flex;gap:4px;align-items:center;flex-wrap:wrap">
        ${parseFloat(t.costo || 0) > 0 ? `<button class="btn sm" onclick="openAbonoT(${t.id})">💳 Abono</button>` : ''}
        ${t.estado === 'Entregado'
          ? `<button class="btn sm" onclick="generarRecibo('tecnico',${t.id})"
              style="background:var(--green-bg);border-color:var(--green-bd);color:var(--green)">
              📄 Paz y Salvo
            </button>`
          : ''}
        <button class="btn sm" onclick="abrirGaleriaServicio(${t.id})" title="Fotos">📸</button>
        <button class="btn sm" onclick="editarTecnico(${t.id})" title="Editar">✏️</button>
        <button class="icon-btn" onclick="delTec(${t.id})" title="Eliminar">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

// ── Abonos de técnicos ────────────────────
function openAbonoT(id) {
  abonoTId  = id;
  const t   = tecnicos.find(x => x.id === id);
  const ab  = abonadoPor('tecnico', id);
  const sal = saldoPendiente('tecnico', id, t.costo);
  const pct = parseFloat(t.costo || 0) > 0
    ? Math.min(100, Math.round((ab / parseFloat(t.costo)) * 100))
    : 0;
  document.getElementById('abono-t-info').innerHTML = `
    <div class="alert info" style="flex-direction:column;align-items:flex-start;gap:6px">
      <div><strong>${t.cliente}</strong> — ${t.equipo}</div>
      <div>Costo: <strong>${fmt(t.costo)}</strong> · Abonado: <strong style="color:var(--green)">${fmt(ab)}</strong> · Saldo: <strong style="color:var(--amber)">${fmt(sal)}</strong></div>
      <div class="progress-bar" style="width:100%"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div style="font-size:11px;color:var(--text2)">${pct}% pagado</div>
    </div>`;
  renderAbonoLista('tecnico', id, 'at-lista');
  openModal('modal-abono-t');
}

async function guardarAbonoT() {
  const monto = parseFloat(document.getElementById('at-monto').value) || 0;
  const obs   = document.getElementById('at-obs').value;
  if (!monto) { toast('Ingresa un monto válido', 'err'); return; }
  const t   = tecnicos.find(x => x.id === abonoTId);
  const sal = saldoPendiente('tecnico', abonoTId, t?.costo || 0);
  if (monto > sal + 0.01) { toast(`Abono supera el saldo (${fmt(sal)})`, 'err'); return; }
  try {
    const [a] = await sb('abonos', 'POST', { tipo: 'tecnico', ref_id: abonoTId, monto, obs, fecha: today() });
    abonos.push(a);
    await registrarMovCajaAuto('ingreso', `Abono servicio #${abonoTId}${obs ? ' — ' + obs : ''}`, monto, 'tecnico', abonoTId);
    document.getElementById('at-monto').value = '';
    document.getElementById('at-obs').value   = '';
    openAbonoT(abonoTId);
    renderTecnicos();
    renderDashboard();
    toast('Abono registrado ✓');
    await generarComprobanteAbono('tecnico', abonoTId, monto, obs);
  } catch (e) { toast('Error: ' + e.message, 'err'); }
}

// ── Fotos de servicios técnicos ───────────
window._tecFotos = { entrada: null, salida: null };

function prevTecFoto(input, tipo) {
  const file = input.files[0];
  if (!file) return;
  window._tecFotos[tipo] = file;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById(`tec-prev-${tipo}`);
    if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

async function subirFotoServicio(file, tipo) {
  const ext    = file.name.split('.').pop();
  const nombre = `servicio_${tipo}_${Date.now()}.${ext}`;
  const res    = await fetch(`${SUPA}/storage/v1/object/servicios-fotos/${nombre}`, {
    method : 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': file.type, 'x-upsert': 'true' },
    body   : file,
  });
  if (!res.ok) throw new Error('Error subiendo foto');
  return `${SUPA}/storage/v1/object/public/servicios-fotos/${nombre}`;
}

async function guardarFotosServicio(tecnicoId) {
  for (const tipo of ['entrada', 'salida']) {
    const file = window._tecFotos[tipo];
    if (!file) continue;
    try {
      const url = await subirFotoServicio(file, tipo);
      await sb('servicios_fotos', 'POST', {
        tecnico_id : tecnicoId,
        tipo,
        url,
        descripcion: tipo === 'entrada' ? 'Estado inicial del equipo' : 'Resultado final',
        fecha      : today(),
      });
    } catch (e) { console.warn('Error subiendo foto', tipo, e.message); }
  }
  window._tecFotos = { entrada: null, salida: null };
}

async function cargarFotosServicio(tecnicoId) {
  try {
    const fotos = await sb('servicios_fotos', 'GET', null, `?tecnico_id=eq.${tecnicoId}&order=id.asc`);
    return Array.isArray(fotos) ? fotos : [];
  } catch (e) { return []; }
}

async function subirFotoProceso(tecnicoId) {
  const input = document.createElement('input');
  input.type  = 'file';
  input.accept = 'image/*';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      toast('Subiendo foto...', 'inf');
      const url = await subirFotoServicio(file, 'proceso');
      await sb('servicios_fotos', 'POST', {
        tecnico_id : tecnicoId,
        tipo       : 'proceso',
        url,
        descripcion: 'Foto del proceso',
        fecha      : today(),
      });
      toast('Foto agregada ✓');
      abrirGaleriaServicio(tecnicoId);
    } catch (e) { toast('Error subiendo foto', 'err'); }
  };
  input.click();
}

async function abrirGaleriaServicio(tecnicoId) {
  const t     = tecnicos.find(x => x.id === tecnicoId);
  const fotos = await cargarFotosServicio(tecnicoId);

  const TIPO_LABEL = { entrada: '📥 Entrada', salida: '📤 Salida', proceso: '🔧 Proceso' };
  const TIPO_COLOR = { entrada: 'amber', salida: 'green', proceso: 'blue' };

  let galeria = '';
  if (!fotos.length) {
    galeria = '<p style="color:var(--text3);text-align:center;padding:20px">No hay fotos registradas aún.</p>';
  } else {
    galeria = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:16px">
      ${fotos.map(f => `
        <div style="position:relative;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border)">
          <img src="${f.url}" style="width:100%;height:130px;object-fit:cover;cursor:pointer" onclick="window.open('${f.url}','_blank')">
          <div style="padding:6px 8px;background:var(--bg3)">
            <span class="badge ${TIPO_COLOR[f.tipo]||'muted'}" style="font-size:10px">${TIPO_LABEL[f.tipo]||f.tipo}</span>
            <div style="font-size:10px;color:var(--text3);margin-top:3px">${f.fecha||''}</div>
          </div>
        </div>`).join('')}
    </div>`;
  }

  let modal = document.getElementById('modal-galeria-servicio');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-galeria-servicio';
    modal.className = 'overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal" style="max-width:600px">
      <div class="modal-header">
        <div class="modal-title">📸 Fotos — ${t?.cliente || ''} · ${t?.equipo || ''}</div>
        <button class="close-btn" onclick="document.getElementById('modal-galeria-servicio').classList.remove('open')">×</button>
      </div>
      ${galeria}
      <div class="modal-footer">
        <button class="btn" onclick="document.getElementById('modal-galeria-servicio').classList.remove('open')">Cerrar</button>
        <button class="btn primary" onclick="subirFotoProceso(${tecnicoId})">📷 Agregar foto proceso</button>
      </div>
    </div>`;
  modal.classList.add('open');
}
