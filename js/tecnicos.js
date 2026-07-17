// ═══════════════════════════════════════════
//  tecnicos.js — CRUD Servicios Técnicos + Abonos
// ═══════════════════════════════════════════

function abrirNuevoTecnico() {
  editTecId = null;
  document.getElementById('modal-tec-title').textContent = 'Nuevo Servicio Técnico';
  document.getElementById('btn-st').textContent = 'Guardar servicio';
  document.getElementById('t-cli').value       = '';
  document.getElementById('t-equipo').value    = '';
  document.getElementById('t-diag').value      = '';
  document.getElementById('t-costo').value     = '';
  document.getElementById('t-repuestos').value = '';
  document.getElementById('t-obs').value       = '';
  document.getElementById('t-estado').value    = 'Recibido';
  window._tecFotos = { entrada: null, salida: null };
  ['entrada','salida'].forEach(function(tipo) {
    var prev = document.getElementById('tec-prev-' + tipo);
    if (prev) { prev.src = ''; prev.style.display = 'none'; }
  });
  limpiarBloqueoForm();
  openModal('modal-tecnico');
}

function editarTecnico(id) {
  var t = tecnicos.find(function(x) { return x.id === id; });
  if (!t) return;
  editTecId = id;
  document.getElementById('modal-tec-title').textContent = 'Editar Servicio Técnico';
  document.getElementById('btn-st').textContent = 'Actualizar servicio';
  document.getElementById('t-cli').value       = t.cliente     || '';
  document.getElementById('t-equipo').value    = t.equipo      || '';
  document.getElementById('t-diag').value      = t.diagnostico || '';
  document.getElementById('t-costo').value     = t.costo       || '';
  document.getElementById('t-repuestos').value = t.costo_repuestos || '';
  document.getElementById('t-obs').value       = t.obs         || '';
  setSelectVal('t-estado', t.estado);
  if (t.tipo_bloqueo) {
    setTipoBloqueo(t.tipo_bloqueo);
    if (t.tipo_bloqueo !== 'patron') {
      var inp = document.getElementById('t-clave-bloqueo');
      if (inp) inp.value = t.clave_bloqueo || '';
    }
  }
  openModal('modal-tecnico');
}

async function guardarTecnico() {
  var cli = document.getElementById('t-cli').value.trim();
  var eq  = document.getElementById('t-equipo').value.trim();
  if (!cli || !eq) { toast('Completa los campos requeridos', 'err'); return; }

  var bloqueo = getBloqueoPayload();
  var payload = {
    cliente         : cli,
    equipo          : eq,
    diagnostico     : document.getElementById('t-diag').value,
    costo           : parseFloat(document.getElementById('t-costo').value) || 0,
    costo_repuestos : parseFloat(document.getElementById('t-repuestos').value) || 0,
    estado          : document.getElementById('t-estado').value,
    obs             : document.getElementById('t-obs').value,
    tipo_bloqueo    : bloqueo.tipo_bloqueo,
    clave_bloqueo   : bloqueo.clave_bloqueo,
    patron_bloqueo  : bloqueo.patron_bloqueo,
  };

  setBtn('btn-st', true, 'Guardar servicio');
  try {
    if (editTecId) {
      await sb('tecnicos', 'PATCH', payload, '?id=eq.' + editTecId);
      var idx = tecnicos.findIndex(function(x) { return x.id === editTecId; });
      if (idx !== -1) tecnicos[idx] = Object.assign({}, tecnicos[idx], payload);
      toast('Servicio actualizado');
    } else {
      payload.fecha = today();
      var res = await sb('tecnicos', 'POST', payload);
      var t   = res[0];
      tecnicos.unshift(t);
      if (t && t.id) await guardarFotosServicio(t.id);
      if (payload.costo_repuestos > 0) {
        await registrarMovCajaAuto('egreso', 'Repuestos: ' + payload.equipo + ' - ' + cli, payload.costo_repuestos, 'tecnico', t.id);
      }
      toast('Servicio registrado');
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
    var t = tecnicos.find(function(x) { return x.id === id; });
    if (t) t.estado = val;
    renderDashboard();
    toast('Estado actualizado', 'inf');
  } catch (e) { toast('Error', 'err'); }
}

async function delTec(id) {
  if (!confirm('Eliminar este servicio? Tambien se eliminaran sus abonos.')) return;
  try {
    await sb('tecnicos', 'DELETE', null, '?id=eq.' + id);
    await sb('abonos',   'DELETE', null, '?tipo=eq.tecnico&ref_id=eq.' + id);
    tecnicos = tecnicos.filter(function(t) { return t.id !== id; });
    abonos   = abonos.filter(function(a) { return !(a.tipo === 'tecnico' && a.ref_id === id); });
    renderTecnicos();
    renderDashboard();
    toast('Servicio eliminado');
  } catch (e) { toast('Error', 'err'); }
}

function renderTecnicos() {
  var tb = document.getElementById('tb-tecnicos');
  if (!tecnicos.length) {
    tb.innerHTML = '<tr class="empty-row"><td colspan="9">No hay servicios tecnicos registrados</td></tr>';
    return;
  }
  tb.innerHTML = tecnicos.map(function(t) {
    var ab  = abonadoPor('tecnico', t.id);
    var sal = saldoPendiente('tecnico', t.id, t.costo);
    var pct = parseFloat(t.costo || 0) > 0 ? Math.min(100, Math.round((ab / parseFloat(t.costo)) * 100)) : 0;
    var bloqueoHtml = t.tipo_bloqueo ? '<div style="margin-top:3px">' + mostrarBloqueoServicio(t) + '</div>' : '';
    return '<tr>' +
      '<td style="font-size:11px;color:var(--text3)">' + t.fecha + '</td>' +
      '<td><strong>' + t.cliente + '</strong></td>' +
      '<td>' + t.equipo + '</td>' +
      '<td style="color:var(--text2);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (t.diagnostico || '-') + bloqueoHtml + '</td>' +
      '<td style="font-family:var(--mono)">' + fmt(t.costo) +
        (parseFloat(t.costo_repuestos||0) > 0 ? '<div style="font-size:10px;color:var(--text3)">Repuestos: ' + fmt(t.costo_repuestos) + '</div><div style="font-size:11px;color:var(--green);font-weight:600">Ganancia: ' + fmt(t.costo - t.costo_repuestos) + '</div>' : '') +
      '</td>' +
      '<td style="font-family:var(--mono);color:var(--green)">' + fmt(ab) +
        (parseFloat(t.costo || 0) > 0 ? '<div class="progress-bar" style="width:70px"><div class="progress-fill" style="width:' + pct + '%"></div></div>' : '') +
      '</td>' +
      '<td style="font-family:var(--mono);color:' + (sal > 0 ? 'var(--amber)' : 'var(--green)') + '">' + fmt(sal) + '</td>' +
      '<td><select class="status-sel" onchange="updateTecEst(' + t.id + ', this.value)">' +
        ['Recibido','En diagnostico','En reparacion','Listo para entrega','Entregado'].map(function(s) {
          return '<option' + (s === t.estado ? ' selected' : '') + '>' + s + '</option>';
        }).join('') +
      '</select></td>' +
      '<td style="white-space:nowrap;display:flex;gap:4px;align-items:center;flex-wrap:wrap">' +
        (parseFloat(t.costo || 0) > 0 ? '<button class="btn sm" onclick="openAbonoT(' + t.id + ')">Abono</button>' : '') +
        (t.estado === 'Entregado' ? '<button class="btn sm" onclick="generarRecibo(\'tecnico\',' + t.id + ')" style="background:var(--green-bg);border-color:var(--green-bd);color:var(--green)">Paz y Salvo</button>' : '') +
        '<button class="btn sm" onclick="abrirGaleriaServicio(' + t.id + ')" title="Fotos">Fotos</button>' +
        '<button class="btn sm" onclick="verBloqueo(' + t.id + ')" title="Bloqueo">Bloqueo</button>' +
        '<button class="btn sm" onclick="editarTecnico(' + t.id + ')" title="Editar">Editar</button>' +
        '<button class="icon-btn" onclick="delTec(' + t.id + ')" title="Eliminar">x</button>' +
      '</td></tr>';
  }).join('');
}

function openAbonoT(id) {
  abonoTId = id;
  var t   = tecnicos.find(function(x) { return x.id === id; });
  var ab  = abonadoPor('tecnico', id);
  var sal = saldoPendiente('tecnico', id, t.costo);
  var pct = parseFloat(t.costo || 0) > 0 ? Math.min(100, Math.round((ab / parseFloat(t.costo)) * 100)) : 0;
  document.getElementById('abono-t-info').innerHTML =
    '<div class="alert info" style="flex-direction:column;align-items:flex-start;gap:6px">' +
    '<div><strong>' + t.cliente + '</strong> - ' + t.equipo + '</div>' +
    '<div>Costo: <strong>' + fmt(t.costo) + '</strong> · Abonado: <strong style="color:var(--green)">' + fmt(ab) + '</strong> · Saldo: <strong style="color:var(--amber)">' + fmt(sal) + '</strong></div>' +
    '<div class="progress-bar" style="width:100%"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
    '<div style="font-size:11px;color:var(--text2)">' + pct + '% pagado</div></div>';
  renderAbonoLista('tecnico', id, 'at-lista');
  openModal('modal-abono-t');
}

async function guardarAbonoT() {
  var monto = parseFloat(document.getElementById('at-monto').value) || 0;
  var obs   = document.getElementById('at-obs').value;
  if (!monto) { toast('Ingresa un monto valido', 'err'); return; }
  var t   = tecnicos.find(function(x) { return x.id === abonoTId; });
  var sal = saldoPendiente('tecnico', abonoTId, t ? t.costo : 0);
  if (monto > sal + 0.01) { toast('Abono supera el saldo (' + fmt(sal) + ')', 'err'); return; }
  try {
    var res = await sb('abonos', 'POST', { tipo: 'tecnico', ref_id: abonoTId, monto: monto, obs: obs, fecha: today() });
    abonos.push(res[0]);
    await registrarMovCajaAuto('ingreso', 'Abono servicio #' + abonoTId + (obs ? ' - ' + obs : ''), monto, 'tecnico', abonoTId);
    document.getElementById('at-monto').value = '';
    document.getElementById('at-obs').value   = '';
    openAbonoT(abonoTId);
    renderTecnicos();
    renderDashboard();
    toast('Abono registrado');
    await generarComprobanteAbono('tecnico', abonoTId, monto, obs);
  } catch (e) { toast('Error: ' + e.message, 'err'); }
}

// ── Ver bloqueo ───────────────────────────
function verBloqueo(id) {
  var t = tecnicos.find(function(x) { return x.id === id; });
  if (!t) return;
  var html = '';
  if (!t.tipo_bloqueo) {
    html = '<p style="color:var(--text3);text-align:center;padding:20px">Sin bloqueo registrado.</p>';
  } else if (t.tipo_bloqueo === 'patron') {
    var seq = [];
    try { seq = JSON.parse(t.patron_bloqueo || '[]'); } catch(e) {}
    html = '<div style="text-align:center;padding:10px 0">' +
      '<p style="font-size:13px;color:var(--text2);margin-bottom:12px">Tipo: <strong>Patron</strong></p>' +
      '<canvas id="bloqueo-canvas-view" width="210" height="210" style="border-radius:12px;background:var(--bg3);border:1px solid var(--border)"></canvas>' +
      '</div>';
    setTimeout(function() {
      var canvas = document.getElementById('bloqueo-canvas-view');
      if (!canvas) return;
      var ctx  = canvas.getContext('2d');
      var size = 210, pad = 42, step = (size - pad*2) / 2;
      var nodes = [];
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) nodes.push({ x: pad+c*step, y: pad+r*step, idx: r*3+c });
      if (seq.length > 1) {
        ctx.beginPath(); ctx.strokeStyle = 'rgba(57,255,20,0.5)'; ctx.lineWidth = 2;
        seq.forEach(function(idx, i) { var n = nodes[idx]; if (i===0) ctx.moveTo(n.x,n.y); else ctx.lineTo(n.x,n.y); });
        ctx.stroke();
      }
      nodes.forEach(function(n) {
        var activo = seq.indexOf(n.idx) !== -1;
        ctx.beginPath(); ctx.arc(n.x,n.y,activo?14:9,0,Math.PI*2);
        ctx.fillStyle = activo ? 'rgba(57,255,20,0.25)' : 'rgba(150,180,200,0.2)'; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x,n.y,activo?6:4,0,Math.PI*2);
        ctx.fillStyle = activo ? '#39ff14' : 'rgba(150,180,200,0.5)'; ctx.fill();
      });
    }, 100);
  } else {
    html = '<div style="padding:10px 0">' +
      '<p style="font-size:13px;color:var(--text2);margin-bottom:8px">Tipo: <strong>' + (t.tipo_bloqueo === 'pin' ? 'PIN' : 'Contrasena') + '</strong></p>' +
      '<div style="background:var(--bg3);border-radius:10px;padding:14px;font-size:20px;letter-spacing:.2em;text-align:center;font-family:var(--mono)">' + (t.clave_bloqueo || '(no registrada)') + '</div>' +
      '<p style="font-size:11px;color:var(--text3);margin-top:8px;text-align:center">Informacion confidencial - solo visible para el tecnico</p></div>';
  }

  var modal = document.getElementById('modal-bloqueo-view');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-bloqueo-view';
    modal.className = 'overlay';
    document.body.appendChild(modal);
  }
  modal.innerHTML = '<div class="modal" style="max-width:340px">' +
    '<div class="modal-header"><div class="modal-title">Bloqueo - ' + t.cliente + '</div>' +
    '<button class="close-btn" onclick="document.getElementById(\'modal-bloqueo-view\').classList.remove(\'open\')">x</button></div>' +
    html +
    '<div class="modal-footer"><button class="btn" onclick="document.getElementById(\'modal-bloqueo-view\').classList.remove(\'open\')">Cerrar</button></div></div>';
  modal.classList.add('open');
}

// ── Fotos ─────────────────────────────────
window._tecFotos = { entrada: null, salida: null };

function prevTecFoto(input, tipo) {
  var file = input.files[0];
  if (!file) return;
  var ext = file.name.split('.').pop().toLowerCase();
  if (['heic','heif'].includes(ext)) { toast('Formato no soportado. Usa JPG o PNG', 'err'); input.value = ''; return; }
  window._tecFotos[tipo] = file;
  var reader = new FileReader();
  reader.onload = function(e) {
    var prev = document.getElementById('tec-prev-' + tipo);
    if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

async function subirFotoServicio(file, tipo) {
  var ext    = file.name.split('.').pop();
  var nombre = 'servicio_' + tipo + '_' + Date.now() + '.' + ext;
  var res    = await fetch(SUPA + '/storage/v1/object/servicios-fotos/' + nombre, {
    method: 'POST', headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': file.type, 'x-upsert': 'true' }, body: file,
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
      await sb('servicios_fotos', 'POST', { tecnico_id: tecnicoId, tipo: tipo, url: url, descripcion: tipo === 'entrada' ? 'Estado inicial' : 'Resultado final', fecha: today() });
    } catch (e) { console.warn('Error subiendo foto', tipo, e.message); }
  }
  window._tecFotos = { entrada: null, salida: null };
}

async function cargarFotosServicio(tecnicoId) {
  try {
    var fotos = await sb('servicios_fotos', 'GET', null, '?tecnico_id=eq.' + tecnicoId + '&order=id.asc');
    return Array.isArray(fotos) ? fotos : [];
  } catch (e) { return []; }
}

async function subirFotoProceso(tecnicoId) {
  var input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp';
  input.onchange = async function(e) {
    var file = e.target.files[0]; if (!file) return;
    try {
      toast('Subiendo foto...', 'inf');
      var url = await subirFotoServicio(file, 'proceso');
      await sb('servicios_fotos', 'POST', { tecnico_id: tecnicoId, tipo: 'proceso', url: url, descripcion: 'Foto del proceso', fecha: today() });
      toast('Foto agregada');
      abrirGaleriaServicio(tecnicoId);
    } catch (e) { toast('Error subiendo foto', 'err'); }
  };
  input.click();
}

async function abrirGaleriaServicio(tecnicoId) {
  var t     = tecnicos.find(function(x) { return x.id === tecnicoId; });
  var fotos = await cargarFotosServicio(tecnicoId);
  var TIPO_LABEL = { entrada: 'Entrada', salida: 'Salida', proceso: 'Proceso' };
  var TIPO_COLOR = { entrada: 'amber', salida: 'green', proceso: 'blue' };
  window._galeriaFotos = fotos; window._galeriaSelec = new Set(); window._galeriaTecId = tecnicoId;

  window.renderGaleriaBody = function() {
    var fs = window._galeriaFotos, sel = window._galeriaSelec;
    if (!fs.length) return '<p style="color:var(--text3);text-align:center;padding:20px">No hay fotos registradas.</p>';
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:16px">';
    fs.forEach(function(f) {
      html += '<div style="position:relative;border-radius:var(--radius);overflow:hidden;border:2px solid ' + (sel.has(f.id) ? 'var(--green)' : 'var(--border)') + '">' +
        '<div style="position:absolute;top:6px;left:6px;z-index:2"><input type="checkbox" ' + (sel.has(f.id) ? 'checked' : '') + ' onchange="toggleSelecFoto(' + f.id + ')" style="width:16px;height:16px;cursor:pointer;accent-color:var(--green)"></div>' +
        '<img src="' + f.url + '" style="width:100%;height:130px;object-fit:cover;cursor:zoom-in" onclick="abrirLightbox(\'' + f.url + '\',\'' + (TIPO_LABEL[f.tipo]||f.tipo) + '\',\'' + (f.fecha||'') + '\')">' +
        '<div style="padding:6px 8px;background:var(--bg3);display:flex;justify-content:space-between;align-items:center">' +
        '<div><span class="badge ' + (TIPO_COLOR[f.tipo]||'muted') + '" style="font-size:10px">' + (TIPO_LABEL[f.tipo]||f.tipo) + '</span>' +
        '<div style="font-size:10px;color:var(--text3);margin-top:2px">' + (f.fecha||'') + '</div></div>' +
        '<button onclick="eliminarFotoServicio(' + f.id + ')" style="background:none;border:none;cursor:pointer;font-size:16px;padding:2px">x</button></div></div>';
    });
    html += '</div>';
    if (sel.size > 0) html += '<div style="background:rgba(240,107,107,0.1);border:1px solid #f06b6b;border-radius:var(--radius);padding:10px 14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:13px;color:#f06b6b">' + sel.size + ' foto(s) seleccionada(s)</span><button class="btn sm" onclick="eliminarFotosSeleccionadas()" style="background:#f06b6b;border-color:#f06b6b;color:#fff">Eliminar seleccionadas</button></div>';
    return html;
  };

  window.toggleSelecFoto = function(id) { if (window._galeriaSelec.has(id)) window._galeriaSelec.delete(id); else window._galeriaSelec.add(id); document.getElementById('galeria-body').innerHTML = window.renderGaleriaBody(); };
  window.eliminarFotoServicio = async function(id) { if (!confirm('Eliminar esta foto?')) return; try { await sb('servicios_fotos','DELETE',null,'?id=eq.'+id); window._galeriaFotos=window._galeriaFotos.filter(function(f){return f.id!==id;}); window._galeriaSelec.delete(id); document.getElementById('galeria-body').innerHTML=window.renderGaleriaBody(); toast('Foto eliminada'); } catch(e){toast('Error','err');} };
  window.eliminarFotosSeleccionadas = async function() { if (!confirm('Eliminar '+window._galeriaSelec.size+' foto(s)?')) return; for (var id of window._galeriaSelec) { try { await sb('servicios_fotos','DELETE',null,'?id=eq.'+id); } catch(_){} } var ids=window._galeriaSelec; window._galeriaFotos=window._galeriaFotos.filter(function(f){return !ids.has(f.id);}); window._galeriaSelec.clear(); document.getElementById('galeria-body').innerHTML=window.renderGaleriaBody(); toast('Fotos eliminadas'); };
  window.abrirLightbox = function(url, tipo, fecha) { var lb=document.getElementById('lightbox-servicio'); if(!lb){lb=document.createElement('div');lb.id='lightbox-servicio';lb.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:2000;display:none;flex-direction:column;align-items:center;justify-content:center;cursor:zoom-out';document.body.appendChild(lb);} lb.innerHTML='<div style="position:absolute;top:16px;right:20px;color:#fff;font-size:32px;cursor:pointer;line-height:1" onclick="document.getElementById(\'lightbox-servicio\').style.display=\'none\'">x</div><img src="'+url+'" style="max-width:90vw;max-height:85vh;object-fit:contain;border-radius:8px" onclick="event.stopPropagation()"><div style="margin-top:12px;color:#ccc;font-size:13px">'+tipo+' - '+fecha+'</div>'; lb.style.display='flex'; lb.onclick=function(e){if(e.target===lb)lb.style.display='none';}; };

  var modal = document.getElementById('modal-galeria-servicio');
  if (!modal) { modal=document.createElement('div'); modal.id='modal-galeria-servicio'; modal.className='overlay'; document.body.appendChild(modal); }
  modal.innerHTML = '<div class="modal" style="max-width:640px"><div class="modal-header"><div class="modal-title">Fotos - ' + (t?t.cliente:'') + ' - ' + (t?t.equipo:'') + '</div><button class="close-btn" onclick="document.getElementById(\'modal-galeria-servicio\').classList.remove(\'open\')">x</button></div><div id="galeria-body">' + window.renderGaleriaBody() + '</div><div class="modal-footer"><button class="btn" onclick="document.getElementById(\'modal-galeria-servicio\').classList.remove(\'open\')">Cerrar</button><button class="btn primary" onclick="subirFotoProceso(' + tecnicoId + ')">Agregar foto proceso</button></div></div>';
  modal.classList.add('open');
}

// ── Bloqueo ───────────────────────────────
var _tipoBloqueo     = 'pin';
var _patronSecuencia = [];
var _patronDrawing   = false;
var _patronCtx       = null;
var _patronNodes     = [];

function setTipoBloqueo(tipo) {
  _tipoBloqueo = tipo;
  ['pin','password','patron'].forEach(function(t) {
    var b = document.getElementById('tbl-btn-' + t);
    if (!b) return;
    b.style.background  = t === tipo ? 'var(--green-bg)' : 'transparent';
    b.style.color       = t === tipo ? 'var(--green)'    : 'var(--text2)';
    b.style.borderColor = t === tipo ? 'var(--green-bd)' : 'var(--border)';
    b.style.fontWeight  = t === tipo ? '600' : '400';
  });
  var panelClave  = document.getElementById('tbl-panel-clave');
  var panelPatron = document.getElementById('tbl-panel-patron');
  if (panelClave)  panelClave.style.display  = tipo !== 'patron' ? 'block' : 'none';
  if (panelPatron) panelPatron.style.display = tipo === 'patron' ? 'flex'  : 'none';
  if (tipo === 'patron') iniciarPatronTec();
}

function iniciarPatronTec() {
  var canvas = document.getElementById('tbl-patron-canvas');
  if (!canvas || _patronCtx) return;
  _patronCtx  = canvas.getContext('2d');
  var size = 210, pad = 42, step = (size - pad*2) / 2;
  _patronNodes = [];
  for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) _patronNodes.push({ x: pad+c*step, y: pad+r*step, idx: r*3+c });
  dibujarPatronTec([]);
  canvas.addEventListener('mousedown',  patronStart);
  canvas.addEventListener('mousemove',  patronMove);
  canvas.addEventListener('mouseup',    patronEnd);
  canvas.addEventListener('touchstart', function(e){ e.preventDefault(); patronStart(e); }, {passive:false});
  canvas.addEventListener('touchmove',  function(e){ e.preventDefault(); patronMove(e);  }, {passive:false});
  canvas.addEventListener('touchend',   function(e){ e.preventDefault(); patronEnd();    }, {passive:false});
}

function getPatronPos(e) {
  var canvas = document.getElementById('tbl-patron-canvas');
  var rect   = canvas.getBoundingClientRect();
  var scale  = 210 / rect.width;
  return { x: ((e.touches?e.touches[0].clientX:e.clientX)-rect.left)*scale, y: ((e.touches?e.touches[0].clientY:e.clientY)-rect.top)*scale };
}

function nearPatronNode(pos) {
  var best=null, bestD=999;
  _patronNodes.forEach(function(n){ var d=Math.hypot(n.x-pos.x,n.y-pos.y); if(d<24&&d<bestD){bestD=d;best=n;} });
  return best;
}

function patronStart(e) { _patronDrawing=true; _patronSecuencia=[]; var n=nearPatronNode(getPatronPos(e)); if(n){_patronSecuencia.push(n.idx);dibujarPatronTec(_patronSecuencia);} }
function patronMove(e)  { if(!_patronDrawing)return; var n=nearPatronNode(getPatronPos(e)); if(n&&_patronSecuencia.indexOf(n.idx)===-1){_patronSecuencia.push(n.idx);dibujarPatronTec(_patronSecuencia);} }
function patronEnd()    { _patronDrawing=false; var txt=document.getElementById('tbl-patron-txt'); if(txt)txt.textContent=_patronSecuencia.length>1?'Patron de '+_patronSecuencia.length+' puntos':'Sin patron'; }

function dibujarPatronTec(seq) {
  if (!_patronCtx) return;
  var ctx=_patronCtx;
  ctx.clearRect(0,0,210,210);
  if (seq.length>1) { ctx.beginPath(); ctx.strokeStyle='rgba(57,255,20,0.5)'; ctx.lineWidth=2; seq.forEach(function(idx,i){var n=_patronNodes[idx];if(i===0)ctx.moveTo(n.x,n.y);else ctx.lineTo(n.x,n.y);}); ctx.stroke(); }
  _patronNodes.forEach(function(n){ var a=seq.indexOf(n.idx)!==-1; ctx.beginPath();ctx.arc(n.x,n.y,a?14:9,0,Math.PI*2);ctx.fillStyle=a?'rgba(57,255,20,0.25)':'rgba(150,180,200,0.2)';ctx.fill(); ctx.beginPath();ctx.arc(n.x,n.y,a?6:4,0,Math.PI*2);ctx.fillStyle=a?'#39ff14':'rgba(150,180,200,0.5)';ctx.fill(); });
}

function limpiarPatronTec() { _patronSecuencia=[]; dibujarPatronTec([]); var txt=document.getElementById('tbl-patron-txt'); if(txt)txt.textContent='Sin patron'; }

function getBloqueoPayload() {
  if (_tipoBloqueo==='patron') return { tipo_bloqueo:'patron', clave_bloqueo:'', patron_bloqueo:JSON.stringify(_patronSecuencia) };
  return { tipo_bloqueo:_tipoBloqueo, clave_bloqueo:(document.getElementById('t-clave-bloqueo')?document.getElementById('t-clave-bloqueo').value:''), patron_bloqueo:'' };
}

function limpiarBloqueoForm() {
  _tipoBloqueo=_patronSecuencia=[];_patronCtx=null;_patronNodes=[];_tipoBloqueo='pin';
  setTipoBloqueo('pin');
  var inp=document.getElementById('t-clave-bloqueo'); if(inp)inp.value='';
  var txt=document.getElementById('tbl-patron-txt'); if(txt)txt.textContent='Sin patron';
}

function mostrarBloqueoServicio(t) {
  if (!t.tipo_bloqueo) return '<div style="color:var(--text3);font-size:12px">Sin bloqueo registrado</div>';
  if (t.tipo_bloqueo==='patron') { var seq=[]; try{seq=JSON.parse(t.patron_bloqueo||'[]');}catch(e){} return '<div style="font-size:12px;color:var(--text2)">Bloqueo: Patron de '+seq.length+' puntos</div>'; }
  return '<div style="font-size:12px;color:var(--text2)">Bloqueo: '+(t.tipo_bloqueo==='pin'?'PIN':'Contrasena')+(t.clave_bloqueo?' registrada':' no registrada')+'</div>';
}
