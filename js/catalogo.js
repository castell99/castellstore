// ═══════════════════════════════════════════
//  catalogo.js — Catálogo público
// ═══════════════════════════════════════════

let equiposCatalogo = [];

async function loadCatalogo() {
  try {
    const data = await sb('equipos_financiamiento', 'GET', null, '?order=id.desc&disponible=eq.true');
    equiposCatalogo = Array.isArray(data) ? data : [];
  } catch (e) {
    equiposCatalogo = [];
  }
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

  const prods = pubFilter
    ? productos.filter(p => p.categoria === pubFilter)
    : productos;

  const tarjetasEquipos = equipos.map(eq => renderTarjetaEquipo(eq));
  const tarjetasProds   = prods
    .filter(p => !equiposCatalogo.find(e => e.producto_id === p.id))
    .map(p => renderTarjetaProducto(p));

  const todas = [...tarjetasEquipos, ...tarjetasProds];

  if (!todas.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:48px">No hay productos disponibles.</div>';
    return;
  }
  grid.innerHTML = todas.join('');
}

function renderTarjetaEquipo(eq) {
  const tags = typeof eq.etiquetas === 'string'
    ? JSON.parse(eq.etiquetas || '[]') : (eq.etiquetas || []);

  const GAMA_COLOR = { 'Entrada':'green','Media':'blue','Premium':'amber' };
  const TAG_COLOR  = { 'Económico':'green','Más vendido':'amber','Recomendado':'blue','Premium':'muted','5G':'blue' };

  let imgHtml = '';
  if (eq.imagen1 && eq.imagen2) {
    imgHtml = `
      <div style="position:relative;height:200px;overflow:hidden;cursor:pointer" onclick="toggleCatImg(this)">
        <img src="${eq.imagen1}" data-img1="${eq.imagen1}" data-img2="${eq.imagen2}"
          style="width:100%;height:200px;object-fit:cove
