// ═══════════════════════════════════════════
//  recibo.js — Generador de Paz y Salvo
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
  const H      = 780 + abonosH + cuotasH;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Fondo
  ctx.fillStyle = '#101f2b';
  ctx.fillRect(0, 0, W, H);

  // Franja superior
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#a4d65e');
  grad.addColorStop(1, '#5ba3c9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 8);

  // Logo
  const logo = new Image();
  logo.src = LOGO_B64;
  await new Promise(r => { logo.onload = r; logo.onerror = r; });
  ctx.drawImage(logo, 40, 28, 90, 90);

  // Nombre negocio
  ctx.fillStyle = '#e8f0f5';
  ctx.font      = 'bold 28px Outfit, sans-serif';
  ctx.fillText(NEGOCIO.nombre, 148, 62);
  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '15px Outfit, sans-serif';
  ctx.fillText(NEGOCIO.ciudad, 148, 86);
  ctx.fillText('📞 ' + NEGOCIO.telefono, 148, 108);

  // Línea separadora
  ctx.strokeStyle = '#1e3347';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(40, 132);
  ctx.lineTo(W - 40, 132);
  ctx.stroke();

  // Sello PAZ Y SALVO
  const selloX = W - 160, selloY = 38, selloR = 60;
  ctx.beginPath();
  ctx.arc(selloX, selloY + selloR, selloR, 0, Math.PI * 2);
  ctx.strokeStyle = '#a4d65e'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath();
  ctx.arc(selloX, selloY + selloR, selloR - 8, 0, Math.PI * 2);
  ctx.strokeStyle = '#a4d65e'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#a4d65e';
  ctx.font = 'bold 13px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAZ Y', selloX, selloY + selloR - 10);
  ctx.fillText('SALVO', selloX, selloY + selloR + 8);
  ctx.font = '22px Outfit, sans-serif';
  ctx.fillText('✓', selloX, selloY + selloR + 30);
  ctx.textAlign = 'left';

  // Título recibo
  let y = 162;
  ctx.fillStyle = '#a4d65e';
  ctx.font      = 'bold 20px Outfit, sans-serif';
  ctx.fillText('RECIBO DE ' + datos.tipo, 40, y);
  ctx.fillStyle = '#5ba3c9';
  ctx.font      = '13px Outfit, sans-serif';
  ctx.fillText('N° ' + String(refId).padStart(6,'0') + ' · Emitido: ' + datos.fechaPago, 40, y + 22);

  // Caja de datos cliente
  y += 52;
  const esServicio = datos.tipo === 'SERVICIO TÉCNICO';
  const cajaH = esServicio && datos.diagnostico ? 160 : (datos.ram || datos.color ? 120 : 100);

  ctx.fillStyle = '#152535';
  roundRect(ctx, 40, y, W - 80, cajaH, 10);
  ctx.fill();
  ctx.strokeStyle = '#1e3347'; ctx.lineWidth = 1;
  roundRect(ctx, 40, y, W - 80, cajaH, 10);
  ctx.stroke();

  // Cliente (izquierda)
  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '11px Outfit, sans-serif';
  ctx.fillText('CLIENTE', 60, y + 22);
  ctx.fillStyle = '#e8f0f5';
  ctx.font      = 'bold 16px Outfit, sans-serif';
  ctx.fillText(datos.cliente, 60, y + 44);

  // Detalle (izquierda)
  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '11px Outfit, sans-serif';
  ctx.fillText('DETALLE', 60, y + 68);
  ctx.fillStyle = '#e8f0f5';
  ctx.font      = '14px Outfit, sans-serif';
  ctx.fillText(truncate(datos.detalle, 50), 60, y + 88);

  // Specs equipo (solo ventas)
  if (!esServicio && (datos.ram || datos.almacenamiento || datos.color)) {
    const specs = [datos.ram, datos.almacenamiento, datos.g5 ? '5G' : '', datos.color].filter(Boolean).join(' · ');
    ctx.fillStyle = '#5ba3c9';
    ctx.font      = '12px Outfit, sans-serif';
    ctx.fillText(specs, 60, y + 108);
  }

  // Diagnóstico (solo servicios)
  if (esServicio && datos.diagnostico) {
    ctx.fillStyle = '#8a9aa1';
    ctx.font      = '11px Outfit, sans-serif';
    ctx.fillText('DIAGNÓSTICO / SERVICIO', 60, y + 112);
    ctx.fillStyle = '#e8f0f5';
    ctx.font      = '12px Outfit, sans-serif';
    ctx.fillText(truncate(datos.diagnostico, 50), 60, y + 130);
  }

  // Fecha ingreso (derecha)
  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '11px Outfit, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('FECHA INGRESO', W - 60, y + 22);
  ctx.fillStyle = '#e8f0f5';
  ctx.font      = '14px Outfit, sans-serif';
  ctx.fillText(datos.fecha, W - 60, y + 44);

  // Forma de pago (derecha) — solo para ventas
  if (!esServicio) {
    ctx.fillStyle = '#8a9aa1';
    ctx.font      = '11px Outfit, sans-serif';
    ctx.fillText('FORMA DE PAGO', W - 60, y + 68);
    ctx.fillStyle = '#e8f0f5';
    ctx.font      = '14px Outfit, sans-serif';
    ctx.fillText(datos.pago || '', W - 60, y + 88);
  }
  ctx.textAlign = 'left';

  // Total pagado
  y += cajaH + 16;
  const gradTotal = ctx.createLinearGradient(40, y, W - 40, y);
  gradTotal.addColorStop(0, 'rgba(164,214,94,0.15)');
  gradTotal.addColorStop(1, 'rgba(91,163,201,0.08)');
  ctx.fillStyle = gradTotal;
  roundRect(ctx, 40, y, W - 80, 72, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(164,214,94,0.3)'; ctx.lineWidth = 1;
  roundRect(ctx, 40, y, W - 80, 72, 10);
  ctx.stroke();
  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '12px Outfit, sans-serif';
  ctx.fillText('VALOR TOTAL CANCELADO', 60, y + 24);
  ctx.fillStyle = '#a4d65e';
  ctx.font      = 'bold 28px Outfit, sans-serif';
  ctx.fillText(fmt(datos.total), 60, y + 54);

  // Plan de cuotas
  y += 92;
  if (datos.cuotas.length > 0) {
    ctx.fillStyle = '#8a9aa1';
    ctx.font      = 'bold 12px Outfit, sans-serif';
    ctx.fillText('PLAN DE CUOTAS', 40, y + 2);
    y += 18;
    dibujarLinea(ctx, 40, y, W - 40);
    y += 12;
    const iconMap  = { Pagada:'✅', Vencida:'🔴', Pendiente:'🟡' };
    const colorMap = { Pagada:'#a4d65e', Vencida:'#f06b6b', Pendiente:'#f5b847' };
    datos.cuotas.forEach((c, i) => {
      ctx.fillStyle = colorMap[c.estado] || '#8a9aa1';
      ctx.font      = '12px Outfit, sans-serif';
      ctx.fillText((iconMap[c.estado]||'🟡') + ' Cuota ' + c.numero + '  ·  Vence: ' + c.fecha_venc + (c.fecha_pago ? '  ·  Pagada: ' + c.fecha_pago : ''), 50, y + rowH * i + 20);
      ctx.textAlign = 'right';
      ctx.fillText(fmt(c.monto), W - 60, y + rowH * i + 20);
      ctx.textAlign = 'left';
      if (i < datos.cuotas.length - 1) dibujarLinea(ctx, 50, y + rowH * i + 28, W - 50);
    });
    y += datos.cuotas.length * rowH + 10;
  }

  // Historial de abonos
  if (datos.abonos.length > 0) {
    ctx.fillStyle = '#8a9aa1';
    ctx.font      = 'bold 12px Outfit, sans-serif';
    ctx.fillText('HISTORIAL DE PAGOS', 40, y + 2);
    y += 18;
    dibujarLinea(ctx, 40, y, W - 40);
    y += 12;
    datos.abonos.forEach((a, i) => {
      ctx.fillStyle = '#e8f0f5';
      ctx.font      = '12px Outfit, sans-serif';
      ctx.fillText(a.fecha + (a.obs ? ' · ' + a.obs : ''), 50, y + rowH * i + 20);
      ctx.fillStyle = '#a4d65e';
      ctx.textAlign = 'right';
      ctx.fillText(fmt(a.monto), W - 60, y + rowH * i + 20);
      ctx.textAlign = 'left';
      if (i < datos.abonos.length - 1) dibujarLinea(ctx, 50, y + rowH * i + 28, W - 50);
    });
    y += datos.abonos.length * rowH + 10;
  }

  // Mensaje de agradecimiento
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

  // Redes sociales
  y += 52;
  const redes = [
    { icon:'𝐟', label:NEGOCIO.facebook,  color:'#1877F2' },
    { icon:'◉', label:NEGOCIO.instagram, color:'#E1306C' },
    { icon:'♪', label:NEGOCIO.tiktok,    color:'#a4d65e' },
    { icon:'▶', label:NEGOCIO.youtube,   color:'#FF0000' },
  ];
  const redW = (W - 80) / redes.length;
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

  // Franja inferior
  const gradBot = ctx.createLinearGradient(0, H - 8, W, H - 8);
  gradBot.addColorStop(0, '#a4d65e');
  gradBot.addColorStop(1, '#5ba3c9');
  ctx.fillStyle = gradBot;
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

function dibujarLinea(ctx, x1, y, x2) {
  ctx.strokeStyle='#1e3347'; ctx.lineWidth=1;
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
