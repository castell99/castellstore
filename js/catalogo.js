// ── Navegacion inicio <-> catalogo ────────
// sec-home y sec-catalogo conviven dentro de la vista publica.
// Estas funciones son lo unico que las alterna.

function verCatalogo() {
  var h = document.getElementById('sec-home');
  var c = document.getElementById('sec-catalogo');
  if (h) h.style.display = 'none';
  if (c) c.style.display = 'block';
  window.scrollTo(0, 0);
  // Sin pildora "Todos", el catalogo siempre muestra una categoria.
  // Al entrar cae en Telefonos.
  Promise.resolve(renderPublic()).then(function() {
    var p = document.querySelector('.cat-bar .pill[data-cat="Teléfono"]');
    if (p) filterPub('Teléfono', p);
  });
}

function verInicio() {
  var h = document.getElementById('sec-home');
  var c = document.getElementById('sec-catalogo');
  if (c) c.style.display = 'none';
  if (h) h.style.display = 'block';
  document.querySelectorAll('.cat-bar .pill').forEach(function(p){ p.classList.remove('active'); });
  window.scrollTo(0, 0);
}

// Desde el inicio las categorias funcionan como menu: abren el
// catalogo ya filtrado. No se llama a renderPublic() porque su
// carga es asincrona y pisaria el filtro recien aplicado.
async function irACategoria(cat, el) {
  var h = document.getElementById('sec-home');
  if (h && h.style.display !== 'none') {
    h.style.display = 'none';
    document.getElementById('sec-catalogo').style.display = 'block';
      window.scrollTo(0, 0);
    if (typeof equiposCatalogo === 'undefined' || !equiposCatalogo.length) {
      await loadCatalogo();
    }
  }
  filterPub(cat, el);
}

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

  // Las marcas salen de equipos_financiamiento en telefonos y de
  // productos en el resto. Si la categoria no tiene ninguna marca
  // registrada, la barra no se muestra.
  var marcas = [];
  if (esTelefono) {
    equiposCatalogo.forEach(function(e) { if (e.marca && marcas.indexOf(e.marca) === -1) marcas.push(e.marca); });
  } else if (typeof productos !== 'undefined') {
    productos.forEach(function(p) {
      if (!p.marca) return;
      if (p.categoria !== cat && p.categoria !== cat + 's') return;
      if (marcas.indexOf(p.marca) === -1) marcas.push(p.marca);
    });
  }
  marcas.sort();

  if (marcas.length) {

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
// El distintivo del grado. Nuevo va en verde y los usados en gris:
// el color no debe sugerir que un grado es peor que otro, solo
// distinguirlos de un vistazo.
function badgeGrado(grado) {
  if (!grado) return '';
  var cls = grado === 'Nuevo' ? 'green' : 'muted';
  return '<span class="badge ' + cls + '">' + grado + '</span>';
}

// Bloque de condicion para la ficha. El texto sale de negocio.js,
// no de la fila del equipo: asi se corrige en un solo lugar.
function bloqueGrado(eq) {
  var g = (NEGOCIO.grados || {})[eq.grado];
  var obs = (eq.obs_equipo || '').trim();
  if (!g && !obs) return '';
  var h = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px">';
  if (g) {
    h += '<div style="font-weight:700;margin-bottom:4px">' + eq.grado + '</div>';
    h += '<div style="font-size:13px;color:var(--text2);line-height:1.5">' + g.resumen + '</div>';
    if (g.puntos && g.puntos.length) {
      h += '<ul style="margin:10px 0 0;padding-left:18px;font-size:12.5px;color:var(--text2);line-height:1.6">';
      g.puntos.forEach(function(p) { h += '<li>' + p + '</li>'; });
      h += '</ul>';
    }
  }
  if (obs) {
    h += '<div style="margin-top:' + (g ? '12px' : '0') + ';padding-top:' + (g ? '10px' : '0') +
         ';border-top:' + (g ? '1px solid var(--border)' : 'none') + '">';
    h += '<div style="font-size:11px;color:var(--text3)">Notas de este equipo</div>';
    h += '<div style="font-size:13px;color:var(--text2);line-height:1.5">' + obs + '</div>';
    h += '</div>';
  }
  return h + '</div>';
}

function renderTarjetaEquipo(eq) {
  var tags = [];
  try { tags = typeof eq.etiquetas === 'string' ? JSON.parse(eq.etiquetas || '[]') : (eq.etiquetas || []); } catch(e) {}
  var gamaColor = { 'Baja':'green', 'Media':'blue', 'Alta':'amber' };

  // La foto va sobre un panel apenas mas claro que la tarjeta. Sin
  // fondo blanco: las fotos recortadas quedaban metidas en un bloque.
  var imgHtml;
  if (eq.imagen1 && eq.imagen2) {
    imgHtml = '<div class="cat-img-wrap"><img src="' + eq.imagen1 + '" class="cat-img-main"><img src="' + eq.imagen2 + '" class="cat-img-hover"></div>';
  } else if (eq.imagen1) {
    imgHtml = '<div class="cat-img-wrap"><img src="' + eq.imagen1 + '" class="cat-img-main"></div>';
  } else {
    imgHtml = '<div class="cat-img-wrap" style="display:flex;align-items:center;justify-content:center;font-size:46px">📱</div>';
  }

  // Especificaciones en una sola linea de texto. Antes eran pastillas:
  // con tres o cuatro saltaban de renglon y descuadraban el alto de la
  // tarjeta respecto a sus vecinas.
  var specs = [];
  if (eq.ram)            specs.push(eq.ram);
  if (eq.almacenamiento) specs.push(eq.almacenamiento);
  if (eq.g5)             specs.push('5G');
  var specsTxt = specs.join(' · ');

  var chips = '<span class="badge ' + (gamaColor[eq.gama] || 'muted') + '">' + (eq.gama || '') + '</span>' + badgeGrado(eq.grado);
  if (tags.indexOf('Más vendido') !== -1) chips += '<span class="badge amber">⭐ Más vendido</span>';

  var precio   = parseFloat(eq.precio_contado) || 0;
  var nombreWA = (eq.marca + ' ' + eq.modelo).replace(/[^a-zA-Z0-9 ]/g, '');

  var h = '';
  h += '<div class="prod-card cat-card" onclick="abrirDetalleEquipo(' + eq.id + ')">';
  h +=   '<div class="cat-foto">' + imgHtml + '</div>';
  h +=   '<div class="prod-body">';
  h +=     '<div class="cat-chips">' + chips + '</div>';
  h +=     '<div style="font-size:11px;color:var(--text3);letter-spacing:.3px">' + (eq.marca || '') + '</div>';
  h +=     '<div class="prod-name" style="font-size:16px;margin:1px 0 6px">' + (eq.modelo || '') + '</div>';
  if (specsTxt) {
    h +=   '<div style="font-size:12px;color:var(--text2)">' + specsTxt + '</div>';
  }
  // Todo lo de abajo se empuja al fondo: asi el precio y el boton
  // quedan alineados entre tarjetas aunque el texto de arriba varie.
  h +=     '<div class="cat-pie">';
  h +=       '<div class="prod-price" style="margin:10px 0 9px">' + fmt(precio) + '</div>';
  h +=       '<button class="cat-btn-wa" onclick="event.stopPropagation();consultarEquipo(\'' + nombreWA + '\')">';
  h +=         '<span style="font-size:15px">💬</span> Consultar';
  h +=       '</button>';
  h +=     '</div>';
  h +=   '</div>';
  h += '</div>';
  return h;
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
  // OJO: esta variable NO puede llamarse "sb" — taparia la funcion
  // global sb() de config.js y la carga de productos fallaria en
  // silencio (asi se origino el bug de accesorios vacios sin sesion).
  var sidebarMovil = document.getElementById('pub-sidebar');
  if (sidebarMovil && sidebarMovil.classList.contains('movil-open')) toggleSidebarMovil();
  if (typeof productos === 'undefined' || !productos.length) {
    try { var pd = await sb('productos_publicos','GET',null,'?order=id.asc'); if(Array.isArray(pd)) productos=pd; } catch(e){}
  }

  var gamas = Array.from(document.querySelectorAll('.filter-check input[value="Baja"],.filter-check input[value="Media"],.filter-check input[value="Alta"]'))
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
      if (marcaFiltro && p.marca !== marcaFiltro) return false;
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
      if (eq.gama === 'Alta')                   p += 40;
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

  // Agregar tarjetas de servicios
  var mostrarServicios = !pubFilter || pubFilter === 'Servicio' || pubFilter === 'Servicios';
  var htmlServicios = mostrarServicios ? SERVICIOS_CATALOGO.map(function(s) { return renderTarjetaServicio(s); }) : [];

  var todoFinal = todoHtml.concat(htmlServicios);

  if (!todoFinal.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:48px">No hay productos disponibles.</div>';
    return;
  }
  grid.innerHTML = todoFinal.join('');
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

// Cuota mensual mas baja con la que se puede ofrecer el equipo.
// Usa la MISMA formula que guardarVenta y previewFinV: la inicial se
// resta antes de aplicar el interes. Si se calculara aparte, el
// catalogo prometeria una cuota distinta a la que luego se cobra.
function cuotaDesde(eq) {
  if (typeof FIN_TASAS === 'undefined') return null;
  var tabla = FIN_TASAS[eq.gama];
  if (!tabla) return null;

  // El plazo mas largo permitido para esa gama es el que da la cuota
  // mas baja, que es lo que significa "desde".
  var plazos = Object.keys(tabla).map(Number).filter(function(n) { return n > 1; });
  if (!plazos.length) return null;
  var meses = Math.max.apply(null, plazos);
  var tasa  = parseFloat(tabla[meses]);
  if (isNaN(tasa)) return null;

  var precio = parseFloat(eq.precio_contado) || 0;
  if (!precio) return null;

  var pctIni  = (typeof iniMinima === 'function') ? (parseFloat(iniMinima(eq.gama, meses)) || 0) : 0;
  var inicial = Math.round(precio * pctIni / 100);
  var base    = Math.max(0, precio - inicial);
  var fin     = Math.round(base * (1 + tasa / 100));

  return { meses: meses, inicial: inicial, cuota: Math.round(fin / meses) };
}

function abrirDetalleEquipo(id) {
  var eq = equiposCatalogo.find(function(e) { return e.id === id; });
  if (!eq) return;

  var tags = [];
  try { tags = typeof eq.etiquetas === 'string' ? JSON.parse(eq.etiquetas || '[]') : (eq.etiquetas || []); } catch(e) {}
  var gamaColor = { 'Baja':'green', 'Media':'blue', 'Alta':'amber' };

  // ── Foto ──
  var imgHtml = '';
  if (eq.imagen1 && eq.imagen2) {
    imgHtml = '<div class="det-foto" onclick="toggleDetImg()">' +
      '<img src="' + eq.imagen1 + '" id="det-img-main">' +
      '<img src="' + eq.imagen2 + '" id="det-img-hover">' +
      '<div class="det-dots">' +
        '<div id="det-dot-1" class="det-dot activo"></div>' +
        '<div id="det-dot-2" class="det-dot"></div>' +
      '</div></div>';
  } else if (eq.imagen1) {
    imgHtml = '<div class="det-foto"><img src="' + eq.imagen1 + '" id="det-img-main"></div>';
  } else {
    imgHtml = '<div class="det-foto" style="font-size:64px">📱</div>';
  }

  // ── Distintivos ──
  // El 5G se quito de aqui: ya aparece abajo en las especificaciones
  // y en el nombre del equipo. Salia tres veces.
  var meses = (typeof NEGOCIO !== 'undefined' && NEGOCIO.garantia && NEGOCIO.garantia.meses)
            ? NEGOCIO.garantia.meses[eq.grado] : null;
  var chips = '<span class="badge ' + (gamaColor[eq.gama] || 'muted') + '">Gama ' + (eq.gama || '') + '</span>' +
              badgeGrado(eq.grado) +
              (meses ? '<span class="badge muted">' + meses + ' meses de garantía</span>' : '') +
              (tags.indexOf('Más vendido') !== -1 ? '<span class="badge amber">⭐ Más vendido</span>' : '');

  // ── Especificaciones en una sola fila dividida ──
  var cel = [];
  if (eq.ram)            cel.push(['RAM', eq.ram]);
  if (eq.almacenamiento) cel.push(['ALMACENAMIENTO', eq.almacenamiento]);
  if (eq.g5)             cel.push(['RED', '5G']);
  var specs = '';
  if (cel.length) {
    specs = '<div class="det-specs">';
    cel.forEach(function(c) {
      specs += '<div class="det-spec"><div class="det-spec-lbl">' + c[0] + '</div>' +
               '<div class="det-spec-val">' + c[1] + '</div></div>';
    });
    specs += '</div>';
  }

  // ── Precio y cuota ──
  var fin = cuotaDesde(eq);
  var bloquePrecio =
    '<div class="det-precio">' +
      '<span class="det-precio-num">' + fmt(eq.precio_contado) + '</span>' +
      '<span class="det-precio-lbl">de contado</span>' +
    '</div>';
    if (fin) {
    // Sin cifras: el plan se arma con cada cliente. Publicar una
    // cuota exacta comprometeria un plazo y una inicial fijos.
    bloquePrecio +=
      '<div class="det-cuota">' +
        '<div class="det-cuota-num">Llévalo financiado</div>' +
        '<div class="det-cuota-pie"> Escríbenos y armamos tu plan</div>' +
      '</div>';
  }

  var m = document.getElementById('modal-detalle-equipo');
  if (!m) { m = document.createElement('div'); m.id = 'modal-detalle-equipo'; m.className = 'overlay'; document.body.appendChild(m); }

  var cerrar = "detenerCarruselDetalle();document.getElementById('modal-detalle-equipo').classList.remove('open')";

  m.innerHTML = '<div class="modal det-modal" onclick="event.stopPropagation()">' +
    '<div class="det-head">' +
      '<div>' +
        '<div class="det-marca">' + (eq.marca || '') + '</div>' +
        '<div class="det-modelo">' + (eq.modelo || '') + '</div>' +
      '</div>' +
      '<button class="close-btn" onclick="' + cerrar + '">×</button>' +
    '</div>' +
    imgHtml +
    '<div class="det-chips">' + chips + '</div>' +
    specs +
    // La descripcion del grado solo aparece en equipos que no son
    // nuevos: ahi si aporta, porque explica el estado real.
    (eq.grado && eq.grado !== 'Nuevo' ? bloqueGrado(eq) : '') +
    (eq.obs_equipo ? '<div class="det-obs">' + eq.obs_equipo + '</div>' : '') +
    bloquePrecio +
    '<div class="det-acciones">' +
      '<button class="btn" onclick="' + cerrar + '">Cerrar</button>' +
      '<button class="det-btn-wa" onclick="consultarEquipo(\'' + (eq.marca + ' ' + eq.modelo).replace(/[^a-zA-Z0-9 ]/g, '') + '\')">' +
        '<span style="font-size:16px">💬</span> Lo quiero' +
      '</button>' +
    '</div></div>';

  m.onclick = function(e) { if (e.target === m) { detenerCarruselDetalle(); m.classList.remove('open'); } };
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
