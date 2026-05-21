// ═══════════════════════════════════════════
//  catalogo.js — Catálogo público
// ═══════════════════════════════════════════

var equiposCatalogo = [];

async function loadCatalogo() {
  try {
    var data = await sb('equipos_financiamiento', 'GET', null, '?order=id.desc&disponible=eq.true');
    equiposCatalogo = Array.isArray(data) ? data : [];
  } catch (e) { equiposCatalogo = []; }
}

async function renderPublic() {
  await loadCatalogo();
  var grid = document.getElementById('pub-grid');
  if (!grid) return;
  var equipos = equiposCatalogo.filter(function(e) {
    if (marcaFiltro && e.marca !== marcaFiltro) return false;
    return true;
  });
  if (!equipos.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:48px">No hay productos disponibles.</div>';
    return;
  }
  grid.innerHTML = equipos.map(function(eq) { return renderTarjetaEquipo(eq); }).join('');
}

var marcaFiltro = '';

function filterPub(cat, el) {
  pubFilter = cat;
  marcaFiltro = '';
  document.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('active'); });
  if (el) el.classList.add('active');

  // Mostrar/ocultar barra de marcas
  var marcaBar = document.getElementById('marca-bar');
  if (cat === 'Teléfono' || cat === 'Telefonos' || cat === '') {
    var marcas = [...new Set(equiposCatalogo.map(function(e) { return e.marca; }).filter(Boolean))].sort();
    marcaBar.innerHTML = '<button class="pill active" onclick="filterMarca(\'\',this)">Todas las marcas</button>'
      + marcas.map(function(m) {
          return '<button class="pill" onclick="filterMarca(\'' + m + '\',this)">' + m + '</button>';
        }).join('');
    marcaBar.style.display = 'flex';
  } else {
    marcaBar.style.display = 'none';
  }

  renderPublic();
}

function filterMarca(marca, el) {
  marcaFiltro = marca;
  document.querySelectorAll('#marca-bar .pill').forEach(function(p) { p.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderPublic();
}

function renderTarjetaEquipo(eq) {
  var tags = [];
  try { tags = typeof eq.etiquetas === 'string' ? JSON.parse(eq.etiquetas || '[]') : (eq.etiquetas || []); } catch(e) {}

  var gamaColor = { 'Entrada':'green', 'Media':'blue', 'Premium':'amber' };
  var tagColor  = { 'Economico':'green','Mas vendido':'amber','Recomendado':'blue','Premium':'muted','5G':'blue' };

  var imgHtml = '';
  if (eq.imagen1 && eq.imagen2) {
    imgHtml = '<div style="position:relative;height:200px;overflow:hidden;cursor:pointer" onclick="toggleCatImg(this)">'
      + '<img src="' + eq.imagen1 + '" data-img1="' + eq.imagen1 + '" data-img2="' + eq.imagen2 + '" style="width:100%;height:200px;object-fit:cover" onerror="this.style.display=\'none\'">'
      + '<div style="position:absolute;bottom:6px;right:8px;background:rgba(0,0,0,.6);color:#fff;font-size:10px;padding:2px 8px;border-radius:10px">1/2 ver otra</div>'
      + '</div>';
  } else if (eq.imagen1) {
    imgHtml = '<div style="height:200px;overflow:hidden">'
      + '<img src="' + eq.imagen1 + '" style="width:100%;height:200px;object-fit:cover">'
      + '</div>';
  } else {
    imgHtml = '<div style="height:200px;display:flex;align-items:center;justify-content:center;font-size:56px;background:var(--surface2)">📱</div>';
  }

  var specs = '';
  if (eq.ram) specs += '<span style="background:var(--surface2);color:var(--text2);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600">💾 ' + eq.ram + '</span> ';
  if (eq.almacenamiento) specs += '<span style="background:var(--surface2);color:var(--text2);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600">📦 ' + eq.almacenamiento + '</span> ';
  if (eq.g5) specs += '<span style="background:var(--surface2);color:var(--blue);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600">📶 5G</span>';

  var masVendido = tags.indexOf('Más vendido') !== -1
    ? '<div style="position:absolute;top:8px;right:8px"><span class="badge amber">⭐ Más vendido</span></div>' : '';

  var nombre = (eq.marca || '') + ' ' + (eq.modelo || '');

  return '<div class="prod-card" style="padding:0;overflow:hidden">'
    + '<div style="position:relative">'
    + imgHtml
    + '<div style="position:absolute;top:8px;left:8px">'
    + '<span class="badge ' + (gamaColor[eq.gama] || 'muted') + '">' + (eq.gama || '') + '</span>'
    + (eq.g5 ? ' <span class="badge blue" style="font-size:10px">5G</span>' : '')
    + '</div>'
    + masVendido
    + '</div>'
    + '<div class="prod-body">'
    + '<div class="prod-name" style="font-size:17px;margin-bottom:8px">' + (eq.marca || '') + ' ' + (eq.modelo || '') + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' + specs + '</div>'
    + '<div class="prod-price">' + fmt(eq.precio_contado) + '</div>'
    + '<button class="consultar-btn" onclick="consultarEquipo(\'' + nombre.replace(/'/g,'') + '\')">💬 Consultar / Comprar</button>'
    + '</div>'
    + '</div>';
}

function toggleCatImg(container) {
  var img = container.querySelector('img');
  var lbl = container.querySelector('div');
  if (!img) return;
  var showing = img.dataset.showing || '1';
  if (showing === '1') {
    img.src = img.dataset.img2;
    img.dataset.showing = '2';
    if (lbl) lbl.textContent = '2/2 ver otra';
  } else {
    img.src = img.dataset.img1;
    img.dataset.showing = '1';
    if (lbl) lbl.textContent = '1/2 ver otra';
  }
}

function consultarEquipo(nombre) {
  var msg = 'Hola, estoy interesado en el *' + nombre + '*. Me pueden dar mas informacion y opciones de pago?';
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}

function updPubPrice() {}
