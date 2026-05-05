// ═══════════════════════════════════════════
//  recibo.js — Generador de Paz y Salvo
//  Genera imagen PNG con logo, detalle de
//  cuotas/abonos y botón de compartir WhatsApp
// ═══════════════════════════════════════════

const NEGOCIO = {
  nombre   : 'CastellStore',
  telefono : '301 719 2825',
  whatsapp : '573017192825',
  facebook : 'castellstore',
  instagram: 'castellstore',
  tiktok   : 'castellstore',
  youtube  : 'CastellStore',
  ciudad   : 'Cartagena, Colombia',
};

// ── Generar recibo de venta ───────────────
async function generarRecibo(tipo, id) {
  let datos = {};

  if (tipo === 'venta') {
    const v       = ventas.find(x => x.id === id);
    const misAb   = abonos.filter(a => a.tipo === 'venta' && a.ref_id === id).sort((a,b) => a.id - b.id);
    const misCu   = cuotas.filter(c => c.venta_id === id).sort((a,b) => a.numero - b.numero);
    datos = {
      tipo      : 'VENTA',
      cliente   : v.cliente,
      detalle   : v.producto,
      fecha     : v.fecha,
      fechaPago : today(),
      total     : parseFloat(v.precio),
      abonos    : misAb,
      cuotas    : misCu,
      pago      : v.pago,
    };
  } else {
    const t     = tecnicos.find(x => x.id === id);
    const misAb = abonos.filter(a => a.tipo === 'tecnico' && a.ref_id === id).sort((a,b) => a.id - b.id);
    datos = {
      tipo      : 'SERVICIO TÉCNICO',
      cliente   : t.cliente,
      detalle   : `${t.equipo}${t.diagnostico ? ' — ' + t.diagnostico : ''}`,
      fecha     : t.fecha,
      fechaPago : today(),
      total     : parseFloat(t.costo),
      abonos    : misAb,
      cuotas    : [],
      pago      : 'Servicio técnico',
    };
  }

  await dibujarRecibo(datos, tipo, id);
}

// ── Motor de dibujo en Canvas ─────────────
async function dibujarRecibo(datos, tipo, refId) {
  const W = 800;
  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d');

  // Calcular altura dinámica
  const baseH    = 780;
  const rowH     = 36;
  const abonosH  = datos.abonos.length  > 0 ? 40 + datos.abonos.length  * rowH : 0;
  const cuotasH  = datos.cuotas.length  > 0 ? 40 + datos.cuotas.length  * rowH : 0;
  const H        = baseH + abonosH + cuotasH;

  canvas.width  = W;
  canvas.height = H;

  // ── Fondo ──
  ctx.fillStyle = '#101f2b';
  ctx.fillRect(0, 0, W, H);

  // ── Franja superior verde ──
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#a4d65e');
  grad.addColorStop(1, '#5ba3c9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 8);

  // ── Logo ──
  const logo = new Image();
  logo.src   = LOGO_B64;
  await new Promise(r => { logo.onload = r; logo.onerror = r; });
  ctx.drawImage(logo, 40, 28, 90, 90);

  // ── Nombre negocio ──
  ctx.fillStyle = '#e8f0f5';
  ctx.font      = 'bold 28px Outfit, sans-serif';
  ctx.fillText(NEGOCIO.nombre, 148, 62);

  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '15px Outfit, sans-serif';
  ctx.fillText(NEGOCIO.ciudad, 148, 86);
  ctx.fillText(`📞 ${NEGOCIO.telefono}`, 148, 108);

  // ── Línea separadora ──
  ctx.strokeStyle = '#1e3347';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(40, 132);
  ctx.lineTo(W - 40, 132);
  ctx.stroke();

  // ── Sello PAZ Y SALVO ──
  const selloX = W - 160;
  const selloY = 38;
  const selloR = 60;

  // Círculo exterior
  ctx.beginPath();
  ctx.arc(selloX, selloY + selloR, selloR, 0, Math.PI * 2);
  ctx.strokeStyle = '#a4d65e';
  ctx.lineWidth   = 3;
  ctx.stroke();

  // Círculo interior
  ctx.beginPath();
  ctx.arc(selloX, selloY + selloR, selloR - 8, 0, Math.PI * 2);
  ctx.strokeStyle = '#a4d65e';
  ctx.lineWidth   = 1;
  ctx.stroke();

  ctx.fillStyle   = '#a4d65e';
  ctx.font        = 'bold 13px Outfit, sans-serif';
  ctx.textAlign   = 'center';
  ctx.fillText('PAZ Y', selloX, selloY + selloR - 10);
  ctx.fillText('SALVO', selloX, selloY + selloR + 8);
  ctx.font        = '22px Outfit, sans-serif';
  ctx.fillText('✓', selloX, selloY + selloR + 30);
  ctx.textAlign   = 'left';

  // ── Título recibo ──
  let y = 162;
  ctx.fillStyle = '#a4d65e';
  ctx.font      = 'bold 20px Outfit, sans-serif';
  ctx.fillText(`RECIBO DE ${datos.tipo}`, 40, y);

  ctx.fillStyle = '#5ba3c9';
  ctx.font      = '13px Outfit, sans-serif';
  ctx.fillText(`N° ${String(refId).padStart(6,'0')} · Emitido: ${datos.fechaPago}`, 40, y + 22);

  // ── Caja de datos cliente ──
  y += 52;
  ctx.fillStyle = '#152535';
  roundRect(ctx, 40, y, W - 80, 100, 10);
  ctx.fill();
  ctx.strokeStyle = '#1e3347';
  ctx.lineWidth   = 1;
  roundRect(ctx, 40, y, W - 80, 100, 10);
  ctx.stroke();

  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '11px Outfit, sans-serif';
  ctx.fillText('CLIENTE', 60, y + 22);
  ctx.fillStyle = '#e8f0f5';
  ctx.font      = 'bold 16px Outfit, sans-serif';
  ctx.fillText(datos.cliente, 60, y + 44);

  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '11px Outfit, sans-serif';
  ctx.fillText('DETALLE', 60, y + 68);
  ctx.fillStyle = '#e8f0f5';
  ctx.font      = '14px Outfit, sans-serif';
  ctx.fillText(truncate(datos.detalle, 70), 60, y + 88);

  // Fecha ingreso (derecha)
  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '11px Outfit, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('FECHA INGRESO', W - 60, y + 22);
  ctx.fillStyle = '#e8f0f5';
  ctx.font      = '14px Outfit, sans-serif';
  ctx.fillText(datos.fecha, W - 60, y + 44);
  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '11px Outfit, sans-serif';
  ctx.fillText('FORMA DE PAGO', W - 60, y + 68);
  ctx.fillStyle = '#e8f0f5';
  ctx.font      = '14px Outfit, sans-serif';
  ctx.fillText(datos.pago, W - 60, y + 88);
  ctx.textAlign = 'left';

  // ── Total pagado ──
  y += 120;
  const gradTotal = ctx.createLinearGradient(40, y, W - 40, y);
  gradTotal.addColorStop(0, 'rgba(164,214,94,0.15)');
  gradTotal.addColorStop(1, 'rgba(91,163,201,0.08)');
  ctx.fillStyle = gradTotal;
  roundRect(ctx, 40, y, W - 80, 72, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(164,214,94,0.3)';
  ctx.lineWidth   = 1;
  roundRect(ctx, 40, y, W - 80, 72, 10);
  ctx.stroke();

  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '12px Outfit, sans-serif';
  ctx.fillText('VALOR TOTAL CANCELADO', 60, y + 24);
  ctx.fillStyle = '#a4d65e';
  ctx.font      = 'bold 28px Outfit, sans-serif';
  ctx.fillText(fmt(datos.total), 60, y + 54);

  // ── Detalle de cuotas (si aplica) ──
  y += 92;
  if (datos.cuotas.length > 0) {
    ctx.fillStyle = '#8a9aa1';
    ctx.font      = 'bold 12px Outfit, sans-serif';
    ctx.fillText('PLAN DE CUOTAS', 40, y + 2);
    y += 18;
    dibujarLinea(ctx, 40, y, W - 40);
    y += 12;

    ctx.font = '12px Outfit, sans-serif';
    datos.cuotas.forEach((c, i) => {
      const iconMap  = { Pagada: '✅', Vencida: '🔴', Pendiente: '🟡' };
      const colorMap = { Pagada: '#a4d65e', Vencida: '#f06b6b', Pendiente: '#f5b847' };
      ctx.fillStyle = colorMap[c.estado] || '#8a9aa1';
      ctx.fillText(`${iconMap[c.estado] || '🟡'} Cuota ${c.numero}  ·  Vence: ${c.fecha_venc}${c.fecha_pago ? '  ·  Pagada: ' + c.fecha_pago : ''}`, 50, y + rowH * i + 20);
      ctx.textAlign = 'right';
      ctx.fillText(fmt(c.monto), W - 60, y + rowH * i + 20);
      ctx.textAlign = 'left';
      if (i < datos.cuotas.length - 1) dibujarLinea(ctx, 50, y + rowH * i + 28, W - 50);
    });
    y += datos.cuotas.length * rowH + 10;
  }

  // ── Historial de abonos ──
  if (datos.abonos.length > 0) {
    ctx.fillStyle = '#8a9aa1';
    ctx.font      = 'bold 12px Outfit, sans-serif';
    ctx.fillText('HISTORIAL DE PAGOS', 40, y + 2);
    y += 18;
    dibujarLinea(ctx, 40, y, W - 40);
    y += 12;

    ctx.font = '12px Outfit, sans-serif';
    datos.abonos.forEach((a, i) => {
      ctx.fillStyle = '#e8f0f5';
      const obs = a.obs ? ` · ${a.obs}` : '';
      ctx.fillText(`${a.fecha}${obs}`, 50, y + rowH * i + 20);
      ctx.fillStyle = '#a4d65e';
      ctx.textAlign = 'right';
      ctx.fillText(fmt(a.monto), W - 60, y + rowH * i + 20);
      ctx.textAlign = 'left';
      if (i < datos.abonos.length - 1) dibujarLinea(ctx, 50, y + rowH * i + 28, W - 50);
    });
    y += datos.abonos.length * rowH + 10;
  }

  // ── Mensaje de agradecimiento ──
  y = H - 130;
  dibujarLinea(ctx, 40, y, W - 40);
  y += 20;
  ctx.fillStyle = '#e8f0f5';
  ctx.font      = 'bold 14px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¡Gracias por tu confianza!', W / 2, y + 10);
  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '12px Outfit, sans-serif';
  ctx.fillText('Este documento certifica que el pago ha sido recibido en su totalidad.', W / 2, y + 30);

  // ── Redes sociales ──
  y += 52;
  const redes = [
    { icon: '𝐟', label: NEGOCIO.facebook,  color: '#1877F2' },
    { icon: '◉', label: NEGOCIO.instagram, color: '#E1306C' },
    { icon: '♪', label: NEGOCIO.tiktok,    color: '#a4d65e' },
    { icon: '▶', label: NEGOCIO.youtube,   color: '#FF0000' },
  ];
  const redW  = (W - 80) / redes.length;
  redes.forEach((r, i) => {
    const rx = 40 + redW * i + redW / 2;
    ctx.fillStyle = r.color;
    ctx.font      = 'bold 14px Outfit, sans-serif';
    ctx.fillText(r.icon, rx - 30, y + 18);
    ctx.fillStyle = '#8a9aa1';
    ctx.font      = '11px Outfit, sans-serif';
    ctx.fillText(r.label, rx - 22, y + 18);
  });
  ctx.textAlign = 'left';

  // ── Franja inferior ──
  const gradBot = ctx.createLinearGradient(0, H - 8, W, H - 8);
  gradBot.addColorStop(0, '#a4d65e');
  gradBot.addColorStop(1, '#5ba3c9');
  ctx.fillStyle = gradBot;
  ctx.fillRect(0, H - 8, W, 8);

  // ── Mostrar modal de vista previa ──
  const dataURL = canvas.toDataURL('image/png');
  mostrarVistaPrevia(dataURL, datos, tipo, refId);
}

// ── Vista previa y compartir ──────────────
function mostrarVistaPrevia(dataURL, datos, tipo, refId) {
  // Crear/reutilizar modal de recibo
  let m = document.getElementById('modal-recibo');
  if (!m) {
    m = document.createElement('div');
    m.id        = 'modal-recibo';
    m.className = 'overlay';
    document.body.appendChild(m);
  }

  const tel    = NEGOCIO.whatsapp;
  const msg    = encodeURIComponent(
    `✅ *PAZ Y SALVO — ${NEGOCIO.nombre}*\n\n` +
    `Estimado/a *${datos.cliente}*,\n` +
    `Le confirmamos que su ${datos.tipo.toLowerCase()} por *${fmt(datos.total)}* ` +
    `ha sido cancelado en su totalidad.\n\n` +
    `📋 Detalle: ${datos.detalle}\n` +
    `📅 Fecha: ${datos.fechaPago}\n\n` +
    `¡Gracias por su confianza! 🙌\n` +
    `📞 ${NEGOCIO.telefono}`
  );
  const waURL  = `https://wa.me/${tel}?text=${msg}`;

  m.innerHTML = `
    <div class="modal" style="max-width:640px">
      <div class="modal-header">
        <div class="modal-title">📄 Paz y Salvo — ${datos.cliente}</div>
        <button class="close-btn" onclick="document.getElementById('modal-recibo').classList.remove('open')">×</button>
      </div>
      <div style="text-align:center;margin-bottom:16px">
        <img src="${dataURL}" style="width:100%;border-radius:var(--radius);border:1px solid var(--border)" alt="Paz y Salvo">
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
        <a href="${dataURL}" download="paz-y-salvo-${datos.cliente.replace(/\s+/g,'-')}.png">
          <button class="btn primary" style="gap:8px">⬇️ Descargar imagen</button>
        </a>
        <a href="${waURL}" target="_blank">
          <button class="btn" style="background:#25D366;border-color:#25D366;color:#fff;gap:8px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Compartir por WhatsApp
          </button>
        </a>
      </div>
      <p style="font-size:11px;color:var(--text3);text-align:center;margin-top:12px">
        Descarga la imagen y adjúntala al chat de WhatsApp con tu cliente
      </p>
    </div>`;
  m.classList.add('open');
}

// ── Helpers de canvas ─────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function dibujarLinea(ctx, x1, y, x2) {
  ctx.strokeStyle = '#1e3347';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function truncate(str, max) {
  return str && str.length > max ? str.substring(0, max) + '...' : str || '';
}
