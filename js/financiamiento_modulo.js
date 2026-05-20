// ═══════════════════════════════════════════════════════════
//  financiamiento_modulo.js — Módulo Financiero Inteligente
//  CastellStore · Con imágenes reales desde Supabase Storage
// ═══════════════════════════════════════════════════════════

const FIN_TASAS = {
  'Entrada': { 2: 12, 3: 18, 5: 25, 6: 30 },
  'Media':   { 2: 10, 3: 15, 5: 22, 6: 28 },
  'Premium': { 2: 12, 3: 18, 5: 28, 6: 35 },
};

const FIN_PLAZOS  = [2, 3, 5, 6];
const FIN_INI_DEF = 30;

let equiposFin   = [];
let finPlazo     = 3;
let finVista     = 'catalogo';
let editEquipoId = null;
let efTagsSelected = [];
let efImg1Url = null;
let efImg2Url = null;

const TAG_STYLE  = { 'Económico':'green','Más vendido':'amber','Recomendado':'blue','Premium':'muted','5G':'blue' };
const GAMA_STYLE = { 'Entrada':'green','Media':'blue','Premium':'amber' };

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

async function subirImagenEquipo(file, slot) {
  const ext    = file.name.split('.').pop();
  const nombre = `equipo_${Date.now()}_${slot}.${ext}`;
  const SUPABASE_URL = SUPA;
  const SUPABASE_KEY = KEY;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/equipos-imagenes/${nombre}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type, 'x-upsert': 'true' },
    body: file,
  });
  if (!res.ok) throw new Error('Error subiendo imagen');
  return `${SUPABASE_URL}/storage/v1/object/public/equipos-imagenes/${nombre}`;
}

function previsualizarImagen(input, slot) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById(`ef-prev${slot}`);
    if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
  if (slot === 1) window._efFile1 = file;
  if (slot === 2) window._efFile2 = file;
}

async function loadEquiposFin() {
  try {
    const data = await sb('equipos_financiamiento', 'GET', null, '?order=id.desc');
    equiposFin = Array.isArray(data) ? data : [];
  } catch (e) {
    equiposFin = [];
    console.warn('equipos_financiamiento:', e.message);
  }
  renderEquipos();
  renderFinStats();
}

async function guardarEquipoFin() {
  const marca   = document.getElementById('ef-marca').value.trim();
  const modelo  = document.getElementById('ef-modelo').value.trim();
  const contado = parseFloat(document.getElementById('ef-contado').value) || 0;
  if (!marca || !modelo || !contado) { toast('Completa marca, modelo y precio contado', 'err'); return; }

  setBtn('btn-ef', true, 'Guardando...');
  let img1 = efImg1Url, img2 = efImg2Url;
  try {
    if (window._efFile1) img1 = await subirImagenEquipo(window._efFile1, 1);
    if (window._efFile2) img2 = await subirImagenEquipo(window._efFile2, 2);
  } catch (e) {
    toast('Error subiendo imagen', 'err');
    setBtn('btn-ef', false, 'Guardar equipo');
    return;
  }

  const payload = {
    marca, modelo,
    precio_proveedor : parseFloat(document.getElementById('ef-prov').value) || 0,
    precio_contado   : contado,
    ram              : document.getElementById('ef-ram').value.trim(),
    almacenamiento   : document.getElementById('ef-alm').value.trim(),
    g5               : document.getElementById('ef-5g').checked,
    gama             : document.getElementById('ef-gama').value,
    disponible       : document.getElementById('ef-disp').checked,
    etiquetas        : JSON.stringify(efTagsSelected),
    imagen1          : img1 || null,
    imagen2          : img2 || null,
  };

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
    if (editEquipoId) {
      const idx = equiposFin.findIndex(x => x.id === editEquipoId);
      if (idx !== -1) equiposFin[idx] = { ...equiposFin[idx], ...payload };
    } else {
      equiposFin.unshift({ ...payload, id: Date.now() });
    }
    toast('Guardado localmente ✓');
  }

  setBtn('btn-ef', false, 'Guardar equipo');
  closeModal('modal-equipo-fin');
  renderEquipos();
  renderFinStats();
}

async function eliminarEquipoFin(id) {
  if (!confirm('¿Eliminar este equipo?')) return;
  try { await sb('equipos_financiamiento', 'DELETE', null, `?id=eq.${id}`); } catch (_) {}
  equiposFin = equiposFin.filter(e => e.id !== id);
  renderEquipos(); renderFinStats();
  toast('Equipo eliminado');
}

async function importarDesdeInventario() {
  try {
    const productos = await sb('productos', 'GET', null, '?order=id.asc');
    if (!productos || !productos.length) { toast('No hay productos en el inventario', 'err'); return; }
    const idsExistentes = new Set(equiposFin.map(e => e.producto_id).filter(Boolean));
    const nuevos = productos.filter(p => !idsExistentes.has(p.id));
    if (!nuevos.length) { toast('Todos los productos ya están importados', 'err'); return; }
    for (const p of nuevos) {
      const partes = (p.nombre || '').split(' ');
      const marca  = partes[0] || 'Sin marca';
      const modelo = partes.slice(1).join(' ') || p.nombre;
      const payload = {
        producto_id: p.id, marca, modelo,
        precio_proveedor: 0, precio_contado: parseFloat(p.precio) || 0,
        ram: '', almacenamiento: '', g5: false, gama: 'Media',
        disponible: (p.stock || 0) > 0, etiquetas: '[]', imagen1: null, imagen2: null,
      };
      try { const [eq] = await sb('equipos_financiamiento', 'POST', payload); equiposFin.unshift(eq || { ...payload, id: Date.now() }); } catch (_) {}
    }
    toast(`${nuevos.length} producto(s) importado(s) ✓`);
    renderEquipos(); renderFinStats();
  } catch (e) { toast('Error al importar', 'err'); }
}

function abrirNuevoEquipo() {
  editEquipoId = null; efTagsSelected = []; efImg1Url = null; efImg2Url = null;
  window._efFile1 = null; window._efFile2 = null;
  document.getElementById('modal-eqfin-title').textContent = '📱 Nuevo Equipo';
  document.getElementById('btn-ef').textContent = 'Guardar equipo';
  ['ef-marca','ef-modelo','ef-ram','ef-alm'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ef-prov').value = ''; document.getElementById('ef-contado').value = '';
  document.getElementById('ef-gama').value = 'Entrada';
  document.getElementById('ef-5g').checked = false; document.getElementById('ef-disp').checked = true;
  document.querySelectorAll('.ef-tag').forEach(b => b.classList.remove('active'));
  ['ef-prev1','ef-prev2'].forEach(id => { const el = document.getElementById(id); if (el) { el.src=''; el.style.display='none'; } });
  openModal('modal-equipo-fin');
}

function editarEquipoFin(id) {
  const eq = equiposFin.find(e => e.id === id); if (!eq) return;
  editEquipoId = id; efImg1Url = eq.imagen1||null; efImg2Url = eq.imagen2||null;
  window._efFile1 = null; window._efFile2 = null;
  efTagsSelected = typeof eq.etiquetas === 'string' ? JSON.parse(eq.etiquetas||'[]') : (eq.etiquetas||[]);
  document.getElementById('modal-eqfin-title').textContent = '✏️ Editar Equipo';
  document.getElementById('btn-ef').textContent = 'Actualizar equipo';
  document.getElementById('ef-marca').value   = eq.marca||'';
  document.getElementById('ef-modelo').value  = eq.modelo||'';
  document.getElementById('ef-prov').value    = eq.precio_proveedor||'';
  document.getElementById('ef-contado').value = eq.precio_contado||'';
  document.getElementById('ef-ram').value     = eq.ram||'';
  document.getElementById('ef-alm').value     = eq.almacenamiento||'';
  setSelectVal('ef-gama', eq.gama);
  document.getElementById('ef-5g').checked   = !!eq.g5;
  document.getElementById('ef-disp').checked = eq.disponible !== false;
  document.querySelectorAll('.ef-tag').forEach(b => b.classList.toggle('active', efTagsSelected.includes(b.dataset.tag)));
  ['1','2'].forEach(n => {
    const prev = document.getElementById(`ef-prev${n}`); const url = eq[`imagen${n}`];
    if (prev && url) { prev.src=url; prev.style.display='block'; }
    else if (prev)   { prev.src=''; prev.style.display='none'; }
  });
  openModal('modal-equipo-fin');
}

function toggleEfTag(btn) {
  const tag = btn.dataset.tag;
  if (efTagsSelected.includes(tag)) { efTagsSelected = efTagsSelected.filter(t=>t!==tag); btn.classList.remove('active'); }
  else { efTagsSelected.push(tag); btn.classList.add('active'); }
}

function setFinPlazo(m, btn) {
  finPlazo = m;
  document.querySelectorAll('.fin-plazo-btn').forEach(b => {
    const on = b===btn;
    b.style.background=on?'var(--green)':''; b.style.borderColor=on?'var(--green)':''; b.style.color=on?'var(--bg)':'';
  });
  renderEquipos();
}

function setFinVista(v) {
  finVista = v;
  document.getElementById('fin-vista-catalogo').style.display = v==='catalogo'?'':'none';
  document.getElementById('fin-vista-tabla').style.display    = v==='tabla'?'':'none';
  const bCat=document.getElementById('fin-v-cat'), bTbl=document.getElementById('fin-v-tbl');
  if (bCat&&bTbl) {
    bCat.style.background=v==='catalogo'?'var(--green)':'transparent'; bCat.style.color=v==='catalogo'?'var(--bg)':'var(--text2)';
    bTbl.style.background=v==='tabla'?'var(--green)':'transparent';    bTbl.style.color=v==='tabla'?'var(--bg)':'var(--text2)';
  }
}

function getEquiposFiltrados() {
  const q=( document.getElementById('fin-search')?.value||'').toLowerCase();
  const marca=document.getElementById('fin-f-marca')?.value||'';
  const gama=document.getElementById('fin-f-gama')?.value||'';
  const g5=document.getElementById('fin-f-5g')?.value||'';
  return equiposFin.filter(eq => {
    if (marca && eq.marca!==marca) return false;
    if (gama  && eq.gama!==gama)  return false;
    if (g5==='si' && !eq.g5) return false;
    if (g5==='no' &&  eq.g5) return false;
    if (q && !`${eq.marca} ${eq.modelo}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function actualizarSelectMarcas() {
  const sel=document.getElementById('fin-f-marca'); if (!sel) return;
  const marcas=[...new Set(equiposFin.map(e=>e.marca).filter(Boolean))];
  const actual=sel.value;
  sel.innerHTML='<option value="">Todas las marcas</option>'+marcas.map(m=>`<option${m===actual?' selected':''}>${m}</option>`).join('');
}

function renderFinStats() {
  const total=equiposFin.length;
  const disp=equiposFin.filter(e=>e.disponible!==false).length;
  const con5g=equiposFin.filter(e=>e.g5).length;
  const avg=total?equiposFin.reduce((s,e)=>s+(parseFloat(e.precio_contado)||0),0)/total:0;
  const el=id=>document.getElementById(id);
  if(el('fin-total')) el('fin-total').textContent=total;
  if(el('fin-disp'))  el('fin-disp').textContent=disp;
  if(el('fin-5g'))    el('fin-5g').textContent=con5g;
  if(el('fin-avg'))   el('fin-avg').textContent=total?fmt(Math.round(avg)):'—';
}

function etiquetaHtml(tag) { return `<span class="badge ${TAG_STYLE[tag]||'muted'}" style="font-size:10px">${tag}</span>`; }
function gamaBadge(gama)   { return `<span class="badge ${GAMA_STYLE[gama]||'muted'}">${gama}</span>`; }

function renderEquipos() {
  actualizarSelectMarcas();
  const lista=getEquiposFiltrados(), iniPct=getIniPct();
  const grid=document.getElementById('fin-grid');
  if (grid) grid.innerHTML=!lista.length
    ? `<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:48px"><div style="font-size:36px;margin-bottom:12px">📭</div>No se encontraron equipos.</div>`
    : lista.map(eq=>renderEquipoCard(eq,finPlazo,iniPct)).join('');
  const tbody=document.getElementById('fin-tbody'), th=document.getElementById('fin-th-fin');
  if (tbody) {
    if(th) th.textContent=`Financiado (${finPlazo}m)`;
    tbody.innerHTML=!lista.length
      ? `<tr class="empty-row"><td colspan="9">No hay equipos.</td></tr>`
      : lista.map(eq=>renderEquipoFila(eq,finPlazo,iniPct)).join('');
  }
}

function renderEquipoCard(eq, meses, iniPct) {
  const f=finCalc(eq,meses,iniPct);
  const tags=typeof eq.etiquetas==='string'?JSON.parse(eq.etiquetas||'[]'):(eq.etiquetas||[]);
  let imgSection='';
  if (eq.imagen1 && eq.imagen2) {
    imgSection=`<div style="position:relative;overflow:hidden;border-radius:var(--radius) var(--radius) 0 0;height:160px;cursor:pointer" onclick="toggleCardImg(this)">
      <img src="${eq.imagen1}" data-img1="${eq.imagen1}" data-img2="${eq.imagen2}" style="width:100%;height:160px;object-fit:cover;transition:opacity .3s" onerror="this.style.display='none'">
      <div style="position:absolute;bottom:6px;right:8px;background:rgba(0,0,0,.5);color:#fff;font-size:10px;padding:2px 7px;border-radius:10px">1/2 · toca para ver otra</div>
    </div>`;
  } else if (eq.imagen1) {
    imgSection=`<div style="height:160px;overflow:hidden;border-radius:var(--radius) var(--radius) 0 0">
      <img src="${eq.imagen1}" style="width:100%;height:160px;object-fit:cover" onerror="this.parentElement.innerHTML='<div style=height:160px;display:flex;align-items:center;justify-content:center;font-size:48px;background:var(--surface2)>📱</div>'">
    </div>`;
  } else {
    imgSection=`<div style="height:160px;display:flex;align-items:center;justify-content:center;font-size:48px;background:var(--surface2);border-radius:var(--radius) var(--radius) 0 0">📱</div>`;
  }

  return `<div class="prod-card${eq.disponible===false?' agotado':''}" style="padding:0;position:relative">
    <div onclick="abrirDetalleCuotas(${eq.id})" style="position:relative;cursor:pointer">
      ${imgSection}
      <div style="position:absolute;top:8px;left:8px">${eq.disponible===false?'<span class="badge red">Sin stock</span>':'<span class="badge green">Disponible</span>'}</div>
    </div>
    <div class="prod-body" onclick="abrirDetalleCuotas(${eq.id})" style="cursor:pointer">
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px">${gamaBadge(eq.gama)}${eq.g5?'<span class="badge blue" style="font-size:10px">5G</span>':''}</div>
      <div class="prod-cat">${eq.marca||''}</div>
      <div class="prod-name">${eq.modelo||''}</div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:8px">${[eq.ram,eq.almacenamiento].filter(Boolean).join(' · ')}</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:2px">
        <span style="font-size:11px;color:var(--text3)">Contado</span>
        <span style="font-size:13px;font-weight:600;font-family:var(--mono)">${fmt(eq.precio_contado)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:2px">
        <span style="font-size:11px;color:var(--text3)">${meses}m (+${f.tasa}%)</span>
        <span class="prod-price" style="font-size:16px;margin-bottom:0">${fmt(Math.round(f.financiado))}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <span style="font-size:11px;color:var(--text3)">Cuota/mes</span>
        <span style="font-size:14px;font-weight:700;color:var(--green);font-family:var(--mono)">${fmt(Math.round(f.cuota))}</span>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:10px">Inicial (${iniPct}%): <span style="color:var(--amber);font-weight:600">${fmt(Math.round(f.inicial))}</span></div>
      ${tags.length?`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px">${tags.map(etiquetaHtml).join('')}</div>`:''}
    </div>
    <div style="display:flex;gap:6px;padding:0 14px 14px">
      <button class="btn sm" style="flex:1;justify-content:center" onclick="editarEquipoFin(${eq.id})">✏️ Editar</button>
      <button class="icon-btn" onclick="eliminarEquipoFin(${eq.id})">🗑</button>
    </div>
  </div>`;
}

function toggleCardImg(container) {
  const img=container.querySelector('img'), lbl=container.querySelector('div');
  if (!img) return;
  const showing=img.dataset.showing||'1';
  if (showing==='1') { img.src=img.dataset.img2; img.dataset.showing='2'; if(lbl) lbl.textContent='2/2 · toca para ver otra'; }
  else               { img.src=img.dataset.img1; img.dataset.showing='1'; if(lbl) lbl.textContent='1/2 · toca para ver otra'; }
}

function renderEquipoFila(eq, meses, iniPct) {
  const f=finCalc(eq,meses,iniPct);
  const tags=typeof eq.etiquetas==='string'?JSON.parse(eq.etiquetas||'[]'):(eq.etiquetas||[]);
  const thumb=eq.imagen1?`<img src="${eq.imagen1}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;margin-right:8px;vertical-align:middle">`:`<span style="margin-right:8px;font-size:24px">📱</span>`;
  return `<tr style="cursor:pointer" onclick="abrirDetalleCuotas(${eq.id})">
    <td><div style="display:flex;align-items:center">${thumb}<div>
      <div style="font-weight:600">${eq.marca} ${eq.modelo}</div>
      <div style="font-size:11px;color:var(--text3)">${[eq.ram,eq.almacenamiento].filter(Boolean).join(' · ')}</div>
      ${tags.length?`<div style="display:flex;gap:4px;margin-top:4px">${tags.map(etiquetaHtml).join('')}</div>`:''}
    </div></div></td>
    <td>${gamaBadge(eq.gama)}</td>
    <td style="font-family:var(--mono);font-weight:600">${fmt(eq.precio_contado)}</td>
    <td style="font-family:var(--mono);font-weight:700;color:var(--green)">${fmt(Math.round(f.financiado))}</td>
    <td style="font-family:var(--mono);color:var(--amber)">${fmt(Math.round(f.inicial))}</td>
    <td style="font-family:var(--mono);color:var(--green);font-weight:700">${fmt(Math.round(f.cuota))}</td>
    <td>${eq.g5?'<span class="badge blue">5G ✓</span>':'<span class="badge muted">No</span>'}</td>
    <td><span class="badge ${eq.disponible!==false?'green':'red'}">${eq.disponible!==false?'Disponible':'Sin stock'}</span></td>
    <td onclick="event.stopPropagation()" style="white-space:nowrap">
      <button class="btn sm" onclick="editarEquipoFin(${eq.id})">✏️</button>
      <button class="icon-btn" onclick="eliminarEquipoFin(${eq.id})">🗑</button>
    </td>
  </tr>`;
}

function abrirDetalleCuotas(id) {
  const eq=equiposFin.find(e=>e.id===id); if (!eq) return;
  let mLocal=finPlazo, iniLocal=getIniPct();

  function renderBody() {
    const f=finCalc(eq,mLocal,iniLocal);
    const tags=typeof eq.etiquetas==='string'?JSON.parse(eq.etiquetas||'[]'):(eq.etiquetas||[]);
    const filas=Array.from({length:mLocal},(_,i)=>`<tr>
      <td style="text-align:center;font-weight:600">#${i+1}</td>
      <td style="font-family:var(--mono);color:var(--green);font-weight:700;text-align:right">${fmt(Math.round(f.cuota))}</td>
      <td style="font-family:var(--mono);text-align:right">${fmt(Math.round(f.inicial+f.cuota*(i+1)))}</td>
    </tr>`).join('');
    let galeriaHtml='';
    if (eq.imagen1||eq.imagen2) {
      galeriaHtml=`<div style="display:flex;gap:8px;margin-bottom:16px">
        ${eq.imagen1?`<img src="${eq.imagen1}" style="flex:1;height:140px;object-fit:cover;border-radius:var(--radius);cursor:pointer" onclick="window.open('${eq.imagen1}','_blank')">`:'' }
        ${eq.imagen2?`<img src="${eq.imagen2}" style="flex:1;height:140px;object-fit:cover;border-radius:var(--radius);cursor:pointer" onclick="window.open('${eq.imagen2}','_blank')">`:'' }
      </div>`;
    }
    return `${galeriaHtml}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">${gamaBadge(eq.gama)}${eq.g5?'<span class="badge blue">5G</span>':''}${tags.map(etiquetaHtml).join('')}</div>
      <div style="font-size:13px;color:var(--text2)">${eq.marca}</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:4px">${eq.modelo}</div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:16px">${[eq.ram,eq.almacenamiento].filter(Boolean).join(' · ')}</div>
      <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
        ${FIN_PLAZOS.map(m=>`<button onclick="window.__finM=${m};renderModalCuotas(${id})" class="btn sm${m===mLocal?' primary':''}">${m} meses</button>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span style="font-size:12px;color:var(--text2);white-space:nowrap">Inicial:</span>
        <input type="range" min="10" max="70" value="${iniLocal}" oninput="window.__finIni=parseInt(this.value);document.getElementById('cq-ini-lbl').textContent=this.value+'%';renderModalCuotas(${id})" style="flex:1;accent-color:var(--green)">
        <span id="cq-ini-lbl" style="font-size:13px;color:var(--green);font-weight:700;min-width:34px">${iniLocal}%</span>
      </div>
      <div class="fin-card" style="margin-bottom:14px">
        <div class="fin-hero">
          <div class="fin-lbl">Precio contado</div>
          <div style="font-size:14px;font-family:var(--mono);color:var(--text2)">${fmt(eq.precio_contado)}</div>
          <div class="fin-lbl" style="margin-top:6px">Precio financiado (+${f.tasa}%)</div>
          <div class="fin-amount">${fmt(Math.round(f.financiado))}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--border)">
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
      <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.6px">Tabla de cuotas</div>
      <div class="table-wrap" style="border-radius:var(--radius);margin-bottom:12px">
        <table><thead><tr>
          <th style="text-align:center">Cuota</th>
          <th style="text-align:right">Monto</th>
          <th style="text-align:right">Acumulado</th>
        </tr></thead><tbody>${filas}</tbody></table>
      </div>
      <div style="font-size:11px;color:var(--text3);text-align:center">Tasa: ${f.tasa}% · Gama ${eq.gama}</div>`;
  }

  window.__finM=mLocal; window.__finIni=iniLocal;
  window.renderModalCuotas=function(){ mLocal=window.__finM; iniLocal=window.__finIni; document.getElementById('modal-cq-body').innerHTML=renderBody(); };
  document.getElementById('modal-cq-title').textContent=`💳 ${eq.marca} ${eq.modelo}`;
  document.getElementById('modal-cq-body').innerHTML=renderBody();
  openModal('modal-cuotas-fin');
}

(function injectFinStyles(){
  const s=document.createElement('style');
  s.textContent=`
    .ef-tag.active{background:var(--green-bg);border-color:var(--green-bd);color:var(--green);font-weight:600}
    #fin-grid .prod-card{cursor:pointer;padding:0}
    #fin-grid .prod-card:hover{border-color:var(--green-bd)}
    .ef-upload-btn{display:flex;align-items:center;gap:8px;padding:10px 14px;border:2px dashed var(--border);border-radius:var(--radius);cursor:pointer;color:var(--text2);font-size:13px;transition:border-color .2s}
    .ef-upload-btn:hover{border-color:var(--green);color:var(--green)}
    .ef-prev-img{width:100%;max-height:100px;object-fit:cover;border-radius:var(--radius-sm);margin-top:8px;display:none}
  `;
  document.head.appendChild(s);
})();

document.addEventListener('DOMContentLoaded',()=>{
  const btn3=document.querySelector('.fin-plazo-btn[data-m="3"]');
  if(btn3){btn3.style.background='var(--green)';btn3.style.borderColor='var(--green)';btn3.style.color='var(--bg)';}
});
