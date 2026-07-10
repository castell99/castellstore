// ═══════════════════════════════════════════
//  tecnicos.js — CRUD Servicios Técnicos + Abonos
// ═══════════════════════════════════════════

function abrirNuevoTecnico() {
  editTecId = null;
  document.getElementById('modal-tec-title').textContent = '🔧 Nuevo Servicio Técnico';
  document.getElementById('btn-st').textContent = 'Guardar servicio';
  document.getElementById('t-cli').value       = '';
  document.getElementById('t-equipo').value    = '';
  document.getElementById('t-diag').value      = '';
  document.getElementById('t-costo').value     = '';
  document.getElementById('t-repuestos').value = '';
  document.getElementById('t-obs').value       = '';
  document.getElementById('t-estado').value    = 'Recibido';
  window._tecFotos = { entrada: null, salida: null };
  ['entrada','salida'].forEach(tipo => {
    const prev = document.getElementById('tec-prev-' + tipo);
    if (prev) { prev.src = ''; prev.style.display = 'none'; }
  });
  openModal('modal-tecnico');
}

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
      await sb('tecnicos', 'PATCH', payload, '?id=eq.' + editTecId);
      const idx = tecnicos.findIndex(x => x.id === editTecId);
      if (idx !== -1) tecnicos[idx] = Object.assign({}, tecnicos[idx], payload);
      toast('Servicio actualizado ✓');
    } else {
      payload.fecha = today();
      const res = await sb('tecnicos', 'POST', payload);
      const t   = res[0];
      tecnicos.unshift(t);
      if (t && t.id) await guardarFotosServicio(t.id);
      if (payload.costo_repuestos > 0) {
        await registrarMovCajaAuto('egreso', 'Repuestos: ' + payload.equipo + ' — ' + cli, payload.costo_repuestos, 'tecnico', t.id);
      }
      toast('Servicio registrado ✓');
    }
    closeModal('modal-tecnico');
    renderTecnicos();
    renderDashboard();
  } catch (e) { toast('Error: ' + e.message, 'err'); }
  setBtn('btn-st', false, 'Guardar servicio');
}

async function updateTecEst(id, val) {
  try {
    await sb('tecnicos', 'PATCH', { estado: val }, '?id=eq.' + id);
    const t = tecnicos.find(x => x.id === id);
    if (t) t.estado = val;
    renderDashboard();
    toast('Estado actualizado', 'inf');
  } catch (e) { toast('Error', 'err'); }
}

async function delTec(id) {
  if (!confirm('¿Eliminar este servicio? También se eliminarán sus abonos.')) return;
  try {
    await sb('tecnicos', 'DELETE', null, '?id=eq.' + id);
    await sb('abonos',   'DELETE', null, '?tipo=eq.tecnico&ref_id=eq.' + id);
    tecnicos = tecnicos.filter(t => t.id !== id);
    abonos   = abonos.filter(a => !(a.tipo === 'tecnico' && a.ref_id === id));
    renderTecnicos();
    renderDashboard();
    toast('Servicio eliminado');
  } catch (e) { toast('Error', 'err'); }
}

function renderTecnicos() {
  const tb = document.getElementById('tb-tecnicos');
  if (!tecnicos.length) {
    tb.innerHTML = '<tr class="empty-row"><td colspan="9">No hay servicios técnicos registrados</td></tr>';
    return;
  }
  tb.innerHTML = tecnicos.map(function(t) {
    const ab  = abonadoPor('tecnico', t.id);
    const sal = saldoPendiente('tecnico', t.id, t.costo);
    const pct = parseFloat(t.costo || 0) > 0 ? Math.min(100, Math.round((ab / parseFloat(t.costo)) * 100)) : 0;
    return '<tr>' +
      '<td style="font-size:11px;color:var(--text3)">' + t.fecha + '</td>' +
      '<td><strong>' + t.cliente + '</strong></td>' +
      '<td>' + t.equipo + '</td>' +
      '<td style="color:var(--text2);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (t.diagnostico || '—') + '</td>' +
      '<td style="font-family:var(--mono)">' + fmt(t.costo) +
        (parseFloat(t.costo_repuestos||0) > 0 ? '<div style="font-size:10px;color:var(--text3)">Repuestos: ' + fmt(t.costo_repuestos) + '</div><div style="font-size:11px;color:var(--green);font-weight:600">Ganancia: ' + fmt(t.costo - t.costo_repuestos) + '</div>' : '') +
      '</td>' +
      '<td style="font-family:var(--mono);color:var(--green)">' + fmt(ab) +
        (parseFloat(t.costo || 0) > 0 ? '<div class="progress-bar" style="width:70px"><div class="progress-fill" style="width:' + pct + '%"></div></div>' : '') +
      '</td>' +
      '<td style="font-family:var(--mono);color:' + (sal > 0 ? 'var(--amber)' : 'var(--green)') + '">' + fmt(sal) + '</td>' +
      '<td><select class="status-sel" onchange="updateTecEst(' + t.id + ', this.value)">' +
        ['Recibido','En diagnóstico','En reparación','Listo para entrega','Entregado'].map(function(s) {
          return '<option' + (s === t.estado ? ' selected' : '') + '>' + s + '</option>';
        }).join('') +
      '</select></td>' +
      '<td style="white-space:nowrap;display:flex;gap:4px;align-items:center;flex-wrap:wrap">' +
        (parseFloat(t.costo || 0) > 0 ? '<button class="btn sm" onclick="openAbonoT(' + t.id + ')">💳 Abono</button>' : '') +
        (t.estado === 'Entregado' ? '<button class="btn sm" onclick="generarRecibo(\'tecnico\',' + t.id + ')" style="background:var(--green-bg);border-color:var(--green-bd);color:var(--green)">📄 Paz y Salvo</button>' : '') +
        '<button class="btn sm" onclick="abrirGaleriaServicio(' + t.id + ')" title="Fotos">📸</button>' +
        '<button class="btn sm" onclick="editarTecnico(' + t.id + ')" title="Editar">✏️</button>' +
        '<button class="icon-btn" onclick="delTec(' + t.id + ')" title="Eliminar">🗑</button>' +
      '</td></tr>';
  }).join('');
}

function openAbonoT(id) {
  abonoTId  = id;
  const t   = tecnicos.find(x => x.id === id);
  const ab  = abonadoPor('tecnico', id);
  const sal = saldoPendiente('tecnico', id, t.costo);
  const pct = parseFloat(t.costo || 0) > 0 ? Math.min(100, Math.round((ab / parseFloat(t.costo)) * 100)) : 0;
  document.getElementById('abono-t-info').innerHTML =
    '<div class="alert info" style="flex-direction:column;align-items:flex-start;gap:6px">' +
    '<div><strong>' + t.cliente + '</strong> — ' + t.equipo + '</div>' +
    '<div>Costo: <strong>' + fmt(t.costo) + '</strong> · Abonado: <strong style="color:var(--green)">' + fmt(ab) + '</strong> · Saldo: <strong style="color:var(--amber)">' + fmt(sal) + '</strong></div>' +
    '<div class="progress-bar" style="width:100%"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
    '<div style="font-size:11px;color:var(--text2)">' + pct + '% pagado</div></div>';
  renderAbonoLista('tecnico', id, 'at-lista');
  openModal('modal-abono-t');
}

async function guardarAbonoT() {
  const monto = parseFloat(document.getElementById('at-monto').value) || 0;
  const obs   = document.getElementById('at-obs').value;
  if (!monto) { toast('Ingresa un monto válido', 'err'); return; }
  const t   = tecnicos.find(x => x.id === abonoTId);
  const sal = saldoPendiente('tecnico', abonoTId, t ? t.costo : 0);
  if (monto > sal + 0.01) { toast('Abono supera el saldo (' + fmt(sal) + ')', 'err'); return; }
  try {
    const res = await sb('abonos', 'POST', { tipo: 'tecnico', ref_id: abonoTId, monto: monto, obs: obs, fecha: today() });
    abonos.push(res[0]);
    await registrarMovCajaAuto('ingreso', 'Abono servicio #' + abonoTId + (obs ? ' — ' + obs : ''), monto, 'tecnico', abonoTId);
    document.getElementById('at-monto').value = '';
    document.getElementById('at-obs').value   = '';
    openAbonoT(abonoTId);
    renderTecnicos();
    renderDashboard();
    toast('Abono registrado ✓');
    await generarComprobanteAbono('tecnico', abonoTId, monto, obs);
  } catch (e) { toast('Error: ' + e.message, 'err'); }
}

// ── Fotos ─────────────────────────────────
window._tecFotos = { entrada: null, salida: null };

function prevTecFoto(input, tipo) {
  const file = input.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (['heic','heif'].includes(ext)) {
    toast('Formato no soportado. Usa JPG o PNG', 'err');
    input.value = '';
    return;
  }
  window._tecFotos[tipo] = file;
  const reader = new FileReader();
  reader.onload = function(e) {
    const prev = document.getElementById('tec-prev-' + tipo);
    if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

async function subirFotoServicio(file, tipo) {
  const ext    = file.name.split('.').pop();
  const nombre = 'servicio_' + tipo + '_' + Date.now() + '.' + ext;
  const res    = await fetch(SUPA + '/storage/v1/object/servicios-fotos/' + nombre, {
    method : 'POST',
    headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': file.type, 'x-upsert': 'true' },
    body   : file,
  });
  if (!res.ok) throw new Error('Error subiendo foto');
  return SUPA + '/storage/v1/object/public/servicios-fotos/' + nombre;
}

async function guardarFotosServicio(tecnicoId) {
  for (var i = 0; i < ['entrada','salida'].length; i++) {
    var tipo = ['entrada','salida'][i];
    var file = window._tecFotos[tipo];
    if (!file) continue;
    try {
      var url = await subirFotoServicio(file, tipo);
      await sb('servicios_fotos', 'POST', {
        tecnico_id : tecnicoId,
        tipo       : tipo,
        url        : url,
        descripcion: tipo === 'entrada' ? 'Estado inicial del equipo' : 'Resultado final',
        fecha      : today(),
      });
    } catch (e) { console.warn('Error subiendo foto', tipo, e.message); }
  }
  window._tecFotos = { entrada: null, salida: null };
}

async function cargarFotosServicio(tecnicoId) {
  try {
    const fotos = await sb('servicios_fotos', 'GET', null, '?tecnico_id=eq.' + tecnicoId + '&order=id.asc');
    return Array.isArray(fotos) ? fotos : [];
  } catch (e) { return []; }
}

async function subirFotoProceso(tecnicoId) {
  const input   = document.createElement('input');
  input.type    = 'file';
  input.accept  = 'image/jpeg,image/png,image/webp';
  input.onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      toast('Subiendo foto...', 'inf');
      const url = await subirFotoServicio(file, 'proceso');
      await sb('servicios_fotos', 'POST', {
        tecnico_id : tecnicoId,
        tipo       : 'proceso',
        url        : url,
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

  window._galeriaFotos = fotos;
  window._galeriaSelec = new Set();
  window._galeriaTecId = tecnicoId;

  window.renderGaleriaBody = function() {
    const fs = window._galeriaFotos;
    if (!fs.length) return '<p style="color:var(--text3);text-align:center;padding:20px">No hay fotos registradas aún.</p>';
    var sel  = window._galeriaSelec;
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:16px">';
    fs.forEach(function(f) {
      html += '<div style="position:relative;border-radius:var(--radius);overflow:hidden;border:2px solid ' + (sel.has(f.id) ? 'var(--green)' : 'var(--border)') + '">' +
        '<div style="position:absolute;top:6px;left:6px;z-index:2">' +
        '<input type="checkbox" ' + (sel.has(f.id) ? 'checked' : '') + ' onchange="toggleSelecFoto(' + f.id + ')" style="width:16px;height:16px;cursor:pointer;accent-color:var(--green)"></div>' +
        '<img src="' + f.url + '" style="width:100%;height:130px;object-fit:cover;cursor:zoom-in" onclick="abrirLightbox(\'' + f.url + '\',\'' + (TIPO_LABEL[f.tipo]||f.tipo) + '\',\'' + (f.fecha||'') + '\')">' +
        '<div style="padding:6px 8px;background:var(--bg3);display:flex;justify-content:space-between;align-items:center">' +
        '<div><span class="badge ' + (TIPO_COLOR[f.tipo]||'muted') + '" style="font-size:10px">' + (TIPO_LABEL[f.tipo]||f.tipo) + '</span>' +
        '<div style="font-size:10px;color:var(--text3);margin-top:2px">' + (f.fecha||'') + '</div></div>' +
        '<button onclick="eliminarFotoServicio(' + f.id + ')" style="background:none;border:none;cursor:pointer;font-size:16px;padding:2px" title="Eliminar">🗑</button>' +
        '</div></div>';
    });
    html += '</div>';
    if (sel.size > 0) {
      html += '<div style="background:rgba(240,107,107,0.1);border:1px solid #f06b6b;border-radius:var(--radius);padding:10px 14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">' +
        '<span style="font-size:13px;color:#f06b6b">' + sel.size + ' foto(s) seleccionada(s)</span>' +
        '<button class="btn sm" onclick="eliminarFotosSeleccionadas()" style="background:#f06b6b;border-color:#f06b6b;color:#fff">🗑 Eliminar seleccionadas</button></div>';
    }
    return html;
  };

  window.toggleSelecFoto = function(id) {
    if (window._galeriaSelec.has(id)) window._galeriaSelec.delete(id);
    else window._galeriaSelec.add(id);
    document.getElementById('galeria-body').innerHTML = window.renderGaleriaBody();
  };

  window.eliminarFotoServicio = async function(id) {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await sb('servicios_fotos', 'DELETE', null, '?id=eq.' + id);
      window._galeriaFotos = window._galeriaFotos.filter(function(f) { return f.id !== id; });
      window._galeriaSelec.delete(id);
      document.getElementById('galeria-body').innerHTML = window.renderGaleriaBody();
      toast('Foto eliminada ✓');
    } catch (e) { toast('Error eliminando foto', 'err'); }
  };

  window.eliminarFotosSeleccionadas = async function() {
    if (!confirm('¿Eliminar ' + window._galeriaSelec.size + ' foto(s)?')) return;
    for (const id of window._galeriaSelec) {
      try { await sb('servicios_fotos', 'DELETE', null, '?id=eq.' + id); } catch (_) {}
    }
    const ids = window._galeriaSelec;
    window._galeriaFotos = window._galeriaFotos.filter(function(f) { return !ids.has(f.id); });
    window._galeriaSelec.clear();
    document.getElementById('galeria-body').innerHTML = window.renderGaleriaBody();
    toast('Fotos eliminadas ✓');
  };

  window.abrirLightbox = function(url, tipo, fecha) {
    var lb = document.getElementById('lightbox-servicio');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'lightbox-servicio';
      lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:2000;display:none;flex-direction:column;align-items:center;justify-content:center;cursor:zoom-out';
      document.body.appendChild(lb);
    }
    lb.innerHTML =
      '<div style="position:absolute;top:16px;right:20px;color:#fff;font-size:32px;cursor:pointer;line-height:1" onclick="document.getElementById(\'lightbox-servicio\').style.display=\'none\'">×</div>' +
      '<img src="' + url + '" style="max-width:90vw;max-height:85vh;object-fit:contain;border-radius:8px;box-shadow:0 0 40px rgba(0,0,0,0.8)" onclick="event.stopPropagation()">' +
      '<div style="margin-top:12px;color:#ccc;font-size:13px">' + tipo + ' · ' + fecha + '</div>';
    lb.style.display = 'flex';
    lb.onclick = function(e) { if (e.target === lb) lb.style.display = 'none'; };
  };

  var modal = document.getElementById('modal-galeria-servicio');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-galeria-servicio';
    modal.className = 'overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML =
    '<div class="modal" style="max-width:640px">' +
    '<div class="modal-header">' +
    '<div class="modal-title">📸 Fotos — ' + (t ? t.cliente : '') + ' · ' + (t ? t.equipo : '') + '</div>' +
    '<button class="close-btn" onclick="document.getElementById(\'modal-galeria-servicio\').classList.remove(\'open\')">×</button></div>' +
    '<div id="galeria-body">' + window.renderGaleriaBody() + '</div>' +
    '<div class="modal-footer">' +
    '<button class="btn" onclick="document.getElementById(\'modal-galeria-servicio\').classList.remove(\'open\')">Cerrar</button>' +
    '<button class="btn primary" onclick="subirFotoProceso(' + tecnicoId + ')">📷 Agregar foto proceso</button>' +
    '</div></div>';
  modal.classList.add('open');
}
