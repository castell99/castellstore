// ═══════════════════════════════════════════
//  catalogo.js — Catálogo público
// ═══════════════════════════════════════════

function filterPub(cat, el) {
  pubFilter = cat;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  renderPublic();
}

function renderPublic() {
  const prods = pubFilter
    ? productos.filter(p => p.categoria === pubFilter)
    : productos;
  const grid = document.getElementById('pub-grid');

  if (!prods.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:48px">No hay productos en esta categoría.</div>';
    return;
  }

  grid.innerHTML = prods.map(p => {
    const vars = typeof p.variantes === 'string'
      ? JSON.parse(p.variantes || '[]')
      : (p.variantes || []);
    const hasV = vars.length > 0;
    const disp = p.stock > 0;

    let cfg = '';
    if (hasV) {
      cfg = `<div class="config-box">
        <div class="config-box-title">⚙ Personaliza</div>
        ${vars.map((v, vi) => `
          <label>${v.nombre}</label>
          <select onchange="updPubPrice(${p.id})" id="ps-${p.id}-${vi}">
            ${v.opciones.map(o =>
              `<option value="${o.delta}">${o.label}${o.delta > 0 ? ' (+' + fmt(o.delta) + ')' : ''}</option>`
            ).join('')}
          </select>`).join('')}
      </div>`;
    }

    return `<div class="prod-card${!disp ? ' agotado' : ''}">
      <div class="prod-img">${p.emoji || '📦'}
        <span class="stock-tag">
          <span class="badge ${disp ? 'green' : 'red'}">${disp ? 'Disponible' : 'Agotado'}</span>
        </span>
      </div>
      <div class="prod-body">
        <div class="prod-cat">${p.categoria}</div>
        <div class="prod-name">${p.nombre}</div>
        <div class="prod-price" id="pp-${p.id}">${fmt(p.precio)}</div>
        ${cfg}
        <button class="consultar-btn"
          onclick="consultarProd('${p.nombre.replace(/'/g, "\\'")}')"
          ${!disp ? 'disabled' : ''}>
          ${disp ? 'Consultar / Comprar' : 'No disponible'}
        </button>
      </div>
    </div>`;
  }).join('');
}

function updPubPrice(pid) {
  const p = productos.find(x => x.id === pid);
  if (!p) return;
  const vars = typeof p.variantes === 'string'
    ? JSON.parse(p.variantes || '[]')
    : (p.variantes || []);
  let tot = parseFloat(p.precio) || 0;
  vars.forEach((v, vi) => {
    const s = document.getElementById(`ps-${pid}-${vi}`);
    if (s) tot += parseFloat(s.value) || 0;
  });
  const el = document.getElementById('pp-' + pid);
  if (el) el.textContent = fmt(tot);
}

function consultarProd(nom) {
  alert(`¡Gracias por tu interés en "${nom}"!\n\nComunícate con nosotros para confirmar disponibilidad, opciones de pago y financiamiento.`);
}
