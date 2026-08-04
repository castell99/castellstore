// ═══════════════════════════════════════════
//  catalogo.js — Catálogo público
// ═══════════════════════════════════════════

var equiposCatalogo = [];
var marcaFiltro     = '';

async function loadCatalogo() {
  try {
    var data = await sb('equipos_financiamiento', 'GET', null, '?order=id.desc&disponible=eq.true');
    equiposCatalogo = Array.isArray(data) ? data : [];
  } catch (e) { equiposCatalogo = []; }
}

async function renderPublic() {
  await loadCatalogo();
  await aplicarFiltrosCatalogo();
}

const MARCA_LOGOS = {
  'Samsung':'https://cdn.simpleicons.org/samsung/ffffff','SAMSUNG':'https://cdn.simpleicons.org/samsung/ffffff',
  'iPhone':'https://cdn.simpleicons.org/apple/ffffff','Iphone':'https://cdn.simpleicons.org/apple/ffffff','IPHONE':'https://cdn.simpleicons.org/apple/ffffff','Apple':'https://cdn.simpleicons.org/apple/ffffff',
  'Xiaomi':'https://cdn.simpleicons.org/xiaomi/ffffff','XIAOMI':'https://cdn.simpleicons.org/xiaomi/ffffff',
  'Motorola':'https://cdn.simpleicons.org/motorola/ffffff','MOTOROLA':'https://cdn.simpleicons.org/motorola/ffffff',
  'Honor':'https://cdn.simpleicons.org/honor/ffffff','HONOR':'https://cdn.simpleicons.org/honor/ffffff',
  'Huawei':'https://cdn.simpleicons.org/huawei/ffffff','HUAWEI':'https://cdn.simpleicons.org/huawei/ffffff',
  'Oppo':'https://cdn.simpleicons.org/oppo/ffffff','OPPO':'https://cdn.simpleicons.org/oppo/ffffff',
  'Vivo':'https://cdn.simpleicons.org/vivo/ffffff','VIVO':'https://cdn.simpleicons.org/vivo/ffffff',
  'OnePlus':'https://cdn.simpleicons.org/oneplus/ffffff',
  'Realme':'https://cdn.simpleicons.org/realme/ffffff',
  'Infinix':'','INFINIX':'','Tecno':'','TECNO':'',
};

function filterPub(cat, el) {
  pubFilter   = cat;
  marcaFiltro = '';
  document.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('active'); });
  if (el) el.classList.add('active');

  var marcaBar   = document.getElementById('marca-bar');
  var esTelefono = (cat === '' || cat === 'Teléfono' || cat === 'Telefonos' || cat === 'Teléfonos');

  if (esTelefono) {
    var marcas = [];
    equiposCatalogo.forEach(function(e) { if (e.marca && marcas.indexOf(e.marca) === -1) marcas.push(e.marca); });
    marcas.sort();

    marcaBar.innerHTML =
      '<div id="marcas-slider" style="display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:12px 4px;scroll-behavior:smooth">' +
      '<style>#marcas-slider::-webkit-scrollbar{display:none}</style>' +
      '<button onclick="filterMarca(\'\',this)" id="btn-marca-todas" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px;border:2px solid var(--green);border-radius:12px;background:var(--green);cursor:pointer;min-width:80px;flex-shrink:0;scroll-snap-align:start;transition:all .2s">' +
        '<span style="font-size:22px">🌐</span><span style="font-size:11px;font-weight:600;color:var(--bg)">Todas</span></button>' +
      marcas.map(function(m) {
        var logo = MARCA_LOGOS[m] || '';
        return '<button onclick="filterMarca(\'' + m + '\',this)" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px;border:2px solid var(--border);border-radius:12px;background:var(--surface,var(--bg2));cursor:pointer;min-width:80px;flex-shrink:0;scroll-snap-align:start;transition:all .2s" class="btn-marca-item" data-marca="' + m + '">' +
          (logo ? '<img src="' + logo + '" style="width:40px;height:40px;object-fit:contain;padding:4px" onerror="this.style.display=\'none\'">' : '<span style="font-size:22px">📱</span>') +
          '<span style="font-size:11px;font-weight:600;color:var(--text2)">' + m + '</span></button>';
      }).join('') + '</div>' +
      '<div id="marcas-dots" style="display:flex;justify-content:center;gap:6px;margin-top:8px"></div>';

    var slider  = marcaBar.querySelector('#marcas-slider');
    var dots    = marcaBar.querySelector('#marcas-dots');
    var total   = marcas.length + 1;
    var visible = window.innerWidth < 600 ? 3 : 6;
    var pages   = Math.ceil(total / visible);
    if (pages > 1) {
      for (var i = 0; i < pages; i++) {
        var dot = document.createElement('div');
        dot.style.cssText = 'width:' + (i===0?'20':'8') + 'px;height:8px;border-radius:4px;background:' + (i===0?'var(--green)':'var(--border)') + ';cursor:pointer;transition:all .3s';
        dot.onclick = (function(idx){ return function(){ slider.scrollTo({ left: idx*visible*100, behavior:'smooth' }); }; })(i);
        dots.appendChild(dot);
      }
      slider.addEventListener('scroll', function() {
        var page = Math.round(slider.scrollLeft / (visible * 100));
        dots.querySelectorAll('div').forEach(function(d, idx) { d.style.width=idx===page?'20px':'8px'; d.style.background=idx===page?'var(--green)':'var(--border)'; });
      });
    }
    marcaBar.style.display = 'block';
    marcaBar.style.padding = '4px 0';
  } else {
    marcaBar.style.display = 'none';
  }
  aplicarFiltrosCatalogo();
}

function filterMarca(marca, btn) {
  marcaFiltro = marca;
  document.querySelectorAll('.btn-marca-item').forEach(function(b) {
    b.classList.remove('activa');
    b.style.borderColor = 'var(--border)';
    b.style.background  = 'var(--surface,var(--bg2))';
    var lbl = b.querySelector('span:last-child');
    if (lbl) lbl.style.color = 'var(--text2)';
  });
  var todas = document.getElementById('btn-marca-todas');
  if (todas) {
    todas.style.background = marca === '' ? 'var(--green)' : 'var(--surface,var(--bg2))';
    var tLbl = todas.querySelector('span:last-child');
    if (tLbl) tLbl.style.color = marca === '' ? 'var(--bg)' : 'var(--text2)';
  }
  if (btn && btn !== todas) {
    btn.classList.add('activa');
    btn.style.borderColor = 'var(--green)';
    btn.style.background  = 'rgba(57,255,20,0.1)';
    var bLbl = btn.querySelector('span:last-child');
    if (bLbl) bLbl.style.color = 'var(--green)';
  }
  aplicarFiltrosCatalogo();
}

function renderTarjetaEquipo(eq) {
  var tags = [];
  try { tags = typeof eq.etiquetas === 'string' ? JSON.parse(eq.etiquetas || '[]') : (eq.etiquetas || []); } catch(e) {}
  var gamaColor = { 'Entrada':'green', 'Media':'blue', 'Premium':'amber' };
  var imgHtml = '';
  if (eq.imagen1 && eq.imagen2) {
    imgHtml = '<div class="cat-img-wrap"><img src="' + eq.imagen1 + '" class="cat-img-main"><img src="' + eq.imagen2 + '" class="cat-img-hover"></div>';
  } else if (eq.imagen1) {
    imgHtml = '<div class="cat-img-wrap"><img src="' + eq.imagen1 + '" class="cat-img-main" style="position:relative;opacity:1"></div>';
  } else {
    imgHtml = '<div style="height:200px;display:flex;align-items:center;justify-content:center;font-size:56px;background:var(--surface2,var(--bg3))">📱</div>';
  }
  var specs = '';
  if (eq.ram) specs += '<span style="background:var(--surface2);color:var(--text2);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600">💾 ' + eq.ram + '</span> ';
  if (eq.almacenamiento) specs += '<span style="background:var(--surface2);color:var(--text2);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600">📦 ' + eq.almacenamiento + '</span> ';
  if (eq.g5) specs += '<span style="background:var(--surface2);color:var(--blue);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600">📶 5G</span>';
  var masVendido = tags.indexOf('Más vendido') !== -1 ? '<div style="position:absolute;top:8px;right:8px;z-index:10"><span class="badge amber">⭐ Más vendido</span></div>' : '';
  var precio = parseFloat(eq.precio_contado) || 0;
  var html = '<div class="prod-card" style="padding:0;overflow:hidden">';
  html += '<div style="position:relative">';
  html += imgHtml;
  html += '<div style="position:absolute;top:8px;left:8px;z-index:10">';
  html += '<span class="badge ' + (gamaColor[eq.gama] || 'muted') + '">' + (eq.gama || '') + '</span>';
  if (eq.g5) html += ' <span class="badge blue" style="font-size:10px">5G</span>';
  html += '</div>';
  html += masVendido;
  html += '</div>';
  html += '<div class="prod-body">';
  html += '<div style="font-size:11px;color:var(--text3);margin-bottom:2px">' + (eq.marca || '') + '</div>';
  html += '<div class="prod-name" style="font-size:17px;margin-bottom:8px">' + (eq.modelo || '') + '</div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' + specs + '</div>';
  html += '<div class="prod-price">' + fmt(precio) + '</div>';
  html += '<button class="consultar-btn" onclick="consultarEquipo(\'' + (eq.marca + ' ' + eq.modelo).replace(/[^a-zA-Z0-9 ]/g,'') + '\')">💬 Consultar / Comprar</button>';
  html += '</div></div>';
  return html;
}

function consultarEquipo(nombre) {
  var msg = 'Hola, estoy interesado en el *' + nombre + '*. Me pueden dar mas informacion y opciones de pago?';
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}

function updPubPrice() {}

// ── Filtros avanzados ─────────────────────
function toggleFilterGroup(el) {
  var body = el.nextElementSibling;
  if (body) body.classList.toggle('collapsed');
  var span = el.querySelector('span');
  if (span) span.textContent = body.classList.contains('collapsed') ? '▸' : '▾';
}

function toggleSidebarMovil() {
  var sb = document.getElementById('pub-sidebar');
  if (!sb) return;
  sb.classList.toggle('movil-open');
  sb.style.display = sb.classList.contains('movil-open') ? 'block' : '';
}

function limpiarFiltrosCatalogo() {
  document.querySelectorAll('.filter-check input[type="checkbox"]').forEach(function(cb) { cb.checked = false; });
  var radios = document.querySelectorAll('input[name="cat-orden"]');
  if (radios.length) radios[0].checked = true;
  var ord = document.getElementById('cat-orden-movil');
  if (ord) ord.value = '';
  aplicarFiltrosCatalogo();
}

async function aplicarFiltrosCatalogo() {
  if (!equiposCatalogo.length) await loadCatalogo();

  var gamas = Array.from(document.querySelectorAll('.filter-check input[value="Entrada"],.filter-check input[value="Media"],.filter-check input[value="Premium"]'))
    .filter(function(cb) { return cb.checked; })
    .map(function(cb) { return cb.value; });

  var solo5gEl = document.querySelector('.filter-check input[value="5g"]');
  var solo5g   = solo5gEl ? solo5gEl.checked : false;

  var ordenDesktopEl = document.querySelector('input[name="cat-orden"]:checked');
  var ordenMovilEl   = document.getElementById('cat-orden-movil');
  var orden = (ordenDesktopEl ? ordenDesktopEl.value : '') || (ordenMovilEl ? ordenMovilEl.value : '');

 var esTelefono = (!pubFilter || pubFilter === 'Teléfono' || pubFilter === 'Telefonos' || pubFilter === 'Teléfonos');

  // Equipos financiados (teléfonos)
  var listaEquipos = esTelefono ? equiposCatalogo.filter(function(eq) {
    if (marcaFiltro && eq.marca !== marcaFiltro) return false;
    if (gamas.length && gamas.indexOf(eq.gama) === -1) return false;
    if (solo5g && !eq.g5) return false;
    return true;
  }) : [];

  // Productos normales (accesorios, servicios, etc.)
  var listaProductos = [];
  if (typeof productos !== 'undefined') {
    listaProductos = productos.filter(function(p) {
      if (esTelefono) return false; // en teléfonos no mostrar productos
      if (pubFilter && p.categoria !== pubFilter) return false;
      return true;
    }).map(function(p) { return renderTarjetaProducto(p); });
  }

  var lista = listaEquipos;

  if (orden === 'precio-asc')  lista.sort(function(a,b) { return parseFloat(a.precio_contado) - parseFloat(b.precio_contado); });
  if (orden === 'precio-desc') lista.sort(function(a,b) { return parseFloat(b.precio_contado) - parseFloat(a.precio_contado); });
  if (orden === 'nombre')      lista.sort(function(a,b) { return (a.marca+' '+a.modelo).localeCompare(b.marca+' '+b.modelo); });

  var contador = document.getElementById('cat-contador');
  if (contador) contador.textContent = lista.length + ' producto' + (lista.length !== 1 ? 's' : '');

  var grid = document.getElementById('pub-grid');
  if (!grid) return;
  if (!lista.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:48px">No hay productos con estos filtros.</div>';
    return;
  }
  grid.innerHTML = lista.map(function(eq) { return renderTarjetaEquipo(eq); }).join('');
}
