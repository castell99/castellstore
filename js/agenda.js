// ═══════════════════════════════════════════
//  agenda.js — Agenda de tareas y citas
// ═══════════════════════════════════════════

let agendaItems  = [];
let agFiltroTipo = '';
let agFiltroEst  = 'pendiente';
let editAgId     = null;

const TIPO_ICON  = { cita:'📅', pedido:'📦', servicio:'🔧', otro:'📌' };
const TIPO_LABEL = { cita:'Cita', pedido:'Pedido', servicio:'Servicio', otro:'Otro' };

async function loadAgenda() {
  try {
    const data = await sb('agenda', 'GET', null, '?order=fecha.asc,hora.asc');
    agendaItems = Array.isArray(data) ? data : [];
  } catch (e) { agendaItems = []; }
  renderAgenda();
  actualizarBadgeAgenda();
}

function abrirNuevaTarea() {
  editAgId = null;
  document.getElementById('modal-ag-title').textContent = '📋 Nueva tarea';
  document.getElementById('btn-ag').textContent = 'Guardar tarea';
  document.getElementById('ag-tipo').value      = 'cita';
  document.getElementById('ag-prioridad').value = 'normal';
  document.getElementById('ag-titulo').value    = '';
  document.getElementById('ag-cliente').value   = '';
  document.getElementById('ag-desc').value      = '';
  document.getElementById('ag-fecha').value     = '';
  document.getElementById('ag-hora').value      = '';
  openModal('modal-agenda');
}

function editarTarea(id) {
  const t = agendaItems.find(x => x.id === id);
  if (!t) return;
  editAgId = id;
  document.getElementById('modal-ag-title').textContent = '✏️ Editar tarea';
  document.getElementById('btn-ag').textContent = 'Actualizar tarea';
  setSelectVal('ag-tipo',      t.tipo);
  setSelectVal('ag-prioridad', t.prioridad);
  document.getElementById('ag-titulo').value  = t.titulo  || '';
  document.getElementById('ag-cliente').value = t.cliente || '';
  document.getElementById('ag-desc').value    = t.descripcion || '';
  document.getElementById('ag-fecha').value   = t.fecha || '';
  document.getElementById('ag-hora').value    = t.hora  || '';
  openModal('modal-agenda');
}

async function guardarTarea() {
  const titulo = document.getElementById('ag-titulo').value.trim();
  if (!titulo) { toast('El título es obligatorio', 'err'); return; }

  const payload = {
    tipo       : document.getElementById('ag-tipo').value,
    prioridad  : document.getElementById('ag-prioridad').value,
    titulo,
    cliente    : document.getElementById('ag-cliente').value.trim(),
    descripcion: document.getElementById('ag-desc').value.trim(),
    fecha      : document.getElementById('ag-fecha').value,
    hora       : document.getElementById('ag-hora').value,
    estado     : 'pendiente',
  };

  setBtn('btn-ag', true, 'Guardando...');
  try {
    if (editAgId) {
      await sb('agenda', 'PATCH', payload, '?id=eq.' + editAgId);
      const idx = agendaItems.findIndex(x => x.id === editAgId);
      if (idx !== -1) agendaItems[idx] = Object.assign({}, agendaItems[idx], payload);
      toast('Tarea actualizada ✓');
    } else {
      const res = await sb('agenda', 'POST', payload);
      agendaItems.unshift(res[0] || Object.assign({ id: Date.now() }, payload));
      toast('Tarea creada ✓');
    }
    closeModal('modal-agenda');
    renderAgenda();
    actualizarBadgeAgenda();
  } catch (e) { toast('Error: ' + e.message, 'err'); }
  setBtn('btn-ag', false, editAgId ? 'Actualizar tarea' : 'Guardar tarea');
}

async function completarTarea(id) {
  try {
    await sb('agenda', 'PATCH', { estado: 'completado' }, '?id=eq.' + id);
    const t = agendaItems.find(x => x.id === id);
    if (t) t.estado = 'completado';
    renderAgenda();
    actualizarBadgeAgenda();
    toast('Tarea completada ✓');
  } catch (e) { toast('Error', 'err'); }
}

async function eliminarTarea(id) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  try {
    await sb('agenda', 'DELETE', null, '?id=eq.' + id);
    agendaItems = agendaItems.filter(x => x.id !== id);
    renderAgenda();
    actualizarBadgeAgenda();
    toast('Tarea eliminada');
  } catch (e) { toast('Error', 'err'); }
}

function filterAgenda(tipo, el) {
  agFiltroTipo = tipo;
  document.querySelectorAll('#sec-agenda .pill').forEach(function(p) {
    if (!p.id.startsWith('ag-btn')) p.classList.remove('active');
  });
  if (el) el.classList.add('active');
  renderAgenda();
}

function filterAgendaEstado(estado, el) {
  agFiltroEst = estado;
  document.getElementById('ag-btn-pend').classList.toggle('active', estado === 'pendiente');
  document.getElementById('ag-btn-comp').classList.toggle('active', estado === 'completado');
  document.getElementById('ag-btn-pend').style.background = estado === 'pendiente' ? 'var(--green-bg)' : '';
  document.getElementById('ag-btn-pend').style.color      = estado === 'pendiente' ? 'var(--green)'    : '';
  document.getElementById('ag-btn-comp').style.background = estado === 'completado' ? 'var(--green-bg)' : '';
  document.getElementById('ag-btn-comp').style.color      = estado === 'completado' ? 'var(--green)'    : '';
  renderAgenda();
}

function getHoy() {
  return new Date().toISOString().split('T')[0];
}

function renderAgenda() {
  const hoy = getHoy();

  // Stats
  const pendientes  = agendaItems.filter(x => x.estado === 'pendiente');
  const completadas = agendaItems.filter(x => x.estado === 'completado');
  const urgentes    = pendientes.filter(x => x.prioridad === 'urgente');
  const paraHoy     = pendientes.filter(x => x.fecha === hoy);

  const el = function(id) { return document.getElementById(id); };
  if (el('ag-urgentes'))   el('ag-urgentes').textContent   = urgentes.length;
  if (el('ag-hoy'))        el('ag-hoy').textContent        = paraHoy.length;
  if (el('ag-pendientes')) el('ag-pendientes').textContent = pendientes.length;
  if (el('ag-completadas'))el('ag-completadas').textContent= completadas.length;

  // Filtrar
  var lista = agendaItems.filter(function(x) {
    if (x.estado !== agFiltroEst) return false;
    if (agFiltroTipo && x.tipo !== agFiltroTipo) return false;
    return true;
  });

  // Ordenar: urgentes primero, luego por fecha
  lista.sort(function(a, b) {
    if (a.prioridad === 'urgente' && b.prioridad !== 'urgente') return -1;
    if (b.prioridad === 'urgente' && a.prioridad !== 'urgente') return 1;
    if (a.fecha && b.fecha) return a.fecha.localeCompare(b.fecha);
    return 0;
  });

  var container = document.getElementById('ag-lista');
  if (!container) return;

  if (!lista.length) {
    container.innerHTML = '<div style="text-align:center;color:var(--text3);padding:48px">' +
      '<div style="font-size:36px;margin-bottom:12px">📭</div>' +
      (agFiltroEst === 'completado' ? 'No hay tareas completadas.' : 'No hay tareas pendientes. ¡Todo al día!') +
      '</div>';
    return;
  }

  container.innerHTML = lista.map(function(t) {
    var esUrgente = t.prioridad === 'urgente';
    var esHoy     = t.fecha === hoy;
    var esVencida = t.fecha && t.fecha < hoy && t.estado === 'pendiente';
    var completada = t.estado === 'completado';

    var bgColor  = completada ? 'var(--bg3)' : esUrgente || esVencida ? 'rgba(240,107,107,0.08)' : esHoy ? 'rgba(245,184,71,0.08)' : 'var(--bg3)';
    var bdColor  = completada ? 'var(--border)' : esUrgente || esVencida ? 'rgba(240,107,107,0.3)' : esHoy ? 'rgba(245,184,71,0.3)' : 'var(--border)';
    var iconBg   = completada ? 'var(--green-bg)' : esUrgente || esVencida ? 'rgba(240,107,107,0.2)' : esHoy ? 'rgba(245,184,71,0.2)' : 'var(--surface2,var(--bg2))';

    var fechaHora = '';
    if (t.fecha) {
      var d = new Date(t.fecha + 'T00:00:00');
      fechaHora = d.toLocaleDateString('es-CO', { weekday:'short', day:'numeric', month:'short' });
      if (t.hora) fechaHora += ' ' + t.hora;
    }

    var etiqueta = '';
    if (completada) etiqueta = '<span style="font-size:11px;color:var(--green)">✓ Completada</span>';
    else if (esVencida) etiqueta = '<span style="font-size:11px;color:#f06b6b">⚠ Vencida</span>';
    else if (esUrgente) etiqueta = '<span style="font-size:11px;color:#f06b6b">🔴 Urgente</span>';
    else if (esHoy) etiqueta = '<span style="font-size:11px;color:var(--amber)">📅 Hoy</span>';
    else etiqueta = '<span style="font-size:11px;color:var(--text3)">' + (fechaHora || 'Sin fecha') + '</span>';

    return '<div style="background:' + bgColor + ';border:1px solid ' + bdColor + ';border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px' + (completada ? ';opacity:0.6' : '') + '">' +
      '<div style="width:38px;height:38px;border-radius:8px;background:' + iconBg + ';display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">' +
        (completada ? '✅' : (TIPO_ICON[t.tipo] || '📌')) +
      '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">' +
          '<div style="font-size:14px;font-weight:600;' + (completada ? 'text-decoration:line-through;color:var(--text3)' : 'color:var(--text)') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + t.titulo + '</div>' +
          etiqueta +
        '</div>' +
        (t.cliente ? '<div style="font-size:12px;color:var(--text2);margin-top:2px">👤 ' + t.cliente + '</div>' : '') +
        (t.descripcion ? '<div style="font-size:12px;color:var(--text3);margin-top:2px">' + t.descripcion + '</div>' : '') +
        (!completada && fechaHora ? '<div style="font-size:11px;color:var(--text3);margin-top:4px">🕐 ' + fechaHora + '</div>' : '') +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-shrink:0">' +
        (!completada ? '<button class="btn sm" onclick="completarTarea(' + t.id + ')" style="font-size:11px">✓ Listo</button>' : '') +
        '<button class="btn sm" onclick="editarTarea(' + t.id + ')" style="font-size:11px">✏️</button>' +
        '<button class="icon-btn" onclick="eliminarTarea(' + t.id + ')">🗑</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function actualizarBadgeAgenda() {
  var hoy      = getHoy();
  var urgentes = agendaItems.filter(function(x) {
    return x.estado === 'pendiente' && (x.prioridad === 'urgente' || x.fecha <= hoy);
  });
  var count = urgentes.length;
  var badge1 = document.getElementById('ag-badge');
  var badge2 = document.getElementById('nav-ag-badge');
  if (badge1) { badge1.textContent = count; badge1.style.display = count > 0 ? 'inline' : 'none'; }
  if (badge2) { badge2.textContent = count; badge2.style.display = count > 0 ? 'flex' : 'none'; }

  // Notificación del navegador
  if (count > 0 && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('CastellStore — Agenda', {
      body: count + ' tarea(s) urgente(s) o para hoy',
      icon: typeof LOGO_CASTELL_FAVICON !== 'undefined' ? LOGO_CASTELL_FAVICON : ''
    });
  }
}

function pedirPermisosNotificacion() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  pedirPermisosNotificacion();
  // Revisar agenda cada 30 minutos
  setInterval(function() {
    if (agendaItems.length) actualizarBadgeAgenda();
  }, 30 * 60 * 1000);
});
