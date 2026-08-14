// ═══════════════════════════════════════════
//  catalogo.js — Catálogo público
// ═══════════════════════════════════════════

var equiposCatalogo = [];
var SERVICIOS_CATALOGO = [
  {
    id: 's1', nombre: 'Celulares', color: 'accent',
    descripcion: 'Reparación especializada para tu celular',
    items: ['Cambio de pantalla', 'Cambio de batería', 'Diagnóstico y reparación', 'Cambio de componentes', 'Mantenimiento y limpieza']
  },
  {
    id: 's2', nombre: 'Computadores', color: 'warning',
    descripcion: 'Soluciones completas para tu computador',
    items: ['Reparación y diagnóstico', 'Limpieza y mantenimiento', 'Optimización de rendimiento', 'Actualización de SSD', 'Ampliación de RAM']
  },
  {
    id: 's3', nombre: 'Software', color: 'success',
    descripcion: 'Instalación y configuración de programas',
    items: ['Instalación de Windows', 'Drivers y programas', 'Microsoft Office', 'Actualizaciones del sistema', 'Recuperación de información']
  },
  {
    id: 's4', nombre: 'Accesorios y repuestos', color: 'blue',
    descripcion: 'Componentes y accesorios de calidad',
    items: ['Cargadores y adaptadores', 'Baterías de repuesto', 'Cables y conectores', 'Audifonos y accesorios', 'Repuestos originales']
  },
];

var SERVICIO_COLORES = {
  accent:  { bg: '#1a3a6b', btn: '#1a6bbf', icon: '📱' },
  warning: { bg: '#5c3a00', btn: '#bf7a00', icon: '💻' },
  success: { bg: '#1a4a2a', btn: '#2a8a4a', icon: '⚙️' },
  blue:    { bg: '#1a2a5c', btn: '#2a4abf', icon: '🔌' },
};
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
  var html = '<div class="prod-card" style="padding:0;overflow:hidden;cursor:pointer" onclick="abrirDetalleEquipo(' + eq.id + ')">';
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
  html += '<button class="consultar-btn" onclick="event.stopPropagation();consultarEquipo(\'' + (eq.marca + ' ' + eq.modelo).replace(/[^a-zA-Z0-9 ]/g,'') + '\')">💬 Consultar / Comprar</button>';
  html += '</div></div>';
  return html;
}

function consultarEquipo(nombre) {
  var msg = 'Hola Castell, estoy interesado en el *' + nombre + '*. Me pueden dar mas informacion y opciones de pago?';
  window.open('https://wa.me/573046019483?text=' + encodeURIComponent(msg), '_blank');
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
  var isOpen = sb.classList.contains('movil-open');
  if (isOpen) {
    sb.classList.remove('movil-open');
    sb.style.display = '';
    var overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.remove();
  } else {
    sb.classList.add('movil-open');
    sb.style.display = 'block';
    // Agregar botón cerrar dentro del sidebar
    if (!document.getElementById('btn-cerrar-sidebar')) {
      var btnCerrar = document.createElement('button');
      btnCerrar.id = 'btn-cerrar-sidebar';
      btnCerrar.className = 'btn';
      btnCerrar.style.cssText = 'width:100%;margin-bottom:12px;justify-content:center';
      btnCerrar.textContent = '× Cerrar filtros';
      btnCerrar.onclick = toggleSidebarMovil;
      sb.insertBefore(btnCerrar, sb.firstChild);
    }
    // Overlay oscuro para cerrar al tocar fuera
    var overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:499;';
    overlay.onclick = toggleSidebarMovil;
    document.body.appendChild(overlay);
  }
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
  // Cerrar sidebar móvil al aplicar filtro
  var sb = document.getElementById('pub-sidebar');
  if (sb && sb.classList.contains('movil-open')) toggleSidebarMovil();
  if (typeof productos === 'undefined' || !productos.length) {
    try { var pd = await sb('productos','GET',null,'?order=id.asc'); if(Array.isArray(pd)) productos=pd; } catch(e){}
  }

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
      if (pubFilter && p.categoria !== pubFilter && p.categoria !== pubFilter + 's') return false;
      return true;
    }).map(function(p) { return renderTarjetaProducto(p); });
  }

  var lista = listaEquipos;

  if (orden === 'precio-asc')  lista.sort(function(a,b) { return parseFloat(a.precio_contado) - parseFloat(b.precio_contado); });
  else if (orden === 'precio-desc') lista.sort(function(a,b) { return parseFloat(b.precio_contado) - parseFloat(a.precio_contado); });
  else if (orden === 'nombre') lista.sort(function(a,b) { return (a.marca+' '+a.modelo).localeCompare(b.marca+' '+b.modelo); });
  else {
    // Orden inteligente por defecto: Destacados primero, luego recientes
    var peso = function(eq) {
      var tags = [];
      try { tags = typeof eq.etiquetas === 'string' ? JSON.parse(eq.etiquetas||'[]') : (eq.etiquetas||[]); } catch(e) {}
      var p = 0;
      if (tags.indexOf('Más vendido') !== -1)  p += 100;
      if (tags.indexOf('Recomendado') !== -1)   p += 80;
      if (tags.indexOf('Premium') !== -1)       p += 60;
      if (eq.gama === 'Premium')                p += 40;
      if (eq.gama === 'Media')                  p += 20;
      if (eq.imagen1)                           p += 30; // tiene foto
      if (eq.g5)                                p += 10;
      return p;
    };
    lista.sort(function(a,b) { return peso(b) - peso(a); });
  }

  var contador = document.getElementById('cat-contador');
  if (contador) contador.textContent = lista.length + ' producto' + (lista.length !== 1 ? 's' : '');

  var grid = document.getElementById('pub-grid');
  if (!grid) return;

  var htmlEquipos   = lista.map(function(eq) { return renderTarjetaEquipo(eq); });
  var htmlProductos = listaProductos || [];
  var todoHtml      = htmlEquipos.concat(htmlProductos);

  if (!todoHtml.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:48px">No hay productos disponibles.</div>';
    return;
  }
  grid.innerHTML = todoHtml.join('');
}

function renderTarjetaProducto(p) {
  var disp = p.stock > 0;
  var imgHtml = '';
  if (p.imagen1) {
    imgHtml = '<div class="cat-img-wrap">' +
      '<img src="' + p.imagen1 + '" class="cat-img-main" style="position:relative;opacity:1">' +
      (p.imagen2 ? '<img src="' + p.imagen2 + '" class="cat-img-hover">' : '') +
      '</div>';
  } else {
    imgHtml = '<div class="prod-img">' + (p.emoji || '📦') +
      '<span class="stock-tag"><span class="badge ' + (disp?'green':'red') + '">' + (disp?'Disponible':'Agotado') + '</span></span></div>';
  }
  var html = '<div class="prod-card' + (!disp?' agotado':'') + '" style="padding:0;overflow:hidden">';
  html += '<div style="position:relative">' + imgHtml;
  if (p.imagen1) html += '<div style="position:absolute;top:8px;left:8px;z-index:10"><span class="badge ' + (disp?'green':'red') + '">' + (disp?'Disponible':'Agotado') + '</span></div>';
  html += '</div>';
  html += '<div class="prod-body">';
  html += '<div class="prod-cat">' + (p.categoria || '') + '</div>';
  html += '<div class="prod-name">' + (p.nombre || '') + '</div>';
  html += '<div class="prod-price">' + fmt(parseFloat(p.precio) || 0) + '</div>';
  html += '<button class="consultar-btn" onclick="consultarEquipo(\'' + (p.nombre||'').replace(/[^a-zA-Z0-9 ]/g,'') + '\')" ' + (!disp?'disabled':'') + '>' + (disp?'💬 Consultar / Comprar':'No disponible') + '</button>';
  html += '</div></div>';
  return html;
}

var _detImgTimer = null;

function toggleDetImg() {
  var main  = document.getElementById('det-img-main');
  var hover = document.getElementById('det-img-hover');
  var dot1  = document.getElementById('det-dot-1');
  var dot2  = document.getElementById('det-dot-2');
  if (!main || !hover) return;
  var showing = main.style.opacity === '0';
  main.style.opacity  = showing ? '1' : '0';
  hover.style.opacity = showing ? '0' : '1';
  if (dot1 && dot2) {
    dot1.style.width      = showing ? '20px' : '6px';
    dot1.style.background = showing ? '#fff' : 'rgba(255,255,255,0.5)';
    dot2.style.width      = showing ? '6px' : '20px';
    dot2.style.background = showing ? 'rgba(255,255,255,0.5)' : '#fff';
  }
}

function iniciarCarruselDetalle() {
  if (_detImgTimer) clearInterval(_detImgTimer);
  _detImgTimer = setInterval(function() {
    var main = document.getElementById('det-img-main');
    if (!main) { clearInterval(_detImgTimer); return; }
    toggleDetImg();
  }, 3000);
}

function detenerCarruselDetalle() {
  if (_detImgTimer) { clearInterval(_detImgTimer); _detImgTimer = null; }
}

function abrirDetalleEquipo(id) {
  var eq = equiposCatalogo.find(function(e) { return e.id === id; });
  if (!eq) return;
  var tags = [];
  try { tags = typeof eq.etiquetas==='string' ? JSON.parse(eq.etiquetas||'[]') : (eq.etiquetas||[]); } catch(e){}
  var gamaColor = { 'Entrada':'green','Media':'blue','Premium':'amber' };
  var imgHtml = '';
  if (eq.imagen1 && eq.imagen2) {
    imgHtml = '<div style="height:280px;overflow:hidden;border-radius:var(--radius);background:var(--bg3);display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer" onclick="toggleDetImg()">' +
      '<img src="' + eq.imagen1 + '" id="det-img-main" style="max-height:280px;max-width:100%;object-fit:contain;transition:opacity .4s">' +
      '<img src="' + eq.imagen2 + '" id="det-img-hover" style="max-height:280px;max-width:100%;object-fit:contain;position:absolute;opacity:0;transition:opacity .4s">' +
      '<div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:6px">' +
        '<div id="det-dot-1" style="width:20px;height:6px;border-radius:3px;background:#fff;transition:all .3s"></div>' +
        '<div id="det-dot-2" style="width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,0.5);transition:all .3s"></div>' +
      '</div></div>';
  } else if (eq.imagen1) {
    imgHtml = '<div style="height:280px;overflow:hidden;border-radius:var(--radius);background:var(--bg3);display:flex;align-items:center;justify-content:center">' +
      '<img src="' + eq.imagen1 + '" style="max-height:280px;max-width:100%;object-fit:contain"></div>';
  } else {
    imgHtml = '<div style="height:200px;display:flex;align-items:center;justify-content:center;font-size:72px;background:var(--bg3);border-radius:var(--radius)">📱</div>';
  }
  var specs = '';
  if (eq.ram)            specs += '<div style="background:var(--bg3);border-radius:8px;padding:8px 12px"><div style="font-size:10px;color:var(--text3)">RAM</div><div style="font-weight:600">' + eq.ram + '</div></div>';
  if (eq.almacenamiento) specs += '<div style="background:var(--bg3);border-radius:8px;padding:8px 12px"><div style="font-size:10px;color:var(--text3)">Almacenamiento</div><div style="font-weight:600">' + eq.almacenamiento + '</div></div>';
  if (eq.g5)             specs += '<div style="background:var(--bg3);border-radius:8px;padding:8px 12px"><div style="font-size:10px;color:var(--text3)">Conectividad</div><div style="font-weight:600;color:var(--blue)">5G</div></div>';

  var m = document.getElementById('modal-detalle-equipo');
  if (!m) { m=document.createElement('div'); m.id='modal-detalle-equipo'; m.className='overlay'; document.body.appendChild(m); }

  m.innerHTML = '<div class="modal" style="max-width:500px" onclick="event.stopPropagation()">' +
    '<div class="modal-header"><div class="modal-title">' + eq.marca + ' ' + eq.modelo + '</div>' +
    '<button class="close-btn" onclick="detenerCarruselDetalle();document.getElementById(\'modal-detalle-equipo\').classList.remove(\'open\')">×</button></div>' +
    imgHtml +
    '<div style="margin:14px 0 10px;display:flex;gap:6px;flex-wrap:wrap">' +
    '<span class="badge ' + (gamaColor[eq.gama]||'muted') + '">' + (eq.gama||'') + '</span>' +
    (eq.g5 ? '<span class="badge blue">5G</span>' : '') +
    (tags.indexOf('Más vendido')!==-1 ? '<span class="badge amber">⭐ Más vendido</span>' : '') +
    '</div>' +
    (specs ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:14px">' + specs + '</div>' : '') +
    '<div style="background:var(--green-bg);border:1px solid var(--green-bd);border-radius:10px;padding:14px;margin-bottom:14px">' +
    '<div style="font-size:11px;color:var(--text3)">Precio contado</div>' +
    '<div style="font-size:26px;font-weight:800;color:var(--green)">' + fmt(eq.precio_contado) + '</div>' +
    '</div>' +
    '<div class="modal-footer" style="padding:0">' +
    '<button class="btn" onclick="detenerCarruselDetalle();document.getElementById(\'modal-detalle-equipo\').classList.remove(\'open\')">Cerrar</button>' +
    '<button class="consultar-btn" style="flex:1;margin:0" onclick="consultarEquipo(\'' + (eq.marca+' '+eq.modelo).replace(/[^a-zA-Z0-9 ]/g,'') + '\')">💬 Consultar / Comprar</button>' +
    '</div></div>';

  m.onclick = function(e) { if(e.target===m){ detenerCarruselDetalle(); m.classList.remove('open'); } };
  detenerCarruselDetalle();
  if (eq.imagen1 && eq.imagen2) setTimeout(iniciarCarruselDetalle, 500);
  m.classList.add('open');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    detenerCarruselDetalle();
    var m = document.getElementById('modal-detalle-equipo');
    if (m) m.classList.remove('open');
  }
});


function renderTarjetaServicio(s) {
  var c = SERVICIO_COLORES[s.color] || SERVICIO_COLORES.accent;
  var msg = encodeURIComponent('Hola, necesito el servicio de *' + s.nombre + '*. Me pueden dar más información?');
  return '<div class="prod-card" style="padding:0;overflow:hidden">' +
    '<div style="background:' + c.bg + ';padding:14px 14px 10px;display:flex;align-items:center;gap:10px">' +
      '<div style="width:40px;height:40px;border-radius:8px;background:' + c.btn + ';display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">' + c.icon + '</div>' +
      '<div><div style="font-size:14px;font-weight:600;color:#fff">' + s.nombre + '</div>' +
      '<div style="font-size:11px;color:rgba(255,255,255,0.7)">' + s.descripcion + '</div></div>' +
    '</div>' +
    '<div style="padding:10px 12px">' +
      '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:12px">' +
        s.items.map(function(item){ return '<div style="font-size:12px;color:var(--text2);display:flex;align-items:center;gap:6px"><span style="color:var(--green);font-size:10px">✓</span>' + item + '</div>'; }).join('') +
      '</div>' +
      '<a href="https://wa.me/573046019483?text=' + msg + '" target="_blank" style="text-decoration:none">' +
        '<button class="consultar-btn" style="width:100%;justify-content:center">💬 Solicitar servicio</button>' +
      '</a>' +
    '</div>' +
  '</div>';
}
