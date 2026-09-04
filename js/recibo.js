// ═══════════════════════════════════════════
//  recibo.js — ...
// ═══════════════════════════════════════════

// NEGOCIO vive ahora en js/negocio.js (fuente unica).

// Paleta monocroma — definida en negocio.js (fuente unica).
const TINTA       = NEGOCIO.doc.tinta;
const TINTA_SUAVE = NEGOCIO.doc.suave;
const LINEA       = NEGOCIO.doc.linea;
const FONDO_CAJA  = NEGOCIO.doc.caja;

// Logo en negro sobre transparente, 150px.
// Si mas adelante lo usan otros documentos, conviene moverlo a negocio.js.
const LOGO_BN_B64 = 'data:image/png;base64,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';


async function generarRecibo(tipo, id) {
  let datos = {};
  if (tipo === 'venta') {
    const v     = ventas.find(x => x.id === id);
    const misAb = abonos.filter(a => a.tipo === 'venta' && a.ref_id === id).sort((a,b) => a.id - b.id);
    const misCu = cuotas.filter(c => c.venta_id === id).sort((a,b) => a.numero - b.numero);
    const eq    = equiposFin.find(e => `${e.marca} ${e.modelo}` === v.producto);
    datos = {
      tipo          : 'VENTA',
      cliente       : v.cliente,
      detalle       : v.producto,
      fecha         : v.fecha,
      fechaPago     : today(),
      total         : parseFloat(v.precio),
      abonos        : misAb,
      cuotas        : misCu,
      pago          : v.pago,
      color         : v.color || '',
      ram           : eq ? eq.ram : '',
      almacenamiento: eq ? eq.almacenamiento : '',
      g5            : eq ? eq.g5 : false,
      esFinanciado  : misCu.length > 0 || v.pago === 'Financiado',
    };
  } else {
    const t     = tecnicos.find(x => x.id === id);
    const misAb = abonos.filter(a => a.tipo === 'tecnico' && a.ref_id === id).sort((a,b) => a.id - b.id);
    datos = {
      tipo       : 'SERVICIO TÉCNICO',
      cliente    : t.cliente,
      detalle    : t.equipo,
      diagnostico: t.diagnostico || '',
      obs        : t.obs || '',
      fecha      : t.fecha,
      fechaPago  : today(),
      total      : parseFloat(t.costo),
      abonos     : misAb,
      cuotas     : [],
      pago       : 'Servicio técnico',
    };
  }
  await dibujarRecibo(datos, tipo, id);
}

async function dibujarRecibo(datos, tipo, refId) {
  const W      = 800;
  const rowH   = 36;
  const abonosH = datos.abonos.length > 0 ? 40 + datos.abonos.length * rowH : 0;
  const cuotasH = datos.cuotas.length > 0 ? 40 + datos.cuotas.length * rowH : 0;

  // El alto se calcula del contenido real. Con fondo blanco un alto fijo
  // dejaba un bloque vacio muy visible cuando la venta no tenia cuotas.
  const esServicio = datos.tipo === 'SERVICIO TECNICO' || datos.tipo === 'SERVICIO TÉCNICO';
  const cajaH = esServicio && datos.diagnostico ? 160 : (datos.ram || datos.color ? 120 : 100);
  const H = 470 + cajaH + abonosH + cuotasH;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Fondo
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Franja superior
  ctx.fillStyle = TINTA;
  ctx.fillRect(0, 0, W, 8);

  // Logo
  const logo = new Image();
  logo.src = LOGO_BN_B64;
  await new Promise(r => { logo.onload = r; logo.onerror = r; });
  ctx.drawImage(logo, 40, 28, 90, 90);

  // Nombre negocio
  ctx.fillStyle = TINTA;
  ctx.font      = 'bold 28px Outfit, sans-serif';
  ctx.fillText(NEGOCIO.nombre, 148, 62);
  ctx.fillStyle = TINTA_SUAVE;
  ctx.font      = '15px Outfit, sans-serif';
  ctx.fillText(NEGOCIO.ciudad, 148, 86);
  ctx.fillText('Tel. ' + NEGOCIO.telefono, 148, 108);

  // Línea separadora
  ctx.strokeStyle = TINTA;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(40, 132);
  ctx.lineTo(W - 40, 132);
  ctx.stroke();

  // Título recibo
  let y = 162;
  ctx.fillStyle = TINTA;
  ctx.font      = 'bold 20px Outfit, sans-serif';
  ctx.fillText('RECIBO DE ' + datos.tipo, 40, y);
  ctx.fillStyle = TINTA_SUAVE;
  ctx.font      = '13px Outfit, sans-serif';
  ctx.fillText('N° ' + String(refId).padStart(6,'0') + ' · Emitido: ' + datos.fechaPago, 40, y + 22);

  // Caja de datos cliente
  y += 52;
  ctx.fillStyle = FONDO_CAJA;
  roundRect(ctx, 40, y, W - 80, cajaH, 10);
  ctx.fill();
  ctx.strokeStyle = LINEA; ctx.lineWidth = 1;
  roundRect(ctx, 40, y, W - 80, cajaH, 10);
  ctx.stroke();

  // Cliente (izquierda)
  ctx.fillStyle = TINTA_SUAVE;
  ctx.font      = '11px Outfit, sans-serif';
  ctx.fillText('CLIENTE', 60, y + 22);
  ctx.fillStyle = TINTA;
  ctx.font      = 'bold 16px Outfit, sans-serif';
  ctx.fillText(datos.cliente, 60, y + 44);

  // Detalle (izquierda)
  ctx.fillStyle = TINTA_SUAVE;
  ctx.font      = '11px Outfit, sans-serif';
  ctx.fillText('DETALLE', 60, y + 68);
  ctx.fillStyle = TINTA;
  ctx.font      = '14px Outfit, sans-serif';
  ctx.fillText(truncate(datos.detalle, 50), 60, y + 88);

  // Specs equipo (solo ventas)
  if (!esServicio && (datos.ram || datos.almacenamiento || datos.color)) {
    const specs = [datos.ram, datos.almacenamiento, datos.g5 ? '5G' : '', datos.color].filter(Boolean).join(' · ');
    ctx.fillStyle = TINTA_SUAVE;
    ctx.font      = '12px Outfit, sans-serif';
    ctx.fillText(specs, 60, y + 108);
  }

  // Diagnóstico (solo servicios)
  if (esServicio && datos.diagnostico) {
    ctx.fillStyle = TINTA_SUAVE;
    ctx.font      = '11px Outfit, sans-serif';
    ctx.fillText('DIAGNÓSTICO / SERVICIO', 60, y + 112);
    ctx.fillStyle = TINTA;
    ctx.font      = '12px Outfit, sans-serif';
    ctx.fillText(truncate(datos.diagnostico, 50), 60, y + 130);
  }

  // Fecha ingreso (derecha)
  ctx.fillStyle = TINTA_SUAVE;
  ctx.font      = '11px Outfit, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('FECHA INGRESO', W - 60, y + 22);
  ctx.fillStyle = TINTA;
  ctx.font      = '14px Outfit, sans-serif';
  ctx.fillText(datos.fecha, W - 60, y + 44);

  // Forma de pago (derecha) — solo para ventas
  if (!esServicio) {
    ctx.fillStyle = TINTA_SUAVE;
    ctx.font      = '11px Outfit, sans-serif';
    ctx.fillText('FORMA DE PAGO', W - 60, y + 68);
    ctx.fillStyle = TINTA;
    ctx.font      = '14px Outfit, sans-serif';
    ctx.fillText(datos.pago || '', W - 60, y + 88);
  }
  ctx.textAlign = 'left';

  // Total pagado
  y += cajaH + 16;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 40, y, W - 80, 72, 10);
  ctx.fill();
  ctx.strokeStyle = TINTA; ctx.lineWidth = 2;
  roundRect(ctx, 40, y, W - 80, 72, 10);
  ctx.stroke();
  ctx.fillStyle = TINTA_SUAVE;
  ctx.font      = '12px Outfit, sans-serif';
  ctx.fillText('VALOR TOTAL CANCELADO', 60, y + 24);
  ctx.fillStyle = TINTA;
  ctx.font      = 'bold 28px Outfit, sans-serif';
  ctx.fillText(fmt(datos.total), 60, y + 54);

  // Plan de cuotas
  y += 92;
  if (datos.cuotas.length > 0) {
    ctx.fillStyle = TINTA_SUAVE;
    ctx.font      = 'bold 12px Outfit, sans-serif';
    ctx.fillText('PLAN DE CUOTAS', 40, y + 2);
    y += 18;
    dibujarLinea(ctx, 40, y, W - 40, LINEA);
    y += 12;
    // Sin color disponible, el estado se marca con simbolo + palabra.
    const iconMap = { Pagada:'■', Vencida:'✕', Pendiente:'□' };
    datos.cuotas.forEach((c, i) => {
      ctx.fillStyle = c.estado === 'Pagada' ? TINTA : TINTA_SUAVE;
      ctx.font      = (c.estado === 'Vencida' ? 'bold ' : '') + '12px Outfit, sans-serif';
      ctx.fillText((iconMap[c.estado]||'□') + '  Cuota ' + c.numero + '  ·  ' + (c.estado||'') + '  ·  Vence: ' + c.fecha_venc + (c.fecha_pago ? '  ·  Pagada: ' + c.fecha_pago : ''), 50, y + rowH * i + 20);
      ctx.textAlign = 'right';
      ctx.fillText(fmt(c.monto), W - 60, y + rowH * i + 20);
      ctx.textAlign = 'left';
      if (i < datos.cuotas.length - 1) dibujarLinea(ctx, 50, y + rowH * i + 28, W - 50, LINEA);
    });
    y += datos.cuotas.length * rowH + 10;
  }

  // Historial de abonos
  if (datos.abonos.length > 0) {
    ctx.fillStyle = TINTA_SUAVE;
    ctx.font      = 'bold 12px Outfit, sans-serif';
    ctx.fillText('HISTORIAL DE PAGOS', 40, y + 2);
    y += 18;
    dibujarLinea(ctx, 40, y, W - 40, LINEA);
    y += 12;
    datos.abonos.forEach((a, i) => {
      ctx.fillStyle = TINTA_SUAVE;
      ctx.font      = '12px Outfit, sans-serif';
      ctx.fillText(a.fecha + (a.obs ? ' · ' + a.obs : ''), 50, y + rowH * i + 20);
      ctx.fillStyle = TINTA;
      ctx.textAlign = 'right';
      ctx.fillText(fmt(a.monto), W - 60, y + rowH * i + 20);
      ctx.textAlign = 'left';
      if (i < datos.abonos.length - 1) dibujarLinea(ctx, 50, y + rowH * i + 28, W - 50, LINEA);
    });
    y += datos.abonos.length * rowH + 10;
  }

  // Mensaje de agradecimiento
  y = H - 130;
  dibujarLinea(ctx, 40, y, W - 40, LINEA);
  y += 20;
  ctx.fillStyle = TINTA;
  ctx.font      = 'bold 14px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¡Gracias por tu confianza!', W / 2, y + 10);
  ctx.fillStyle = TINTA_SUAVE;
  ctx.font      = '12px Outfit, sans-serif';
  ctx.fillText('Este documento certifica que el pago ha sido recibido en su totalidad.', W / 2, y + 30);

  // Redes sociales
  y += 52;
  const redes = [
    { icon:'𝐟', label:NEGOCIO.facebook  },
    { icon:'◉', label:NEGOCIO.instagram },
    { icon:'♪', label:NEGOCIO.tiktok    },
    { icon:'▶', label:NEGOCIO.youtube   },
  ];
  const redW = (W - 80) / redes.length;
  redes.forEach((r, i) => {
    const rx = 40 + redW * i + redW / 2;
    ctx.font      = '11px Outfit, sans-serif';
    const anchoLabel = ctx.measureText(r.label).width;
    ctx.fillStyle = TINTA;
    ctx.font      = 'bold 14px Outfit, sans-serif';
    ctx.fillText(r.icon, rx - anchoLabel / 2 - 10, y + 18);
    ctx.fillStyle = TINTA_SUAVE;
    ctx.font      = '11px Outfit, sans-serif';
    ctx.fillText(r.label, rx + 6, y + 18);
  });
  ctx.textAlign = 'left';

  // Marca de agua PAZ Y SALVO — centrada e inclinada, por encima del
  // contenido para que no la tapen las cajas. La opacidad baja la deja
  // visible sin estorbar la lectura.
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-18 * Math.PI / 180);
  ctx.strokeStyle = TINTA;
  ctx.fillStyle   = TINTA;
  ctx.textAlign   = 'center';
  ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.lineWidth = 8;  ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 134, 0, Math.PI * 2); ctx.lineWidth = 2;  ctx.stroke();
  ctx.font = 'bold 40px Outfit, sans-serif';
  ctx.fillText('PAZ Y', 0, -14);
  ctx.fillText('SALVO', 0, 30);
  ctx.font = 'bold 18px Outfit, sans-serif';
  ctx.fillText(datos.fechaPago, 0, 68);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;

  // Franja inferior
  ctx.fillStyle = TINTA;
  ctx.fillRect(0, H - 8, W, 8);

  const dataURL = canvas.toDataURL('image/png');
  mostrarVistaPrevia(dataURL, datos, tipo, refId);
}

function mostrarVistaPrevia(dataURL, datos, tipo, refId) {
  const nombreArchivo = 'paz-y-salvo-' + datos.cliente.replace(/\s+/g,'-') + '-' + refId + '.png';
  const link = document.createElement('a');
  link.href = dataURL; link.download = nombreArchivo; link.click();
  const msg = encodeURIComponent(
    '✅ *PAZ Y SALVO — ' + NEGOCIO.nombre + '*\n\n' +
    'Estimado/a *' + datos.cliente + '*,\n' +
    'Le confirmamos que su ' + datos.tipo.toLowerCase() + ' ha sido cancelado en su totalidad.\n\n' +
    '📋 *Detalle:* ' + datos.detalle + '\n' +
    '💰 *Valor total:* ' + fmt(datos.total) + '\n' +
    '📅 *Fecha de pago:* ' + datos.fechaPago + '\n\n' +
    '¡Gracias por su confianza! 🙌\n' +
    '📞 ' + NEGOCIO.telefono + ' | ' + NEGOCIO.nombre
  );
  const waURL = 'https://wa.me/?text=' + msg;
  let m = document.getElementById('modal-recibo');
  if (!m) { m = document.createElement('div'); m.id='modal-recibo'; m.className='overlay'; document.body.appendChild(m); }
  m.innerHTML = '<div class="modal" style="max-width:660px">' +
    '<div class="modal-header"><div class="modal-title">📄 Paz y Salvo — ' + datos.cliente + '</div>' +
    '<button class="close-btn" onclick="document.getElementById(\'modal-recibo\').classList.remove(\'open\')">×</button></div>' +
    '<div style="text-align:center;margin-bottom:16px"><img src="' + dataURL + '" style="width:100%;border-radius:var(--radius);border:1px solid var(--border);cursor:zoom-in" onclick="window.open(\'' + dataURL + '\',\'_blank\')"></div>' +
    '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:14px">' +
    '<div style="font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.5px;text-transform:uppercase;margin-bottom:10px">Cómo compartir por WhatsApp</div>' +
    '<div style="display:flex;gap:0;align-items:stretch">' +
    '<div style="flex:1;text-align:center;padding:10px 8px"><div style="font-size:24px;margin-bottom:6px">⬇️</div><div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">Paso 1</div><div style="font-size:11px;color:var(--text2)">La imagen ya se descargó automáticamente</div><div style="margin-top:8px"><a href="' + dataURL + '" download="' + nombreArchivo + '"><button class="btn sm" style="font-size:11px">Descargar de nuevo</button></a></div></div>' +
    '<div style="width:1px;background:var(--border);margin:8px 0"></div>' +
    '<div style="flex:1;text-align:center;padding:10px 8px"><div style="font-size:24px;margin-bottom:6px">💬</div><div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">Paso 2</div><div style="font-size:11px;color:var(--text2)">Abre WhatsApp con el mensaje listo</div><div style="margin-top:8px"><a href="' + waURL + '" target="_blank"><button class="btn sm primary" style="font-size:11px;background:#25D366;border-color:#25D366">Abrir WhatsApp</button></a></div></div>' +
    '<div style="width:1px;background:var(--border);margin:8px 0"></div>' +
    '<div style="flex:1;text-align:center;padding:10px 8px"><div style="font-size:24px;margin-bottom:6px">📎</div><div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">Paso 3</div><div style="font-size:11px;color:var(--text2)">En WhatsApp toca el clip 📎 y selecciona la imagen</div></div>' +
    '</div></div>' +
    '<div class="alert info" style="font-size:12px">💡 <strong>En celular:</strong> la imagen se guarda en tu galería. <strong>En PC:</strong> se descarga en Descargas.</div>' +
    '<div class="modal-footer">' +
    '<button class="btn" onclick="document.getElementById(\'modal-recibo\').classList.remove(\'open\')">Cerrar</button>' +
    '<a href="' + dataURL + '" download="' + nombreArchivo + '"><button class="btn">⬇️ Descargar</button></a>' +
    '<a href="' + waURL + '" target="_blank"><button class="btn" style="background:#25D366;border-color:#25D366;color:#fff">💬 WhatsApp</button></a>' +
    '</div></div>';
  m.classList.add('open');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function dibujarLinea(ctx, x1, y, x2, color) {
  ctx.strokeStyle = color || '#1e3347'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
}

function truncate(str, max) {
  return str && str.length > max ? str.substring(0,max)+'...' : str||'';
}

async function generarComprobanteAbono(tipo, refId, monto, obs) {
  const W=800, H=520;
  const canvas=document.createElement('canvas');
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#101f2b'; ctx.fillRect(0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,W,0);
  grad.addColorStop(0,'#a4d65e'); grad.addColorStop(1,'#5ba3c9');
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,8);
  const logo=new Image(); logo.src=LOGO_B64;
  await new Promise(r=>{logo.onload=r;logo.onerror=r;});
  ctx.drawImage(logo,40,28,80,80);
  ctx.fillStyle='#e8f0f5'; ctx.font='bold 26px Outfit, sans-serif'; ctx.fillText(NEGOCIO.nombre,138,58);
  ctx.fillStyle='#8a9aa1'; ctx.font='14px Outfit, sans-serif'; ctx.fillText(NEGOCIO.ciudad,138,80); ctx.fillText('📞 '+NEGOCIO.telefono,138,100);
  ctx.fillStyle='#5ba3c9'; ctx.font='bold 18px Outfit, sans-serif'; ctx.textAlign='right'; ctx.fillText('COMPROBANTE DE PAGO',W-40,58);
  ctx.fillStyle='#8a9aa1'; ctx.font='12px Outfit, sans-serif'; ctx.fillText('Emitido: '+today(),W-40,78); ctx.textAlign='left';
  dibujarLinea(ctx,40,124,W-40);
  let cliente='',detalle='',total=0,ab=0,sal=0;
  if (tipo==='venta') { const v=ventas.find(x=>x.id===refId); cliente=v?.cliente||''; detalle=v?.producto||''; total=parseFloat(v?.precio)||0; ab=abonadoPor('venta',refId); sal=saldoPendiente('venta',refId,total); }
  else { const t=tecnicos.find(x=>x.id===refId); cliente=t?.cliente||''; detalle=t?.equipo||''; total=parseFloat(t?.costo)||0; ab=abonadoPor('tecnico',refId); sal=saldoPendiente('tecnico',refId,total); }
  const pct=Math.min(100,Math.round((ab/(total||1))*100));
  let y=140;
  ctx.fillStyle='#152535'; roundRect(ctx,40,y,W-80,80,10); ctx.fill();
  ctx.strokeStyle='#1e3347'; ctx.lineWidth=1; roundRect(ctx,40,y,W-80,80,10); ctx.stroke();
  ctx.fillStyle='#8a9aa1'; ctx.font='11px Outfit, sans-serif'; ctx.fillText('CLIENTE',60,y+20);
  ctx.fillStyle='#e8f0f5'; ctx.font='bold 15px Outfit, sans-serif'; ctx.fillText(cliente,60,y+40);
  ctx.fillStyle='#8a9aa1'; ctx.font='12px Outfit, sans-serif'; ctx.fillText(truncate(detalle,60),60,y+62);
  y+=100;
  const gradMonto=ctx.createLinearGradient(40,y,W-40,y);
  gradMonto.addColorStop(0,'rgba(164,214,94,0.15)'); gradMonto.addColorStop(1,'rgba(91,163,201,0.08)');
  ctx.fillStyle=gradMonto; roundRect(ctx,40,y,W-80,80,10); ctx.fill();
  ctx.strokeStyle='rgba(164,214,94,0.3)'; ctx.lineWidth=1; roundRect(ctx,40,y,W-80,80,10); ctx.stroke();
  ctx.fillStyle='#8a9aa1'; ctx.font='11px Outfit, sans-serif'; ctx.fillText('ABONO RECIBIDO',60,y+20);
  ctx.fillStyle='#a4d65e'; ctx.font='bold 30px Outfit, sans-serif'; ctx.fillText(fmt(monto),60,y+56);
  if (obs) { ctx.fillStyle='#8a9aa1'; ctx.font='12px Outfit, sans-serif'; ctx.textAlign='right'; ctx.fillText(obs,W-60,y+56); ctx.textAlign='left'; }
  y+=100;
  const colW=(W-80)/3;
  [{label:'TOTAL',value:fmt(total),color:'#e8f0f5'},{label:'TOTAL ABONADO',value:fmt(ab),color:'#a4d65e'},{label:'SALDO PENDIENTE',value:fmt(sal),color:sal>0?'#f5b847':'#a4d65e'}].forEach((item,i)=>{
    const cx=40+colW*i;
    ctx.fillStyle='#152535'; roundRect(ctx,cx+(i>0?6:0),y,colW-(i>0?6:0),70,8); ctx.fill();
    ctx.fillStyle='#8a9aa1'; ctx.font='10px Outfit, sans-serif'; ctx.fillText(item.label,cx+(i>0?16:10),y+20);
    ctx.fillStyle=item.color; ctx.font='bold 16px Outfit, sans-serif'; ctx.fillText(item.value,cx+(i>0?16:10),y+50);
  });
  y+=90;
  ctx.fillStyle='#1e3347'; roundRect(ctx,40,y,W-80,14,7); ctx.fill();
  ctx.fillStyle='#a4d65e'; roundRect(ctx,40,y,Math.max(14,(W-80)*pct/100),14,7); ctx.fill();
  ctx.fillStyle='#8a9aa1'; ctx.font='11px Outfit, sans-serif'; ctx.textAlign='right'; ctx.fillText(pct+'% pagado',W-40,y-4); ctx.textAlign='left';
  y+=30; dibujarLinea(ctx,40,y,W-40); y+=18;
  ctx.fillStyle='#e8f0f5'; ctx.font='bold 13px Outfit, sans-serif'; ctx.textAlign='center'; ctx.fillText('¡Gracias por tu abono!',W/2,y+8);
  ctx.fillStyle='#8a9aa1'; ctx.font='11px Outfit, sans-serif'; ctx.fillText(NEGOCIO.nombre+' · '+NEGOCIO.telefono,W/2,y+26); ctx.textAlign='left';
  const gradBot=ctx.createLinearGradient(0,H-8,W,H-8); gradBot.addColorStop(0,'#a4d65e'); gradBot.addColorStop(1,'#5ba3c9');
  ctx.fillStyle=gradBot; ctx.fillRect(0,H-8,W,8);
  const dataURL=canvas.toDataURL('image/png');
  const nombreArchivo='abono-'+cliente.replace(/\s+/g,'-')+'-'+refId+'.png';
  const link=document.createElement('a'); link.href=dataURL; link.download=nombreArchivo; link.click();
  const msg=encodeURIComponent('💳 *COMPROBANTE DE ABONO — '+NEGOCIO.nombre+'*\n\nEstimado/a *'+cliente+'*, hemos recibido su abono de *'+fmt(monto)+'*.\nSaldo pendiente: *'+fmt(sal)+'* ('+pct+'% pagado)\n\n📞 '+NEGOCIO.telefono+' | '+NEGOCIO.nombre);
  let m=document.getElementById('modal-comprobante');
  if (!m){m=document.createElement('div');m.id='modal-comprobante';m.className='overlay';document.body.appendChild(m);}
  m.innerHTML='<div class="modal" style="max-width:500px"><div class="modal-header"><div class="modal-title">💳 Comprobante de Abono</div><button class="close-btn" onclick="document.getElementById(\'modal-comprobante\').classList.remove(\'open\')">×</button></div><img src="'+dataURL+'" style="width:100%;border-radius:var(--radius);border:1px solid var(--border);margin-bottom:14px"><div class="modal-footer"><button class="btn" onclick="document.getElementById(\'modal-comprobante\').classList.remove(\'open\')">Cerrar</button><a href="'+dataURL+'" download="'+nombreArchivo+'"><button class="btn">⬇️ Descargar</button></a><a href="https://wa.me/?text='+msg+'" target="_blank"><button class="btn" style="background:#25D366;border-color:#25D366;color:#fff">💬 WhatsApp</button></a></div></div>';
  m.classList.add('open');
}
