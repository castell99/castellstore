// ═══════════════════════════════════════════
//  caja.js — Control de Caja (ingresos/egresos)
// ═══════════════════════════════════════════

let cajaMovs = [];

async function loadCaja() {
  try {
    const data = await sb('caja_movimientos', 'GET', null, '?order=id.desc');
    cajaMovs = Array.isArray(data) ? data : [];
  } catch (e) {
    cajaMovs = [];
  }
  renderCaja();
}

function abrirNuevoMovCaja() {
  document.getElementById('cm-tipo').value     = 'ingreso';
  document.getElementById('cm-concepto').value = '';
  document.getElementById('cm-monto').value    = '';
  openModal('modal-caja');
}

async function guardarMovCaja() {
  const tipo     = document.getElementById('cm-tipo').value;
  const concepto = document.getElementById('cm-concepto').value.trim();
  const monto    = parseFloat(document.getElementById('cm-monto').value) || 0;

  if (!concepto || !monto) { toast('Completa concepto y monto', 'err'); return; }

  setBtn('btn-cm', true, 'Guardar movimiento');
  try {
    const payload = {
      tipo, concepto, monto,
      origen: 'manual',
      ref_id: null,
      fecha: today(),
    };
    const [m] = await sb('caja_movimientos', 'POST', payload);
    cajaMovs.unshift(m || { ...payload, id: Date.now() });
    toast('Movimiento registrado ✓');
    closeModal('modal-caja');
    renderCaja();
  } catch (e) {
    toast('Error: ' + e.message, 'err');
  }
  setBtn('btn-cm', false, 'Guardar movimiento');
}

async function delMovCaja(id) {
  if (!confirm('¿Eliminar este movimiento?')) return;
  try { await sb('caja_movimientos', 'DELETE', null, `?id=eq.${id}`); } catch (_) {}
  cajaMovs = cajaMovs.filter(m => m.id !== id);
  renderCaja();
  toast('Movimiento eliminado');
}

// ── Registrar movimiento automático (llamado desde ventas/tecnicos) ──
async function registrarMovCajaAuto(tipo, concepto, monto, origen, ref_id) {
  if (!monto) return;
  try {
    const payload = { tipo, concepto, monto, origen, ref_id, fecha: today() };
    const [m] = await sb('caja_movimientos', 'POST', payload);
    cajaMovs.unshift(m || { ...payload, id: Date.now() });
  } catch (e) {
    console.warn('caja auto:', e.message);
  }
}

const ORIGEN_LABEL = { manual: '✏️ Manual', venta: '🛒 Venta', tecnico: '🔧 Servicio' };

function renderCaja() {
  const ingresos = cajaMovs.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + parseFloat(m.monto || 0), 0);
  const egresos  = cajaMovs.filter(m => m.tipo === 'egreso').reduce((s, m) => s + parseFloat(m.monto || 0), 0);
  const saldo    = ingresos - egresos;

  const el = id => document.getElementById(id);
  if (el('caja-saldo'))    el('caja-saldo').textContent    = fmt(saldo);
  if (el('caja-ingresos')) el('caja-ingresos').textContent = fmt(ingresos);
  if (el('caja-egresos'))  el('caja-egresos').textContent  = fmt(egresos);
  if (el('caja-total'))    el('caja-total').textContent    = cajaMovs.length;

  const tb = document.getElementById('tb-caja');
  if (!tb) return;

  if (!cajaMovs.length) {
    tb.innerHTML = '<tr class="empty-row"><td colspan="6">No hay movimientos registrados</td></tr>';
    return;
  }

  tb.innerHTML = cajaMovs.map(m => `
    <tr>
      <td style="font-size:11px;color:var(--text3)">${m.fecha}</td>
      <td>
        <span class="badge ${m.tipo === 'ingreso' ? 'green' : 'red'}">
          ${m.tipo === 'ingreso' ? '⬆️ Ingreso' : '⬇️ Egreso'}
        </span>
      </td>
      <td>${m.concepto}</td>
      <td><span class="badge muted">${ORIGEN_LABEL[m.origen] || m.origen}</span></td>
      <td style="font-family:var(--mono);font-weight:600;color:${m.tipo === 'ingreso' ? 'var(--green)' : 'var(--red)'}">
        ${m.tipo === 'ingreso' ? '+' : '-'}${fmt(m.monto)}
      </td>
      <td>
        ${m.origen === 'manual' ? `<button class="icon-btn" onclick="delMovCaja(${m.id})">🗑</button>` : ''}
      </td>
    </tr>`).join('');
}
