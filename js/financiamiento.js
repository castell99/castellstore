// ═══════════════════════════════════════════
//  financiamiento.js — Calculadora de cuotas
// ═══════════════════════════════════════════

function calcFin() {
  const P   = parseFloat(document.getElementById('fin-p').value) || 0;
  const r   = parseFloat(document.getElementById('fin-t').value) || 3.5;
  const ini = parseFloat(document.getElementById('fin-i').value) || 0;
  const base = P - ini;
  const el  = document.getElementById('fin-out');

  if (!P) {
    el.innerHTML = '<p style="color:var(--text3);font-size:13px">Ingresa el precio para ver el plan.</p>';
    return;
  }

  let html = `
    <div class="fin-card">
      <div class="fin-hero">
        <div class="fin-lbl">Precio del equipo</div>
        <div class="fin-amount">${fmt(P)}</div>
        ${ini > 0 ? `<div class="fin-lbl" style="margin-top:4px">Cuota inicial: ${fmt(ini)} · Saldo a financiar: ${fmt(base)}</div>` : ''}
      </div>
      <table>
        <thead><tr><th>Plazo</th><th>Cuota/mes</th><th>Total</th><th>Intereses</th></tr></thead>
        <tbody>`;

  [2, 3, 4, 5, 6].forEach(n => {
    const c   = calcCuota(base, r, n);
    const tot = c * n + ini;
    const int = tot - P;
    html += `<tr>
      <td><strong>${n} meses</strong></td>
      <td style="font-family:var(--mono);color:var(--green);font-weight:600">${fmt(Math.round(c))}</td>
      <td style="font-family:var(--mono)">${fmt(Math.round(tot))}</td>
      <td style="color:var(--amber);font-family:var(--mono)">+${fmt(Math.round(int))}</td>
    </tr>`;
  });

  html += `</tbody></table></div>`;
  el.innerHTML = html;
}
