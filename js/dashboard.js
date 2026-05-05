// ═══════════════════════════════════════════
//  dashboard.js — Resumen y estadísticas
// ═══════════════════════════════════════════

function renderDashboard() {
  const totV = ventas
    .filter(v => v.estado === 'Completada' || v.estado === 'Financiada')
    .reduce((s, v) => s + parseFloat(v.precio || 0), 0);

  const actTec = tecnicos.filter(t => t.estado !== 'Entregado').length;

  let saldoCobrar = 0;
  ventas.filter(v => v.estado === 'Financiada').forEach(v => {
    saldoCobrar += saldoPendiente('venta', v.id, v.precio);
  });
  tecnicos.filter(t => t.estado !== 'Entregado').forEach(t => {
    const s = saldoPendiente('tecnico', t.id, t.costo);
    if (s > 0) saldoCobrar += s;
  });

  document.getElementById('d-v').textContent  = fmt(totV);
  document.getElementById('d-p').textContent  = productos.length;
  document.getElementById('d-ta').textContent = actTec;
  document.getElementById('d-sc').textContent = fmt(saldoCobrar);

  const rows = [
    ...ventas.slice(0, 5).map(v => ({
      tipo: 'Venta', c: 'green',
      fecha: v.fecha, cli: v.cliente, det: v.producto, val: v.precio, est: v.estado
    })),
    ...tecnicos.slice(0, 5).map(t => ({
      tipo: 'Técnico', c: 'blue',
      fecha: t.fecha, cli: t.cliente, det: t.equipo, val: t.costo, est: t.estado
    }))
  ].sort((a, b) => b.fecha > a.fecha ? 1 : -1).slice(0, 6);

  document.getElementById('dash-tb').innerHTML = rows.length
    ? rows.map(r => `<tr>
        <td><span class="badge ${r.c}">${r.tipo}</span></td>
        <td style="color:var(--text3);font-size:11px">${r.fecha}</td>
        <td><strong>${r.cli}</strong></td>
        <td style="color:var(--text2)">${r.det}</td>
        <td style="font-family:var(--mono);font-weight:600">${fmt(r.val)}</td>
        <td><span class="badge ${r.est==='Completada'||r.est==='Entregado'?'green':r.est==='Cancelada'?'red':'amber'}">${r.est}</span></td>
      </tr>`).join('')
    : '<tr class="empty-row"><td colspan="6">Sin transacciones aún</td></tr>';
}
