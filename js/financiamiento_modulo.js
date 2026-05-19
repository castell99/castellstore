// ═══════════════════════════════════════════════════════════
//  financiamiento_modulo.js — Módulo Financiero Inteligente
//  CastellStore · Integrado con estilos y Supabase existentes
// ═══════════════════════════════════════════════════════════

// ── Tablas de tasas por gama y plazo ─────────────────────
const FIN_TASAS = {
  'Entrada': { 2: 12, 3: 18, 5: 25, 6: 30 },
  'Media':   { 2: 10, 3: 15, 5: 22, 6: 28 },
  'Premium': { 2: 12, 3: 18, 5: 28, 6: 35 },
};

const FIN_PLAZOS   = [2, 3, 5, 6];
const FIN_INI_DEF  = 30; // % inicial por defecto

// ── Estado del módulo ─────────────────────────────────────
let equiposFin   = [];          // array de equipos del módulo
let finPlazo     = 3;           // plazo global seleccionado
let finVista     = 'catalogo';  // 'catalogo' | 'tabla'
let editEquipoId = null;        // id en edición

// Etiquetas seleccionadas en el formulario
let efTagsSelected = [];

// ── Colores para etiquetas (usando vars CSS del proyecto) ─
const TAG_STYLE = {
  'Económico':   'green',
  'Más vendido': 'amber',
  'Recomendado': 'blue',
  'Premium':     'muted',
  '5G':          'blue',
};

const GAMA_STYLE = {
  'Entrada':  'green',
  'Media':    'blue',
  'Premium':  'amber',
};

// ─────────────────────────────────────────────────────────
//  Cálculo financiero
// ─────────────────────────────────────────────────────────
function finCalc(equipo, meses, iniPct) {
  const tasa       = (FIN_TASAS[equipo.gama] || FIN_TASAS['Media'])[meses] || 0;
  const financiado = equipo.precio_contado * (1 + tasa / 100);
  const inicial    = financiado * (iniPct / 100);
  const cuota      = (financiado - inicial) / meses;
  return { tasa, financiado, inicial, cuota };
}

function getIniPct() {
  return parseInt(document.getElementById('fin-ini-pct')?.value || FIN_INI_DEF);
}

// ─────────────────────────────────────────────────────────
//  Supabase — CRUD equipos_financiamiento
// ─────────────────────────────────────────────────────────
async function loadEquiposFin() {
  try {
    const data = await sb('equipos_financiamiento', 'GET', null, '?order=id.desc');
    equiposFin = Array.isArray(data) ? data : [];
  } catch (e) {
    // Si la tabla no existe aún, trabajamos en modo local
    equiposFin = equiposFin.length ? equiposFin : [];
    console.warn('equipos_financiamiento:', e.message);
  }
  renderEquipos();
  renderFinStats();
}

async function guardarEquipoFin() {
  const marca    = document.getElementById('ef-marca').value.trim();
  const modelo   = document.getElementById('ef-modelo').value.trim();
  const contado  = parseFloat(document.getElementById('ef-contado').value) || 0;
  if (!marca || !modelo || !contado) {
    toast('Completa marca, modelo y precio contado', 'err');
    return;
  }
  const payload = {
    marca,
    modelo,
    precio_proveedor : parseFloat(document.getElementById('ef-prov').value) || 0,
    precio_contado   : contado,
    ram              : document.getElementById('ef-ram').value.trim(),
    almacenamiento   : document.getElementById('ef-alm').value.trim(),
    g5               : document.getElementById('ef-5g').checked,
    gama             : document.getElementById('ef-gama').value,
    disponible       : document.getElementById('ef-disp').checked,
    etiquetas        : JSON.stringify(efTagsSelected),
  };

  setBtn('btn-ef', true, 'Guardar equipo');
  try {
    if (editEquipoId) {
      await sb('equipos_financiamiento', 'PATCH', payload, `?id=eq.${editEquipoId}`);
      const idx = equiposFin.findIndex(e => e.id === editEquipoId);
      if (idx !== -1) equiposFin[idx] = { ...equiposFin[idx], ...payload };
      toast('Equipo actualizado ✓');
    } else {
      const [eq] = await sb('equipos_financiamiento', 'POST', payload);
      equiposFin.unshift(eq || { ...payload, id: Date.now() });
      toast('Equipo agregado ✓');
    }
  } catch (e) {
    // Fallback local si la tabla no existe en Supabase aún
    if (editEquipoId) {
      const idx = equiposFin.findIndex(x => x.id === editEquipoId);
      if (idx !== -1) equiposFin[idx] = { ...equiposFin[idx], ...payload };
      toast('Equipo actualizado (local) ✓');
    } else {
      equiposFin.unshift({ ...payload, id: Date.now() });
      toast('Equipo agregado (local) ✓');
    }
  }
  setBtn('btn-ef', false, 'Guardar equipo');
  closeModal('modal-equipo-fin');
  renderEquipos();
  renderFinStats();
}

async function eliminarEquipoFin(id) {
  if (!confirm('¿Eliminar este equipo?')) return;
  try {
    await sb('equipos_financiamiento', 'DELETE', null, `?id=eq.${id}`);
  } catch (_) {}
  equiposFin = equiposFin.filter(e => e.id !== id);
  renderEquipos();
  renderFinStats();
  toast('Equipo eliminado');
}

// ─────────────────────────────────────────────────────────
//  Modal — Abrir / Editar equipo
// ─────────────────────────────────────────────────────────
function abrirNuevoEquipo() {
  editEquipoId   = null;
  efTagsSelected = [];
  document.getElementById('modal-eqfin-title').textContent = '📱 Nuevo Equipo';
  document.getElementById('btn-ef').textContent = 'Guardar equipo';
  ['ef-marca','ef-modelo','ef-ram','ef-alm'].forEach(id =>
    document.getElementById(id).value = '');
  document.getElementById('ef-prov').value    = '';
  document.getElementById('ef-contado').value = '';
  document.getElementById('ef-gama').value    = 'Entrada';
  document.getElementById('ef-5g').checked    = false;
  document.getElementById('ef-disp').checked  = true;
  document.querySelectorAll('.ef-tag').forEach(b => b.classList.remove('active'));
  openModal('modal-equipo-fin');
}

function editarEquipoFin(id) {
  const eq = equiposFin.find(e => e.id === id);
  if (!eq) return;
  editEquipoId = id;
  efTagsSelected = typeof eq.etiquetas === 'string'
    ? JSON.parse(eq.etiquetas || '[]')
    : (eq.etiquetas || []);

  document.getElementById('modal-eqfin-title').textContent = '✏️ Editar Equipo';
  document.getElementById('btn-ef').textContent = 'Actualizar equipo';
  document.getElementById('ef-marca').value    = eq.marca || '';
  document.getElementById('ef-modelo').value   = eq.modelo || '';
  document.getElementById('ef-prov').value     = eq.precio_proveedor || '';
  document.getElementById('ef-contado').value  = eq.precio_contado || '';
  document.getElementById('ef-ram').value      = eq.ram || '';
  document.getElementById('ef-alm').value      = eq.almacenamiento || '';
  setSelectVal('ef-gama', eq.gama);
  document.getElementById('ef-5g').checked   = !!eq.g5;
  document.getElementById('ef-disp').checked = eq.disponible !== false;
  document.querySelectorAll('.ef-tag').forEach(b => {
    b.classList.toggle('active', efTagsSelected.includes(b.dataset.tag));
  });
  openModal('modal-equipo-fin');
}

function toggleEfTag(btn) {
  const tag = btn.dataset.tag;
  if (efTagsSelected.includes(tag)) {
    efTagsSelected = efTagsSelected.filter(t => t !== tag);
    btn.classList.remove('active');
  } else {
    efTagsSelected.push(tag);
    btn.classList.add('active');
  }
}

// ─────────────────────────────────────────────────────────
//  Controles de plazo y vista
// ─────────────────────────────────────────────────────────
function setFinPlazo(m, btn) {
  finPlazo = m;
  document.querySelectorAll('.fin-plazo-btn').forEach(b => {
    b.classList.toggle('primary', b === btn);
    b.style.background    = b === btn ? 'var(--green)' : '';
    b.style.borderColor   = b === btn ? 'var(--green)' : '';
    b.style.color         = b === btn ? 'var(--bg)'    : '';
  });
  renderEquipos();
}

function setFinVista(v) {
  finVista = v;
  document.getElementById('fin-vista-catalogo').style.display = v === 'catalogo' ? '' : 'none';
  document.getElementById('fin-vista-tabla').style.display    = v === 'tabla'    ? '' : 'none';
  const bCat = document.getElementById('fin-v-cat');
  const bTbl = document.getElementById('fin-v-tbl');
  if (bCat && bTbl) {
    bCat.style.background = v === 'catalogo' ? 'var(--green)' : 'transparent';
    bCat.style.color      = v === 'catalogo' ? 'var(--bg)'    : 'var(--text2)';
    bTbl.style.background = v === 'tabla'    ? 'var(--green)' : 'transparent';
    bTbl.style.color      = v === 'tabla'    ? 'var(--bg)'    : 'var(--text2)';
  }
}

// ─────────────────────────────────────────────────────────
//  Filtrar equipos
// ─────────────────────────────────────────────────────────
function getEquiposFiltrados() {
  const q     = (document.getElementById('fin-search')?.value || '').toLowerCase();
  const marca = document.getElementById('fin-f-marca')?.value || '';
  const gama  = document.getElementById('fin-f-gama')?.value || '';
  const g5    = document.getElementById('fin-f-5g')?.value || '';

  return equiposFin.filter(eq => {
    if (marca && eq.marca !== marca) return false;
    if (gama  && eq.gama  !== gama)  return false;
    if (g5 === 'si' && !eq.g5)  return false;
    if (g5 === 'no' &&  eq.g5)  return false;
    if (q && !`${eq.marca} ${eq.modelo}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function actualizarSelectMarcas() {
  const sel = document.getElementById('fin-f-marca');
  if (!sel) return;
  const marcas = [...new Set(equiposFin.map(e => e.marca).filter(Boolean))];
  const actual = sel.value;
  sel.innerHTML = '<option value="">Todas las marcas</option>' +
    marcas.map(m => `<option${m === actual ? ' selected' : ''}>${m}</option>`).join('');
}

// ─────────────────────────────────────────────────────────
//  Stats superiores
// ─────────────────────────────────────────────────────────
function renderFinStats() {
  const total = equiposFin.length;
  const disp  = equiposFin.filter(e => e.disponible !== false).length;
  const con5g = equiposFin.filter(e => e.g5).length;
  const avg   = total
    ? equiposFin.reduce((s, e) => s + (parseFloat(e.precio_contado) || 0), 0) / total
    : 0;
  const el = id => document.getElementById(id);
  if (el('fin-total')) el('fin-total').textContent = total;
  if (el('fin-disp'))  el('fin-disp').textContent  = disp;
  if (el('fin-5g'))    el('fin-5g').textContent    = con5g;
  if (el('fin-avg'))   el('fin-avg').textContent   = total ? fmt(Math.round(avg)) : '—';
}

// ─────────────────────────────────────────────────────────
//  Render — Catálogo
// ─────────────────────────────────────────────────────────
function renderEquipos() {
  actualizarSelectMarcas();
  const lista  = getEquiposFiltrados();
  const iniPct = getIniPct();

  // — Catálogo —
  const grid = document.getElementById('fin-grid');
  if (grid) {
    if (!lista.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:48px">
        <div style="font-size:36px;margin-bottom:12px">📭</div>
        No se encontraron equipos. ¡Agrega el primero!
      </div>`;
    } else {
      grid.innerHTML = lista.map(eq => renderEquipoCard(eq, finPlazo, iniPct)).join('');
    }
  }

  // — Tabla —
  const tbody = document.getElementById('fin-tbody');
  const th    = document.getElementById('fin-th-fin');
  if (tbody) {
    if (th) th.textContent = `Financiado (${finPlazo}m)`;
    if (!lista.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="9">No hay equipos. Agrega el primero.</td></tr>`;
    } else {
      tbody.innerHTML = lista.map(eq => renderEquipoFila(eq, finPlazo, iniPct)).join('');
    }
  }
}

function etiquetaHtml(tag) {
  const cl = TAG_STYLE[tag] || 'muted';
  return `<span class="badge ${cl}" style="font-size:10px">${tag}</span>`;
}

function gamaBadge(gama) {
  const cl = GAMA_STYLE[gama] || 'muted';
  return `<span class="badge ${cl}">${gama}</span>`;
}

function renderEquipoCard(eq, meses, iniPct) {
  const f    = finCalc(eq, meses, iniPct);
  const tags = (typeof eq.etiquetas === 'string'
    ? JSON.parse(eq.etiquetas || '[]')
    : (eq.etiquetas || []));

  return `
  <div class="prod-card${eq.disponible === false ? ' agotado' : ''}"
       style="cursor:pointer;position:relative"
       onclick="abrirDetalleCuotas(${eq.id})">

    <!-- Imagen / icono -->
    <div class="prod-img">
      <span style="font-size:44px">📱</span>
      ${eq.disponible === false
        ? `<div class="stock-tag"><span class="badge red">Sin stock</span></div>`
        : `<div class="stock-tag"><span class="badge green">Disponible</span></div>`}
    </div>

    <div class="prod-body">
      <!-- Gama + 5G -->
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px">
        ${gamaBadge(eq.gama)}
        ${eq.g5 ? `<span class="badge blue" style="font-size:10px">5G</span>` : ''}
      </div>

      <!-- Nombre -->
      <div class="prod-cat">${eq.marca || ''}</div>
      <div class="prod-name">${eq.modelo || ''}</div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:8px">
        ${[eq.ram, eq.almacenamiento].filter(Boolean).join(' · ')}
      </div>

      <!-- Precios -->
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px">
        <span style="font-size:11px;color:var(--text3)">Contado</span>
        <span style="font-size:13px;font-weight:600;font-family:var(--mono)">${fmt(eq.precio_contado)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px">
        <span style="font-size:11px;color:var(--text3)">${meses}m (+${f.tasa}%)</span>
        <span class="prod-price" style="font-size:16px;margin-bottom:0">${fmt(Math.round(f.financiado))}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
        <span style="font-size:11px;color:var(--text3)">Cuota/mes</span>
        <span style="font-size:14px;font-weight:700;color:var(--green);font-family:var(--mono)">${fmt(Math.round(f.cuota))}</span>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:10px">
        Inicial (${iniPct}%): <span style="color:var(--amber);font-weight:600">${fmt(Math.round(f.inicial))}</span>
      </div>

      <!-- Etiquetas -->
      ${tags.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px">
        ${tags.map(etiquetaHtml).join('')}
      </div>` : ''}

      <!-- Acciones -->
      <div style="display:flex;gap:6px" onclick="event.stopPropagation()">
        <button class="btn sm" style="flex:1;justify-content:center"
          onclick="editarEquipoFin(${eq.id})">✏️ Editar</button>
        <button class="icon-btn" onclick="eliminarEquipoFin(${eq.id})">🗑</button>
      </div>
    </div>
  </div>`;
}

function renderEquipoFila(eq, meses, iniPct) {
  const f    = finCalc(eq, meses, iniPct);
  const tags = (typeof eq.etiquetas === 'string'
    ? JSON.parse(eq.etiquetas || '[]')
    : (eq.etiquetas || []));

  return `<tr style="cursor:pointer" onclick="abrirDetalleCuotas(${eq.id})">
    <td>
      <div style="font-weight:600">📱 ${eq.marca} ${eq.modelo}</div>
      <div style="font-size:11px;color:var(--text3)">${[eq.ram,eq.almacenamiento].filter(Boolean).join(' · ')}</div>
      ${tags.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">${tags.map(etiquetaHtml).join('')}</div>` : ''}
    </td>
    <td>${gamaBadge(eq.gama)}</td>
    <td style="font-family:var(--mono);font-weight:600">${fmt(eq.precio_contado)}</td>
    <td style="font-family:var(--mono);font-weight:700;color:var(--green)">${fmt(Math.round(f.financiado))}</td>
    <td style="font-family:var(--mono);color:var(--amber)">${fmt(Math.round(f.inicial))}</td>
    <td style="font-family:var(--mono);color:var(--green);font-weight:700">${fmt(Math.round(f.cuota))}</td>
    <td>${eq.g5 ? '<span class="badge blue">5G ✓</span>' : '<span class="badge muted">No</span>'}</td>
    <td>
      <span class="badge ${eq.disponible !== false ? 'green' : 'red'}">
        ${eq.disponible !== false ? 'Disponible' : 'Sin stock'}
      </span>
    </td>
    <td onclick="event.stopPropagation()" style="white-space:nowrap">
      <button class="btn sm" onclick="editarEquipoFin(${eq.id})">✏️</button>
      <button class="icon-btn" onclick="eliminarEquipoFin(${eq.id})">🗑</button>
    </td>
  </tr>`;
}

// ─────────────────────────────────────────────────────────
//  Modal detalle de cuotas
// ─────────────────────────────────────────────────────────
function abrirDetalleCuotas(id) {
  const eq = equiposFin.find(e => e.id === id);
  if (!eq) return;

  // Estado local del modal (plazo e inicial ajustables dentro del modal)
  let mLocal   = finPlazo;
  let iniLocal = getIniPct();

  function renderBody() {
    const f = finCalc(eq, mLocal, iniLocal);
    const tags = (typeof eq.etiquetas === 'string'
      ? JSON.parse(eq.etiquetas || '[]')
      : (eq.etiquetas || []));

    // Tabla de cuotas
    const filas = Array.from({ length: mLocal }, (_, i) => `
      <tr>
        <td style="text-align:center;font-weight:600">#${i+1}</td>
        <td style="font-family:var(--mono);color:var(--green);font-weight:700;text-align:right">${fmt(Math.round(f.cuota))}</td>
        <td style="font-family:var(--mono);text-align:right">${fmt(Math.round(f.inicial + f.cuota*(i+1)))}</td>
      </tr>`).join('');

    return `
      <!-- Encabezado del equipo -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        ${gamaBadge(eq.gama)}
        ${eq.g5 ? '<span class="badge blue" style="font-size:10px">5G</span>' : ''}
        ${tags.map(etiquetaHtml).join('')}
      </div>
      <div style="font-size:13px;color:var(--text2)">${eq.marca}</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:4px">${eq.modelo}</div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:16px">
        ${[eq.ram,eq.almacenamiento].filter(Boolean).join(' · ')}
      </div>

      <!-- Selector de plazo -->
      <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
        ${FIN_PLAZOS.map(m => `
          <button onclick="(function(){window.__finM=${m};renderModalCuotas(${id});})()"
            class="btn sm${m===mLocal?' primary':''}"
            id="cq-btn-${m}">${m} meses</button>`).join('')}
      </div>

      <!-- Slider inicial -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span style="font-size:12px;color:var(--text2);white-space:nowrap">Inicial:</span>
        <input type="range" min="10" max="70" value="${iniLocal}"
          oninput="window.__finIni=parseInt(this.value);document.getElementById('cq-ini-lbl').textContent=this.value+'%';renderModalCuotas(${id})"
          style="flex:1;accent-color:var(--green)">
        <span id="cq-ini-lbl" style="font-size:13px;color:var(--green);font-weight:700;min-width:34px">${iniLocal}%</span>
      </div>

      <!-- Resumen financiero -->
      <div class="fin-card" style="margin-bottom:14px">
        <div class="fin-hero">
          <div class="fin-lbl">Precio contado</div>
          <div style="font-size:14px;font-family:var(--mono);color:var(--text2)">${fmt(eq.precio_contado)}</div>
          <div class="fin-lbl" style="margin-top:6px">Precio financiado (+${f.tasa}%)</div>
          <div class="fin-amount">${fmt(Math.round(f.financiado))}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid var(--border)">
          <div style="padding:14px;border-right:1px solid var(--border)">
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">Inicial (${iniLocal}%)</div>
            <div style="font-size:18px;font-weight:700;font-family:var(--mono);color:var(--amber)">${fmt(Math.round(f.inicial))}</div>
          </div>
          <div style="padding:14px">
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">Cuota mensual</div>
            <div style="font-size:18px;font-weight:700;font-family:var(--mono);color:var(--green)">${fmt(Math.round(f.cuota))}</div>
          </div>
        </div>
      </div>

      <!-- Tabla de cuotas -->
      <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.6px">
        Tabla de cuotas
      </div>
      <div class="table-wrap" style="border-radius:var(--radius);margin-bottom:12px">
        <table>
          <thead>
            <tr>
              <th style="text-align:center">Cuota</th>
              <th style="text-align:right">Monto</th>
              <th style="text-align:right">Acumulado</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
      <div style="font-size:11px;color:var(--text3);text-align:center">
        Tasa aplicada: ${f.tasa}% · Gama ${eq.gama}
      </div>`;
  }

  // Exponer estado al scope global para que los botones inline funcionen
  window.__finM   = mLocal;
  window.__finIni = iniLocal;
  window.renderModalCuotas = function(eid) {
    mLocal   = window.__finM;
    iniLocal = window.__finIni;
    document.getElementById('modal-cq-body').innerHTML = renderBody();
  };

  document.getElementById('modal-cq-title').textContent = `💳 ${eq.marca} ${eq.modelo}`;
  document.getElementById('modal-cq-body').innerHTML    = renderBody();
  openModal('modal-cuotas-fin');
}

// ─────────────────────────────────────────────────────────
//  CSS adicional para el módulo (inyectado una vez)
// ─────────────────────────────────────────────────────────
(function injectFinStyles() {
  const s = document.createElement('style');
  s.textContent = `
    .active-plazo,
    .fin-plazo-btn.primary {
      background: var(--green) !important;
      border-color: var(--green) !important;
      color: var(--bg) !important;
    }
    #fin-vista-tabla .table-wrap {
      border: none;
    }
  `;
  document.head.appendChild(s);
})();

// ─────────────────────────────────────────────────────────
//  Inicialización — se llama al entrar a la sección
// ─────────────────────────────────────────────────────────
// Sobreescribimos showSec para enganchar la carga del módulo
const _origShowSec = typeof showSec === 'function' ? showSec : null;

// Polyfill: si showSec no está definida aún, la definimos al cargar
document.addEventListener('DOMContentLoaded', () => {
  // Carga inicial al abrir la sección de financiamiento
  const btnFin = document.querySelector('[onclick*="showSec(\'financiamiento\'"]');
  if (btnFin) {
    const origOnclick = btnFin.getAttribute('onclick');
    btnFin.setAttribute('onclick', origOnclick + ';if(!equiposFin.length)loadEquiposFin();');
  }

  // Inicializar plazo activo visualmente
  const btn3 = document.querySelector('.fin-plazo-btn[data-m="3"]');
  if (btn3) {
    btn3.style.background  = 'var(--green)';
    btn3.style.borderColor = 'var(--green)';
    btn3.style.color       = 'var(--bg)';
  }
});
