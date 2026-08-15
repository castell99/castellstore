// ═══════════════════════════════════════════
//  inventario.js — CRUD Productos
// ═══════════════════════════════════════════

var _prodFile1 = null;
var _prodFile2 = null;

function prevProdFoto(input, slot) {
  var file = input.files[0];
  if (!file) return;
  if (slot === 1) _prodFile1 = file;
  if (slot === 2) _prodFile2 = file;
  var reader = new FileReader();
  reader.onload = function(e) {
    var prev = document.getElementById('prod-prev' + slot);
    if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

async function subirFotoProd(file, slot) {
  var ext    = file.name.split('.').pop();
  var nombre = 'producto_' + slot + '_' + Date.now() + '.' + ext;
  var res    = await fetch(SUPA + '/storage/v1/object/equipos-imagenes/' + nombre, {
    method: 'POST',
    headers: uploadHeaders(file.type),
    body: file,
  });
  if (!res.ok) throw new Error('Error subiendo imagen');
  return SUPA + '/storage/v1/object/public/equipos-imagenes/' + nombre;
}

function abrirNuevoProducto() {
  editProdId = null;
  varTemp    = [];
  _prodFile1 = null;
  _prodFile2 = null;
  document.getElementById('modal-prod-title').textContent = '📦 Agregar Producto';
  document.getElementById('btn-sp').textContent = 'Guardar producto';
  document.getElementById('p-nom').value         = '';
  document.getElementById('p-emoji').value       = '';
  document.getElementById('p-precio').value      = '';
  document.getElementById('p-precio-prov').value = '';
  document.getElementById('p-stock').value       = '1';
  document.getElementById('p-cat').value         = 'Computador';
  document.getElementById('sec-var').style.display = 'none';
  document.getElementById('var-list').innerHTML     = '';
  ['prod-prev1','prod-prev2'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.src = ''; el.style.display = 'none'; }
  });
  openModal('modal-producto');
}

function editarProducto(id) {
  var p = productos.find(function(x) { return x.id === id; });
  if (!p) return;
  editProdId = id;
  _prodFile1 = null;
  _prodFile2 = null;
  varTemp    = typeof p.variantes === 'string' ? JSON.parse(p.variantes || '[]') : (p.variantes || []);
  document.getElementById('modal-prod-title').textContent = '✏️ Editar Producto';
  document.getElementById('btn-sp').textContent = 'Actualizar producto';
  document.getElementById('p-nom').value         = p.nombre    || '';
  document.getElementById('p-emoji').value       = p.emoji     || '';
  document.getElementById('p-precio').value      = p.precio    || '';
  document.getElementById('p-precio-prov').value = p.precio_proveedor || '';
  document.getElementById('p-stock').value       = p.stock     ?? 0;
  setSelectVal('p-cat', p.categoria);

  // Mostrar fotos existentes
  ['1','2'].forEach(function(n) {
    var prev = document.getElementById('prod-prev' + n);
    var url  = p['imagen' + n];
    if (prev && url) { prev.src = url; prev.style.display = 'block'; }
    else if (prev)   { prev.src = ''; prev.style.display = 'none'; }
  });

  toggleVar();
  renderVarList();
  openModal('modal-producto');
}

async function guardarProducto() {
  var nom = document.getElementById('p-nom').value.trim();
  var pr  = parseFloat(document.getElementById('p-precio').value) || 0;
  if (!nom || !pr) { toast('Completa nombre y precio', 'err'); return; }

  setBtn('btn-sp', true, 'Guardando...');

  // Subir fotos si hay nuevas
  var img1 = editProdId ? (productos.find(function(x){return x.id===editProdId;})||{}).imagen1 || null : null;
  var img2 = editProdId ? (productos.find(function(x){return x.id===editProdId;})||{}).imagen2 || null : null;

  try {
    if (_prodFile1) img1 = await subirFotoProd(_prodFile1, 1);
    if (_prodFile2) img2 = await subirFotoProd(_prodFile2, 2);
  } catch(e) {
    toast('Error subiendo imagen', 'err');
    setBtn('btn-sp', false, 'Guardar producto');
    return;
  }

  var payload = {
    nombre           : nom,
    categoria        : document.getElementById('p-cat').value,
    precio           : pr,
    precio_proveedor : parseFloat(document.getElementById('p-precio-prov').value) || 0,
    stock            : parseInt(document.getElementById('p-stock').value) || 0,
    emoji            : document.getElementById('p-emoji').value || '📦',
    variantes        : JSON.stringify(varTemp),
    imagen1          : img1 || null,
    imagen2          : img2 || null,
  };

  try {
    if (editProdId) {
      await sb('productos', 'PATCH', payload, '?id=eq.' + editProdId);
      var idx = productos.findIndex(function(x) { return x.id === editProdId; });
      if (idx !== -1) productos[idx] = Object.assign({}, productos[idx], payload);
      toast('Producto actualizado ✓');
    } else {
      var res = await sb('productos', 'POST', payload);
      productos.unshift(res[0]);
      toast('Producto agregado ✓');
    }
    varTemp    = [];
    _prodFile1 = null;
    _prodFile2 = null;
    closeModal('modal-producto');
    renderInventario();
    renderDashboard();
  } catch (e) { toast('Error: ' + e.message, 'err'); }
  setBtn('btn-sp', false, 'Guardar producto');
}

async function updStock(id, val) {
  try {
    await sb('productos', 'PATCH', { stock: parseInt(val) || 0 }, '?id=eq.' + id);
    var p = productos.find(function(x) { return x.id === id; });
    if (p) p.stock = parseInt(val) || 0;
    toast('Stock actualizado', 'inf');
  } catch (e) { toast('Error', 'err'); }
}

async function delProd(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await sb('productos', 'DELETE', null, '?id=eq.' + id);
    productos = productos.filter(function(p) { return p.id !== id; });
    renderInventario();
    renderDashboard();
    toast('Producto eliminado');
  } catch (e) { toast('Error', 'err'); }
}

function renderInventario() {
  var tb = document.getElementById('tb-inv');
  if (!productos.length) {
    tb.innerHTML = '<tr class="empty-row"><td colspan="7">No hay productos. Agrega el primero.</td></tr>';
    return;
  }
  tb.innerHTML = productos.map(function(p) {
    var ganancia = p.precio_proveedor > 0 ? fmt(parseFloat(p.precio) - parseFloat(p.precio_proveedor)) : '—';
    var thumb    = p.imagen1
      ? '<img src="' + p.imagen1 + '" style="width:36px;height:36px;object-fit:cover;border-radius:6px;margin-right:6px;vertical-align:middle">'
      : '<span style="margin-right:6px;font-size:20px">' + (p.emoji || '📦') + '</span>';
    return '<tr>' +
      '<td>' + thumb + '<strong>' + p.nombre + '</strong></td>' +
      '<td><span class="badge blue">' + p.categoria + '</span></td>' +
      '<td style="font-family:var(--mono)">' + fmt(p.precio_proveedor || 0) + '</td>' +
      '<td style="font-family:var(--mono);font-weight:600">' + fmt(p.precio) + '</td>' +
      '<td style="font-family:var(--mono);color:var(--green)">' + ganancia + '</td>' +
      '<td><input type="number" value="' + p.stock + '" min="0" style="width:70px;font-size:12px;padding:4px 8px" onchange="updStock(' + p.id + ', this.value)"></td>' +
      '<td><span class="badge ' + (p.stock > 0 ? 'green' : 'red') + '">' + (p.stock > 0 ? 'Disponible' : 'Agotado') + '</span></td>' +
      '<td style="white-space:nowrap;display:flex;gap:4px;align-items:center">' +
        '<button class="btn sm" onclick="editarProducto(' + p.id + ')">✏️ Editar</button>' +
        '<button class="icon-btn" onclick="delProd(' + p.id + ')">🗑</button>' +
      '</td></tr>';
  }).join('');
}

function toggleVar() {
  var c = document.getElementById('p-cat').value;
  document.getElementById('sec-var').style.display = (c === 'Computador' || c === 'Teléfono') ? 'block' : 'none';
}

function addVar() {
  varTemp.push({ nombre: '', opciones: [{ label: '', delta: 0 }] });
  renderVarList();
}

function renderVarList() {
  document.getElementById('var-list').innerHTML = varTemp.map(function(v, i) {
    return '<div class="var-block">' +
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">' +
        '<input placeholder="Nombre (ej: Almacenamiento)" value="' + v.nombre + '" oninput="varTemp[' + i + '].nombre=this.value" style="flex:1;font-size:12px">' +
        '<button class="btn danger" onclick="varTemp.splice(' + i + ',1);renderVarList()">Quitar</button>' +
      '</div>' +
      v.opciones.map(function(o, j) {
        return '<div class="var-opt-row">' +
          '<input placeholder="Opción (ej: 256GB)" value="' + o.label + '" oninput="varTemp[' + i + '].opciones[' + j + '].label=this.value" style="flex:2;font-size:12px">' +
          '<input type="number" placeholder="+precio" value="' + (o.delta || '') + '" oninput="varTemp[' + i + '].opciones[' + j + '].delta=parseFloat(this.value)||0" style="width:95px;font-size:12px">' +
          '<button onclick="varTemp[' + i + '].opciones.splice(' + j + ',1);renderVarList()" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:16px">×</button>' +
        '</div>';
      }).join('') +
      '<button class="btn sm" onclick="varTemp[' + i + '].opciones.push({label:\'\',delta:0});renderVarList()" style="margin-top:6px;font-size:11px">+ Opción</button>' +
    '</div>';
  }).join('');
}
