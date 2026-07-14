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
  if (!equiposCatalogo.length) await loadCatalogo();
  
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

const MARCA_LOGOS = {
  'Samsung'  : 'https://cdn.simpleicons.org/samsung/ffffff',
  'SAMSUNG'  : 'https://cdn.simpleicons.org/samsung/ffffff',
  'iPhone'   : 'https://cdn.simpleicons.org/apple/ffffff',
  'Iphone'   : 'https://cdn.simpleicons.org/apple/ffffff',
  'IPHONE'   : 'https://cdn.simpleicons.org/apple/ffffff',
  'Apple'    : 'https://cdn.simpleicons.org/apple/ffffff',
  'Xiaomi'   : 'https://cdn.simpleicons.org/xiaomi/ffffff',
  'XIAOMI'   : 'https://cdn.simpleicons.org/xiaomi/ffffff',
  'Motorola' : 'https://cdn.simpleicons.org/motorola/ffffff',
  'MOTOROLA' : 'https://cdn.simpleicons.org/motorola/ffffff',
  'Honor'    : 'https://cdn.simpleicons.org/honor/ffffff',
  'HONOR'    : 'https://cdn.simpleicons.org/honor/ffffff',
  'Huawei'   : 'https://cdn.simpleicons.org/huawei/ffffff',
  'HUAWEI'   : 'https://cdn.simpleicons.org/huawei/ffffff',
  'Oppo'     : 'https://cdn.simpleicons.org/oppo/ffffff',
  'OPPO'     : 'https://cdn.simpleicons.org/oppo/ffffff',
  'Vivo'     : 'https://cdn.simpleicons.org/vivo/ffffff',
  'VIVO'     : 'https://cdn.simpleicons.org/vivo/ffffff',
  'OnePlus'  : 'https://cdn.simpleicons.org/oneplus/ffffff',
  'Realme'   : 'https://cdn.simpleicons.org/realme/ffffff',
  'Infinix'  : 'https://cdn.simpleicons.org/infinix/ffffff',
  'INFINIX'  : 'https://cdn.simpleicons.org/infinix/ffffff',
  'Tecno'    : 'https://cdn.simpleicons.org/tecno/ffffff',
  'TECNO'    : 'https://cdn.simpleicons.org/tecno/ffffff',
};

function filterPub(cat, el) {
  pubFilter   = cat;
  marcaFiltro = '';
  document.querySelectorAll('.pill').forEach(function(p) { p.classList.remove('active'); });
  if (el) el.classList.add('active');

  var marcaBar = document.getElementById('marca-bar');
  var esTelefono = (cat === '' || cat === 'Teléfono' || cat === 'Telefonos' || cat === 'Teléfonos');

  if (esTelefono) {
    var marcas = [];
    equiposCatalogo.forEach(function(e) {
      if (e.marca && marcas.indexOf(e.marca) === -1) marcas.push(e.marca);
    });
    marcas.sort();

    var html = '<button onclick="filterMarca(\'\',this)" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px;border:2px solid var(--border);border-radius:12px;background:var(--green);cursor:pointer;min-width:80px;transition:all .2s" id="btn-marca-todas">' +
      '<span style="font-size:22px">🌐</span>' +
      '<span style="font-size:11px;font-weight:600;color:var(--bg)">Todas</span></button>';

    marcas.forEach(function(m) {
      var logo = MARCA_LOGOS[m] || MARCA_LOGOS[m.toLowerCase()];
      html += '<button onclick="filterMarca(\'' + m + '\',this)" ' +
        'style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px;border:2px solid var(--border);border-radius:12px;background:var(--surface,var(--bg2));cursor:pointer;min-width:80px;transition:all .2s" ' +
        'class="btn-marca-item" data-marca="' + m + '" ' +
        'onmouseover="this.style.borderColor=\'var(--green)\'" ' +
        'onmouseout="if(!this.classList.contains(\'activa\'))this.style.borderColor=\'var(--border)\'">' +
        (logo
          ? '<img src="' + logo + '" style="width:40px;height:40px;object-fit:contain;border-radius:8px;background:transparent;padding:4px" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'block\'">' +
            '<span style="display:none;font-size:22px">📱</span>'
          : '<span style="font-size:22px">📱</span>') +
        '<span style="font-size:11px;font-weight:600;color:var(--text2)">' + m + '</span></button>';
    });

    marcaBar.innerHTML =
      '<div id="marcas-slider" style="display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:12px 4px;scroll-behavior:smooth">' +
      '<style>#marcas-slider::-webkit-scrollbar{display:none}</style>' +
      '<button onclick="filterMarca(\'\',this)" id="btn-marca-todas" ' +
        'style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px;border:2px solid var(--green);border-radius:12px;background:var(--green);cursor:pointer;min-width:80px;flex-shrink:0;scroll-snap-align:start;transition:all .2s">' +
        '<span style="font-size:22px">🌐</span>' +
        '<span style="font-size:11px;font-weight:600;color:var(--bg)">Todas</span></button>' +
      marcas.map(function(m) {
        var logo = MARCA_LOGOS[m];
        return '<button onclick="filterMarca(\'' + m + '\',this)" ' +
          'style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px;border:2px solid var(--border);border-radius:12px;background:var(--surface,var(--bg2));cursor:pointer;min-width:80px;flex-shrink:0;scroll-snap-align:start;transition:all .2s" ' +
          'class="btn-marca-item" data-marca="' + m + '" ' +
          'onmouseover="this.style.borderColor=\'var(--green)\'" ' +
          'onmouseout="if(!this.classList.contains(\'activa\'))this.style.borderColor=\'var(--border)\'">' +
          (logo
            ? '<img src="' + logo + '" style="width:40px;height:40px;object-fit:contain;padding:4px" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'block\'">' +
              '<span style="display:none;font-size:22px">📱</span>'
            : '<span style="font-size:22px">📱</span>') +
          '<span style="font-size:11px;font-weight:600;color:var(--text2)">' + m + '</span></button>';
      }).join('') +
      '</div>' +
      '<div id="marcas-dots" style="display:flex;justify-content:center;gap:6px;margin-top:8px"></div>';

    // Dots de navegación
    var slider = marcaBar.querySelector('#marcas-slider');
    var dots   = marcaBar.querySelector('#marcas-dots');
    var total  = marcas.length + 1;
    var visible = window.innerWidth < 600 ? 3 : 6;
    var pages   = Math.ceil(total / visible);

    if (pages > 1) {
      for (var i = 0; i < pages; i++) {
        var dot = document.createElement('div');
        dot.style.cssText = 'width:' + (i===0?'20':'8') + 'px;height:8px;border-radius:4px;background:' + (i===0?'var(--green)':'var(--border)') + ';cursor:pointer;transition:all .3s';
        dot.setAttribute('data-page', i);
        dot.onclick = (function(idx) {
          return function() {
            var itemW = 100;
            slider.scrollTo({ left: idx * visible * itemW, behavior: 'smooth' });
          };
        })(i);
        dots.appendChild(dot);
      }
      slider.addEventListener('scroll', function() {
        var page = Math.round(slider.scrollLeft / (visible * 100));
        dots.querySelectorAll('div').forEach(function(d, idx) {
          d.style.width      = idx === page ? '20px' : '8px';
          d.style.background = idx === page ? 'var(--green)' : 'var(--border)';
        });
      });
    }

    marcaBar.style.display  = 'block';
    marcaBar.style.padding  = '4px 0';
  } else {
    marcaBar.style.display = 'none';
  }

  renderPublic();
}

function filterMarca(marca, btn) {
  marcaFiltro = marca;
  document.querySelectorAll('.btn-marca-item').forEach(function(b) {
    b.classList.remove('activa');
    b.style.borderColor = 'var(--border)';
    b.style.background  = 'var(--surface,var(--bg2))';
    b.querySelector('span:last-child').style.color = 'var(--text2)';
  });
  var todas = document.getElementById('btn-marca-todas');
  if (todas) {
    todas.style.background = marca === '' ? 'var(--green)' : 'var(--surface,var(--bg2))';
    todas.querySelector('span:last-child').style.color = marca === '' ? 'var(--bg)' : 'var(--text2)';
  }
  if (btn && btn !== todas) {
    btn.classList.add('activa');
    btn.style.borderColor = 'var(--green)';
    btn.style.background  = 'rgba(57,255,20,0.1)';
    btn.querySelector('span:last-child').style.color = 'var(--green)';
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
    + '<div style="font-size:11px;color:var(--text3);margin-bottom:2px">' + (eq.marca || '') + '</div>'
    + '<div class="prod-name" style="font-size:17px;margin-bottom:8px">' + (eq.modelo || '') + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' + specs + '</div>'
    + '<div class="prod-price">' + fmt(eq.precio_contado) + '</div>'
    + '<button class="consultar-btn" onclick="consultarEquipo(\'' + (eq.marca + ' ' + eq.modelo).replace(/\'/g,\'') + '\')">💬 Consultar / Comprar</button>'
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

function abrirDetalleEquipo(id) {
  var eq = equiposCatalogo.find(function(e) { return e.id === id; });
  if (!eq) return;

  var tags = [];
  try { tags = typeof eq.etiquetas === 'string' ? JSON.parse(eq.etiquetas||'[]') : (eq.etiquetas||[]); } catch(e) {}

  var GAMA_COLOR = { 'Entrada':'green', 'Media':'blue', 'Premium':'amber' };
  var TAG_COLOR  = { 'Economico':'green','Mas vendido':'amber','Recomendado':'blue','Premium':'muted','5G':'blue' };

  // Galería de imágenes
  var galeriaHtml = '';
  if (eq.imagen1 && eq.imagen2) {
    galeriaHtml = '<div style="position:relative;height:260px;overflow:hidden;border-radius:var(--radius);cursor:pointer;margin-bottom:16px" onclick="toggleDetImg(this)">' +
      '<img src="' + eq.imagen1 + '" data-img1="' + eq.imagen1 + '" data-img2="' + eq.imagen2 + '" style="width:100%;height:260px;object-fit:cover;transition:opacity .3s">' +
      '<div style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;padding:3px 10px;border-radius:20px">1/2 · toca para ver otra</div>' +
      '</div>';
  } else if (eq.imagen1) {
    galeriaHtml = '<div style="height:260px;overflow:hidden;border-radius:var(--radius);margin-bottom:16px">' +
      '<img src="' + eq.imagen1 + '" style="width:100%;height:260px;object-fit:cover"></div>';
  } else {
    galeriaHtml = '<div style="height:200px;display:flex;align-items:center;justify-content:center;font-size:72px;background:var(--surface2,var(--bg3));border-radius:var(--radius);margin-bottom:16px">📱</div>';
  }

  // Specs
  var specs = [
    eq.ram          ? { icon:'💾', label:'RAM',            val: eq.ram }          : null,
    eq.almacenamiento? { icon:'📦', label:'Almacenamiento', val: eq.almacenamiento } : null,
    eq.g5           ? { icon:'📶', label:'Conectividad',   val: '5G' }            : null,
    eq.gama         ? { icon:'⭐', label:'Gama',           val: eq.gama }         : null,
  ].filter(Boolean);

  var specsHtml = specs.length ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">' +
    specs.map(function(s) {
      return '<div style="background:var(--bg3,var(--surface2));border-radius:10px;padding:10px 14px">' +
        '<div style="font-size:11px;color:var(--text3);margin-bottom:3px">' + s.icon + ' ' + s.label + '</div>' +
        '<div style="font-weight:700;font-size:14px">' + s.val + '</div></div>';
    }).join('') + '</div>' : '';

  // Tags
  var tagsHtml = tags.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">' +
    tags.map(function(t) { return '<span class="badge ' + (TAG_COLOR[t]||'muted') + '">' + t + '</span>'; }).join('') +
    '</div>' : '';

  var nombre = (eq.marca || '') + ' ' + (eq.modelo || '');

  var modal = document.getElementById('modal-detalle-equipo');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-detalle-equipo';
    modal.className = 'overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML =
    '<div class="modal" style="max-width:520px">' +
    '<div class="modal-header">' +
    '<div class="modal-title">📱 ' + nombre + '</div>' +
    '<button class="close-btn" onclick="document.getElementById(\'modal-detalle-equipo\').classList.remove(\'open\')">×</button></div>' +
    galeriaHtml +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' +
    '<span class="badge ' + (GAMA_COLOR[eq.gama]||'muted') + '">' + eq.gama + '</span>' +
    (eq.g5 ? '<span class="badge blue">5G</span>' : '') +
    '</div>' +
    '<div style="font-size:13px;color:var(--text3);margin-bottom:2px">' + (eq.marca||'') + '</div>' +
    '<div style="font-size:22px;font-weight:800;margin-bottom:14px">' + (eq.modelo||'') + '</div>' +
    specsHtml +
    tagsHtml +
    '<div style="background:var(--bg3,var(--surface2));border-radius:10px;padding:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">' +
    '<div><div style="font-size:11px;color:var(--text3)">Precio contado</div>' +
    '<div style="font-size:24px;font-weight:800;color:var(--green)">' + fmt(eq.precio_contado) + '</div></div>' +
    '</div>' +
    '<div class="modal-footer" style="padding:0">' +
    '<button class="btn" onclick="document.getElementById(\'modal-detalle-equipo\').classList.remove(\'open\')">Cerrar</button>' +
    '<button class="consultar-btn" style="flex:1;margin:0" onclick="consultarEquipo(\'' + nombre.replace(/'/g,'') + '\')">💬 Consultar / Comprar</button>' +
    '</div></div>';

  modal.classList.add('open');
}

function toggleDetImg(container) {
  var img = container.querySelector('img');
  var lbl = container.querySelector('div');
  if (!img) return;
  var showing = img.dataset.showing || '1';
  if (showing === '1') {
    img.src = img.dataset.img2; img.dataset.showing = '2';
    if (lbl) lbl.textContent = '2/2 · toca para ver otra';
  } else {
    img.src = img.dataset.img1; img.dataset.showing = '1';
    if (lbl) lbl.textContent = '1/2 · toca para ver otra';
  }
}
