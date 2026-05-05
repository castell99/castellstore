// ═══════════════════════════════════════════
//  inventario.js — CRUD Productos
// ═══════════════════════════════════════════

// ── Abrir modal nuevo producto ────────────
function abrirNuevoProducto() {
  editProdId = null;
  varTemp    = [];
  document.getElementById('modal-prod-title').textContent = '📦 Agregar Producto';
  document.getElementById('btn-sp').textContent = 'Guardar producto';
  document.getElementById('p-nom').value    = '';
  document.getElementById('p-emoji').value  = '';
  document.getElementById('p-precio').value = '';
  document.getElementById('p-stock').value  = '1';
  document.getElementById('p-cat').value    = 'Computador';
  document.getElementById('sec-var').style.display = 'none';
  document.getElementById('var-list').innerHTML     = '';
  openModal('modal-producto');
}

// ── Abrir modal editar producto ───────────
function editarProducto(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;
  editProdId = id;
  varTemp    = typeof p.variantes === 'string'
    ? JSON.parse(p.variantes || '[]')
    : (p.variantes || []);

  document.getElementById('modal-prod-title').textContent = '✏️ Editar Producto';
  document.getElementById('btn-sp').textContent = 'Actualizar producto';
  document.getElementById('p-nom').value    = p.nombre    || '';
  document.getElementById('p-emoji').value  = p.emoji     || '';
  document.getElementById('p-precio').value = p.precio    || '';
  document.getElementById('p-stock').value  = p.stock     ?? 0;
  setSelectVal('p-cat', p.categoria);
  toggleVar();
  renderVarList();
  openModal('modal-producto');
}

// ── Guardar (crear o actualizar) ──────────
async function guardarProducto() {
  const nom = document.getElementById('p-nom').value.trim();
  const pr  = parseFloat(document.getElementById('p-precio').value) || 0;
  if (!nom || !pr) { toast('Completa nombre y precio', 'err'); return; }

  const payload = {
    nombre    : nom,
    categoria : document.getElementById('p-cat').value,
    precio    : pr,
    stock     : parseInt(document.getElementById('p-stock').value) || 0,
    emoji     : document.getElementById('p-emoji').value || '📦',
    variantes : JSON.stringify(varTemp),
  };

  setBtn('btn-sp', true, 'Guardar producto');
  try {
    if (editProdId) {
      // ── ACTUALIZAR ──
      await sb('productos', 'PATCH', payload, `?id=eq.${editProdId}`);
      const idx = productos.findIndex(x => x.id === editProdId);
      if (idx !== -1) productos[idx] = { ...productos[idx], ...payload };
      toast('Producto actualizado ✓');
    } else {
      // ── CREAR ──
      const [p] = await sb('productos', 'POST', payload);
      productos.unshift(p);
      toast('Producto agregado ✓');
    }
    varTemp = [];
    closeModal('modal-producto');
    renderInventario();
    renderPublic();
    renderDashboard();
  } catch (e) { toast('Error: ' + e.message, 'err'); }
  setBtn('btn-sp', false, 'Guardar producto');
}

// ── Actualizar stock inline ───────────────
async function updStock(id, val) {
  try {
    await sb('productos', 'PATCH', { stock: parseInt(val) || 0 }, `?id=eq.${id}`);
    const p = productos.find(x => x.id === id);
    if (p) p.stock = parseInt(val) || 0;
    renderPublic();
    toast('Stock actualizado', 'inf');
  } catch (e) { toast('Error', 'err'); }
}

// ── Eliminar producto ─────────────────────
async function delProd(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await sb('productos', 'DELETE', null, `?id=eq.${id}`);
    productos = productos.filter(p => p.id !== id);
    renderInventario();
    renderPublic();
    renderDashboard();
    toast('Producto eliminado');
  } catch (e) { toast('Error', 'err'); }
}

// ── Render tabla inventario ───────────────
function renderInventario() {
  const tb = document.getElementById('tb-inv');
  if (!productos.length) {
    tb.innerHTML = '<tr class="empty-row"><td colspan="6">No hay productos. Agrega el primero.</td></tr>';
    return;
  }
  tb.innerHTML = productos.map(p => `<tr>
    <td><strong>${p.emoji || '📦'} ${p.nombre}</strong></td>
    <td><span class="badge blue">${p.categoria}</span></td>
    <td style="font-family:var(--mono);font-weight:600">${fmt(p.precio)}</td>
    <td><input type="number" value="${p.stock}" min="0"
      style="width:70px;font-size:12px;padding:4px 8px"
      onchange="updStock(${p.id}, this.value)"></td>
    <td><span class="badge ${p.stock > 0 ? 'green' : 'red'}">${p.stock > 0 ? 'Disponible' : 'Agotado'}</span></td>
    <td style="white-space:nowrap;display:flex;gap:4px;align-items:center">
      <button class="btn sm" onclick="editarProducto(${p.id})" title="Editar">✏️ Editar</button>
      <button class="icon-btn" onclick="delProd(${p.id})" title="Eliminar">🗑</button>
    </td>
  </tr>`).join('');
}

// ── Constructor de variantes ──────────────
function toggleVar() {
  const c = document.getElementById('p-cat').value;
  document.getElementById('sec-var').style.display =
    (c === 'Computador' || c === 'Teléfono') ? 'block' : 'none';
}

function addVar() {
  varTemp.push({ nombre: '', opciones: [{ label: '', delta: 0 }] });
  renderVarList();
}

function renderVarList() {
  document.getElementById('var-list').innerHTML = varTemp.map((v, i) => `
    <div class="var-block">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <input placeholder="Nombre (ej: Almacenamiento)" value="${v.nombre}"
          oninput="varTemp[${i}].nombre=this.value" style="flex:1;font-size:12px">
        <button class="btn danger" onclick="varTemp.splice(${i},1);renderVarList()">Quitar</button>
      </div>
      ${v.opciones.map((o, j) => `
        <div class="var-opt-row">
          <input placeholder="Opción (ej: 256GB)" value="${o.label}"
            oninput="varTemp[${i}].opciones[${j}].label=this.value" style="flex:2;font-size:12px">
          <input type="number" placeholder="+precio" value="${o.delta || ''}"
            oninput="varTemp[${i}].opciones[${j}].delta=parseFloat(this.value)||0" style="width:95px;font-size:12px">
          <button onclick="varTemp[${i}].opciones.splice(${j},1);renderVarList()"
            style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:16px">×</button>
        </div>`).join('')}
      <button class="btn sm"
        onclick="varTemp[${i}].opciones.push({label:'',delta:0});renderVarList()"
        style="margin-top:6px;font-size:11px">+ Opción</button>
    </div>`).join('');
}
