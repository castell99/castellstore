// ═══════════════════════════════════════════
//  catalogo.js — Catálogo público
// ═══════════════════════════════════════════

let equiposCatalogo = [];

async function loadCatalogo() {
  try {
    const data = await sb('equipos_financiamiento', 'GET', null, '?order=id.desc&disponible=eq.true');
    equiposCatalogo = Array.isArray(data) ? data : [];
  } catch (e) { equiposCatalogo = []; }
}

function filterPub(cat, el) {
  pubFilter = cat;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  renderPublic();
}

async function renderPublic() {
  await loadCatalogo();
  const grid = document.getElementById('pub-grid');
  if (!grid) return;

  const equipos = pubFilter
    ? equiposCatalogo.filter(e => e.gama === pubFilter || e.marca === pubFilter)
    : equiposCatalogo;

  if (!equipos.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:48px">No hay productos disponibles.</div>';
    return;
  }
  grid.innerHTML = equipos.map(eq => renderTarjetaEquipo(eq)).join('');
}

function renderTarjetaEquipo(eq) {
  const tags = typeof eq.etiquetas === 'string'
    ? JSON.parse(eq.etiquetas || '[]') : (eq.etiquetas || []);

  const GAMA_COLOR = { 'Entrada':'green', 'Media':'blue', 'Premium':'amber' };
  const TAG_COLOR  = { 'Economico':'green','Mas vendido':'amber','Recomendado':'blue','Premium':'muted','5G':'blue' };

  let imgHtml = '';
  if (eq.imagen1 && eq.imagen2) {
    imgHtml = '<div style="position:relative;height:200px;overflow:hidden;cursor:pointer" onclick="toggleCatImg(this)">'
      + '<img src="' + eq.imagen1 + '" data-img1="' + eq.imagen1 + '" data-img2="' + eq.imagen2 + '" style="width:100%;height:200px;object-fit:cover;transition:opacity .3s" onerror="this.style.display=\'none\'">'
      + '<div style="position:absolute;bottom:6px;right:8px;background:rgba(0,0,0,.55);color:#fff;font-size:10px;padding:2px 8px;border-radius:10px">1/2 · ver otra foto</div>'
      + '</div>';
  } else if (eq.imagen1) {
    imgHtml = '<div style="height:200px;overflow:hidden">'
      + '<img src="' + eq.imagen1 + '" style="width:100%;height:200px;object-fit:cover" onerror="this.parentElement.innerHTML=\'<div style=height:200px;display:flex;align-items:center;justify-content:center;font-size:56px;background:var(--surface2)>📱</div>\'">'
      + '</div>';
  } else {
    imgHtml = '<div style="height:200px;display:flex;align-items:center;justify-content:center;font-size:56px;background:var(--surface2)">📱</div>';
  }

  var specs = '';
  if (eq.ram) specs += '<span style="background:var(--surface2);color:var(--text2);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600">💾 ' + eq.ram + '</span>';
  if (eq.almacenamiento) specs += '<span style="background:var(--surface2);color:var(--text2);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600">📦 ' + eq.almacenamiento + '</span>';
  if (eq.g5) specs += '<span style="background:var(--surface2);color:var(--blue);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600">📶 5G</span>';

  var tagsHtml = '';
  var filteredTags = tags.filter(function(t) { return t !== 'Mas vendido'; });
  if (filteredTags.length) {
    tagsHtml = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px">'
      + filteredTags.map(function(t) { return '<span class="badge ' + (TAG_COLOR[t] || 'muted') + '" style="font-size:10px">' + t + '</span>'; }).join('')
      + '</div>';
  }

  var masVendido = tags.includes('Más vendido')
    ? '<div style="position:absolute;top:8px;right:8px"><span class="badge amber">⭐ Más vendido</span></div>'
    : '';

  return '<div class="prod-card" style="padding:0;overflow:hidden">'
    + '<div style="position:relative">'
    + imgHtml
    + '<div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;flex-wrap:wrap">'
    + '<span class="badge ' + (GAMA_COLOR[eq.gama] || 'muted') + '">' + eq.gama + '</span>'
    + (eq.g5 ? '<span class="badge blue" style="font-size:10px">5G</span>' : '')
    + '</div>'
    + masVendido
    + '</div>'
    + '<div class="prod-body">'
    + '<div style="font-size:11px;color:var(--text3);margin-bottom:2px">' + (eq.marca || '') + '</div>'
    + '<div class="prod-name" style="font-size:17px;margin-bottom:8px">' + (eq.modelo || '') + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' + specs + '</div>'
    + '<div class="prod-price">' + fmt(eq.precio_contado) + '</div>'
    + tagsHtml
    + '<button class="consultar-btn" onclick="consultarEquipo(\'' + (eq.marca + ' ' + eq.modelo).replace(/'/g, '') + '\')">💬 Consultar / Comprar</button>'
    + '</div>'
    + '</div>';
}

function toggleCatImg(container) {
  var img = container.querySelector('img');
  var lbl = container.querySelector('div');
  if (!img) return;
  var showing = img.dataset.showing || '1';
  if (showing === '1') {
    img.src = img.dataset.img2; img.dataset.showing = '2';
    if (lbl) lbl.textContent = '2/2 · ver otra foto';
  } else {
    img.src = img.dataset.img1; img.dataset.showing = '1';
    if (lbl) lbl.textContent = '1/2 · ver otra foto';
  }
}

function filterPub(cat, el) {
  pubFilter = cat;
  document.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderPublic();
}

function consultarEquipo(nombre) {
  var msg = 'Hola, estoy interesado en el *' + nombre + '*. Me pueden dar más información y opciones de pago?';
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}
