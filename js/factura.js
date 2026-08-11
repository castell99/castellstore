// ═══════════════════════════════════════════
//  factura.js — Factura de Venta + Paz y Salvo PDF
//  CastellStore · Carlos Castro Elles
// ═══════════════════════════════════════════

var FACTURA_VENDEDOR = {
  nombre   : 'Carlos Castro Elles',
  cedula   : '1052740183',
  direccion: 'Cra 18 N 10-53 Villanueva, Bolivar',
  telefono : '304 601 9483',
  negocio  : 'CastellStore',
  web      : 'castell99.github.io/castellstore',
};

var GARANTIA_NO_APLICA = [
  'Danos de display',
  'Humedad',
  'Bloqueo de telefono por no registro',
  'Danos fisicos del equipo',
  'Equipos abiertos',
  'Baterias en mal uso',
];

function numeroALetras(num) {
  var unidades = ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
    'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISEIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
  var decenas  = ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
  var centenas = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS',
    'SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];
  if (num === 0) return 'CERO';
  if (num === 100) return 'CIEN';
  var resultado = '';
  if (num >= 1000000) {
    var m = Math.floor(num/1000000);
    resultado += (m===1?'UN MILLON':numeroALetras(m)+' MILLONES');
    num %= 1000000; if(num>0) resultado+=' ';
  }
  if (num >= 1000) {
    var m2 = Math.floor(num/1000);
    resultado += (m2===1?'MIL':numeroALetras(m2)+' MIL');
    num %= 1000; if(num>0) resultado+=' ';
  }
  if (num >= 100) {
    resultado += centenas[Math.floor(num/100)];
    num %= 100; if(num>0) resultado+=' ';
  }
  if (num >= 20) {
    resultado += decenas[Math.floor(num/10)];
    num %= 10; if(num>0) resultado+=' Y '+unidades[num];
  } else if (num > 0) {
    resultado += unidades[num];
  }
  return resultado.trim();
}

// ── Modal selección tamaño + firma ───────
function generarFacturaVenta(ventaId) {
  var v = ventas.find(function(x){return x.id===ventaId;});
  if (!v) return;

  var m = document.getElementById('modal-factura-opciones');
  if (!m) { m=document.createElement('div'); m.id='modal-factura-opciones'; m.className='overlay'; document.body.appendChild(m); }

  m.innerHTML = '<div class="modal" style="max-width:400px">' +
    '<div class="modal-header"><div class="modal-title">🧾 Generar Factura</div>' +
    '<button class="close-btn" onclick="document.getElementById(\'modal-factura-opciones\').classList.remove(\'open\')">×</button></div>' +
    '<div style="padding:4px 0">' +
    '<p style="font-size:12px;color:var(--text2);margin-bottom:12px">Selecciona tamaño de papel:</p>' +
    '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">' +
    '<button class="btn" style="justify-content:flex-start;gap:10px" onclick="_facturaSize=\'letter\';_facturaVentaId='+ventaId+';mostrarOpcionFirmaFactura()">' +
      '<span style="font-size:20px">📄</span><div style="text-align:left"><div style="font-weight:600">Carta (Letter)</div><div style="font-size:11px;color:var(--text3)">21.6 x 27.9 cm — Impresoras normales</div></div></button>' +
    '<button class="btn" style="justify-content:flex-start;gap:10px" onclick="_facturaSize=\'5x7\';_facturaVentaId='+ventaId+';mostrarOpcionFirmaFactura()">' +
      '<span style="font-size:20px">🧾</span><div style="text-align:left"><div style="font-weight:600">Comprobante 5×7</div><div style="font-size:11px;color:var(--text3)">12.7 x 17.8 cm — Impresoras de tickets</div></div></button>' +
    '</div></div>' +
    '<div class="modal-footer"><button class="btn" onclick="document.getElementById(\'modal-factura-opciones\').classList.remove(\'open\')">Cancelar</button></div>' +
    '</div>';
  m.classList.add('open');
}

var _facturaSize = 'letter';
var _facturaVentaId = null;
var _facturaFirmaCliFile = null;
var _facturaFirmaVenFile = null;
var _facturaFirmaCli = false;
var _facturaFirmaVen = false;

function mostrarOpcionFirmaFactura() {
  document.getElementById('modal-factura-opciones').classList.remove('open');
  var m = document.getElementById('modal-factura-firma');
  if (!m) { m=document.createElement('div'); m.id='modal-factura-firma'; m.className='overlay'; document.body.appendChild(m); }

  m.innerHTML = '<div class="modal" style="max-width:400px">' +
    '<div class="modal-header"><div class="modal-title">✍️ Tipo de firma</div>' +
    '<button class="close-btn" onclick="document.getElementById(\'modal-factura-firma\').classList.remove(\'open\')">×</button></div>' +
    '<div style="display:flex;flex-direction:column;gap:10px;padding:4px 0">' +
    '<button class="btn primary" style="justify-content:flex-start;gap:10px" onclick="document.getElementById(\'modal-factura-firma\').classList.remove(\'open\');abrirFirmasFactura()">' +
      '<span style="font-size:20px">✍️</span><div style="text-align:left"><div style="font-weight:600">Firmar digitalmente</div><div style="font-size:11px;opacity:.8">Canvas para firmar con dedo o mouse</div></div></button>' +
    '<button class="btn" style="justify-content:flex-start;gap:10px" onclick="document.getElementById(\'modal-factura-firma\').classList.remove(\'open\');_facturaFirmaCli=false;_facturaFirmaVen=false;construirFacturaPDF(_facturaVentaId,_facturaSize,null,null)">' +
      '<span style="font-size:20px">🖨️</span><div style="text-align:left"><div style="font-weight:600">Imprimir y firmar a mano</div><div style="font-size:11px;color:var(--text3)">Genera PDF con espacios en blanco</div></div></button>' +
    '</div>' +
    '<div class="modal-footer"><button class="btn" onclick="document.getElementById(\'modal-factura-firma\').classList.remove(\'open\')">Cancelar</button></div>' +
    '</div>';
  m.classList.add('open');
}

function abrirFirmasFactura() {
  _facturaFirmaCli = false;
  _facturaFirmaVen = false;
  var m = document.getElementById('modal-factura-canvas');
  if (!m) { m=document.createElement('div'); m.id='modal-factura-canvas'; m.className='overlay'; document.body.appendChild(m); }

  m.innerHTML = '<div class="modal" style="max-width:520px">' +
    '<div class="modal-header"><div class="modal-title">✍️ Firmas digitales</div>' +
    '<button class="close-btn" onclick="document.getElementById(\'modal-factura-canvas\').classList.remove(\'open\')">×</button></div>' +
    '<div style="margin-bottom:14px">' +
    '<div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px">Firma del comprador</div>' +
    '<div style="border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:var(--bg3)">' +
    '<canvas id="fc-canvas-cli" width="460" height="130" style="width:100%;height:130px;cursor:crosshair;touch-action:none;display:block"></canvas></div>' +
    '<button class="btn sm" onclick="limpiarFirmaFactura(\'cli\')" style="margin-top:6px">🗑 Limpiar</button></div>' +
    '<div style="margin-bottom:14px">' +
    '<div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px">Firma del vendedor (Carlos Castro)</div>' +
    '<div style="border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:var(--bg3)">' +
    '<canvas id="fc-canvas-ven" width="460" height="130" style="width:100%;height:130px;cursor:crosshair;touch-action:none;display:block"></canvas></div>' +
    '<button class="btn sm" onclick="limpiarFirmaFactura(\'ven\')" style="margin-top:6px">🗑 Limpiar</button></div>' +
    '<div class="modal-footer">' +
    '<button class="btn" onclick="document.getElementById(\'modal-factura-canvas\').classList.remove(\'open\')">Cancelar</button>' +
    '<button class="btn primary" onclick="confirmarFirmasFactura()">📄 Generar factura</button>' +
    '</div></div>';
  m.classList.add('open');
  setTimeout(function(){ iniciarFirmaFactura('fc-canvas-cli','cli'); iniciarFirmaFactura('fc-canvas-ven','ven'); }, 200);
}

function iniciarFirmaFactura(canvasId, tipo) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var drawing = false;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgba(150,170,180,0.15)'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgba(150,170,180,0.4)'; ctx.font='13px Outfit,sans-serif'; ctx.textAlign='center';
  ctx.fillText('Firme aqui', canvas.width/2, canvas.height/2); ctx.textAlign='left';

  function getPos(e) {
    var rect=canvas.getBoundingClientRect();
    var sx=canvas.width/rect.width, sy=canvas.height/rect.height;
    return {x:((e.touches?e.touches[0].clientX:e.clientX)-rect.left)*sx, y:((e.touches?e.touches[0].clientY:e.clientY)-rect.top)*sy};
  }
  canvas.addEventListener('mousedown', function(e){ drawing=true; ctx.clearRect(0,0,canvas.width,canvas.height); var p=getPos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); if(tipo==='cli')_facturaFirmaCli=true; else _facturaFirmaVen=true; });
  canvas.addEventListener('mousemove', function(e){ if(!drawing)return; var p=getPos(e); ctx.lineWidth=1.5;ctx.lineCap='round';ctx.strokeStyle='#000'; ctx.lineTo(p.x,p.y);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x,p.y); });
  canvas.addEventListener('mouseup', function(){ drawing=false; ctx.beginPath(); });
  canvas.addEventListener('touchstart', function(e){ e.preventDefault(); drawing=true; ctx.clearRect(0,0,canvas.width,canvas.height); var p=getPos(e); ctx.beginPath();ctx.moveTo(p.x,p.y); if(tipo==='cli')_facturaFirmaCli=true; else _facturaFirmaVen=true; },{passive:false});
  canvas.addEventListener('touchmove', function(e){ e.preventDefault(); if(!drawing)return; var p=getPos(e); ctx.lineWidth=1.5;ctx.lineCap='round';ctx.strokeStyle='#000'; ctx.lineTo(p.x,p.y);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x,p.y); },{passive:false});
  canvas.addEventListener('touchend', function(e){ e.preventDefault(); drawing=false; ctx.beginPath(); },{passive:false});
}

function limpiarFirmaFactura(tipo) {
  var id = tipo==='cli' ? 'fc-canvas-cli' : 'fc-canvas-ven';
  if(tipo==='cli') _facturaFirmaCli=false; else _facturaFirmaVen=false;
  iniciarFirmaFactura(id, tipo);
}

function confirmarFirmasFactura() {
  if (!_facturaFirmaCli) { toast('El comprador debe firmar','err'); return; }
  if (!_facturaFirmaVen) { toast('El vendedor debe firmar','err'); return; }
  var imgCli = document.getElementById('fc-canvas-cli').toDataURL('image/png');
  var imgVen = document.getElementById('fc-canvas-ven').toDataURL('image/png');
  document.getElementById('modal-factura-canvas').classList.remove('open');
  construirFacturaPDF(_facturaVentaId, _facturaSize, imgCli, imgVen);
}

// ── Construcción del PDF ──────────────────
async function construirFacturaPDF(ventaId, tamano, firmaCliImg, firmaVenImg) {
  var v = ventas.find(function(x){return x.id===ventaId;});
  if (!v) return;

  var eq = equiposFin.find(function(e){return e.marca+' '+e.modelo===v.producto;});
  var esModoLibre = !eq;
  var misCuotas = cuotas.filter(function(c){return c.venta_id===v.id;}).sort(function(a,b){return a.numero-b.numero;});
  var ini      = parseFloat(v.inicial_pagada)||0;
  var cuotaVal = misCuotas.length>0 ? parseFloat(misCuotas[0].monto) : 0;

  var {jsPDF} = window.jspdf;
  var isSmall  = tamano==='5x7';
  var format   = isSmall ? [127,178] : 'letter';
  var doc = new jsPDF({orientation:'portrait',unit:'mm',format:format});

  var W  = isSmall?127:215.9;
  var mx = isSmall?8:15;
  var cw = W-mx*2;
  var fs = isSmall?7:9;
  var y  = 0;

  function ln(yy){ doc.setDrawColor(0);doc.setLineWidth(0.3);doc.line(mx,yy,W-mx,yy); }
  function bold(s){ doc.setFont('helvetica','bold');doc.setFontSize(s||fs); }
  function norm(s){ doc.setFont('helvetica','normal');doc.setFontSize(s||fs); }
  function chk(n){ if(y+(n||10)>(isSmall?165:260)){doc.addPage();y=10;} }

  // ── Encabezado ──
  bold(isSmall?11:14); doc.text(FACTURA_VENDEDOR.negocio, mx, 12);
  norm(isSmall?6:8);
  doc.text(FACTURA_VENDEDOR.nombre+' · C.C. '+FACTURA_VENDEDOR.cedula, mx, 17);
  doc.text(FACTURA_VENDEDOR.direccion, mx, 21);
  doc.text('Tel: '+FACTURA_VENDEDOR.telefono, mx, 25);
  bold(isSmall?8:10); doc.text('FACTURA DE VENTA', W-mx, 12, {align:'right'});
  norm(isSmall?6:8);
  doc.text('No. '+String(v.id).padStart(6,'0'), W-mx, 17, {align:'right'});
  doc.text('Fecha: '+today(), W-mx, 21, {align:'right'});
  y=29; ln(y); y+=4;

  // ── Datos comprador ──
  bold(fs-1); doc.text('DATOS DEL COMPRADOR', mx, y); y+=4;
  norm(fs);
  doc.text(v.cliente||'', mx, y); y+=4;
  if(v.cedula_cliente){ doc.text('C.C.: '+v.cedula_cliente, mx, y); y+=4; }
  if(v.telefono_cliente){ doc.text('Tel: '+v.telefono_cliente, mx, y); y+=4; }
  y+=2;

  // ── Datos equipo ──
  bold(fs-1); doc.text('DATOS DEL EQUIPO', mx, y); y+=4;
  norm(fs);
  // Solo modelo
  var modelo = eq ? eq.modelo : v.producto;
  doc.text(modelo, mx, y); y+=4;
  if(v.color){ doc.text('Color: '+v.color, mx, y); y+=4; }
  if(eq && eq.almacenamiento){ doc.text('Almacenamiento: '+eq.almacenamiento, mx, y); y+=4; }
  if(v.imei){  doc.text('IMEI 1: '+v.imei, mx, y); y+=4; }
  if(v.imei2){ doc.text('IMEI 2: '+v.imei2, mx, y); y+=4; }
  y+=2; ln(y); y+=4;

  // ── Tabla ──
  doc.setFillColor(0,0,0);
  doc.rect(mx, y, cw, isSmall?5:6,'F');
  doc.setTextColor(255,255,255); bold(fs);
  doc.text('DESCRIPCION', mx+2, y+(isSmall?3.5:4.5));
  doc.text('VALOR', W-mx-2, y+(isSmall?3.5:4.5),{align:'right'});
  doc.setTextColor(0,0,0); y+=isSmall?6:7;

  norm(fs);
  var descProd = modelo;
  var detalle  = v.pago==='Financiado' && misCuotas.length>0
    ? 'Financiado · '+misCuotas.length+' cuotas de '+fmt(cuotaVal)+'/mes · Inicial: '+fmt(ini)
    : v.pago==='Financiado' ? 'Financiado · Inicial: '+fmt(ini)
    : 'Contado';

  var dL = doc.splitTextToSize(descProd, cw-28);
  var dtL= doc.splitTextToSize(detalle, cw-28);
  doc.text(dL, mx+2, y+3);
  norm(fs-1); doc.text(dtL, mx+2, y+3+dL.length*3.8);
  bold(fs); doc.text(fmt(v.precio), W-mx-2, y+3,{align:'right'});
  y += (dL.length+dtL.length)*3.8+6;
  ln(y); y+=2;
  bold(isSmall?8:10); doc.text('TOTAL', mx+2, y+4);
  bold(isSmall?9:11); doc.text(fmt(v.precio), W-mx-2, y+4,{align:'right'});
  y+=8; ln(y); y+=4;

  // ── Precio en letras ──
  chk(10);
  doc.setLineWidth(0.2); doc.setDrawColor(100);
  doc.rect(mx,y,cw,isSmall?9:10);
  doc.setDrawColor(0);
  bold(fs-1); doc.text('PRECIO EN LETRAS:', mx+2, y+(isSmall?4:4.5));
  norm(fs-1);
  var letras = numeroALetras(Math.round(parseFloat(v.precio)||0))+' PESOS M/CTE';
  var lL = doc.splitTextToSize(letras, cw-38);
  doc.text(lL, mx+38, y+(isSmall?4:4.5));
  y+=isSmall?11:12;

  // ── Método de pago ──
  chk(12); bold(fs-1); doc.text('METODO DE PAGO:', mx, y); y+=4;
  norm(fs);
  var metodo = v.pago||'No especificado';
  if(v.observaciones) metodo+=' · '+v.observaciones;
  var mL = doc.splitTextToSize(metodo, cw);
  doc.text(mL, mx, y); y+=mL.length*4+2; ln(y); y+=4;

  // ── Garantía ──
  chk(35);
  bold(fs-1); doc.text('GARANTIA DEL EQUIPO', mx, y); y+=4;
  norm(fs);
  bold(fs); doc.text('2 meses', mx, y); y+=4;
  norm(fs);
  doc.text('· Mal funcionamiento del equipo por defecto de fabrica', mx, y); y+=4;
  doc.text('· No aplica para equipos no registrados ante operadores', mx, y); y+=6;

  bold(fs-1); doc.text('GARANTIA NO APLICA POR:', mx, y); y+=4;
  norm(fs);
  GARANTIA_NO_APLICA.forEach(function(item){ chk(5); doc.text('· '+item, mx, y); y+=4; });
  y+=2; ln(y); y+=4;

  // ── Términos ──
  chk(24); bold(fs-1); doc.text('TERMINOS Y CONDICIONES', mx, y); y+=4;
  norm(fs-1);
  ['1. El equipo sale en perfectas condiciones segun revision al momento de la entrega.',
   '2. Para hacer efectiva la garantia debe presentar esta factura original.',
   '3. La garantia no cubre los casos mencionados anteriormente.',
   '4. Los pagos deben realizarse en las fechas acordadas segun el plan de cuotas.',
   '5. En caso de mora se aplicaran los intereses legales vigentes.'].forEach(function(t){
    var tL=doc.splitTextToSize(t,cw); chk(tL.length*3.5+1); doc.text(tL,mx,y); y+=tL.length*3.5+1;
  });
  y+=4;

  // ── Firmas ──
  chk(35);
  var fw = (cw-10)/2;
  y+=12;

  if (firmaCliImg && firmaVenImg) {
    try { doc.addImage(firmaCliImg,'PNG',mx,y-10,fw,10); } catch(e){}
    try { doc.addImage(firmaVenImg,'PNG',mx+fw+10,y-10,fw,10); } catch(e){}
  }

  doc.line(mx,y,mx+fw,y);
  doc.line(mx+fw+10,y,mx+fw+10+fw,y);
  y+=3; norm(fs-1);
  doc.text('Firma comprador', mx, y);
  doc.text('Firma vendedor', mx+fw+10, y); y+=4;
  bold(fs-1);
  doc.text(v.cliente||'', mx, y);
  doc.text(FACTURA_VENDEDOR.nombre, mx+fw+10, y); y+=4;
  norm(fs-1);
  if(v.cedula_cliente) doc.text('C.C. '+v.cedula_cliente, mx, y);
  doc.text('C.C. '+FACTURA_VENDEDOR.cedula, mx+fw+10, y);
  y+=8;

  // Pie
  ln(y); y+=3;
  doc.setFontSize(fs-2);
  doc.text(FACTURA_VENDEDOR.negocio+' · '+FACTURA_VENDEDOR.web+' · Tel: '+FACTURA_VENDEDOR.telefono, W/2, y+3,{align:'center'});

  var nombre='factura-'+(v.cliente||'').replace(/\s+/g,'-')+'-'+v.id+'.pdf';
  doc.save(nombre);
  toast('Factura generada ✓');
}

// ── Paz y Salvo estilo factura ────────────
async function generarPazSalvoFactura(ventaId) {
  var v = ventas.find(function(x){return x.id===ventaId;});
  if (!v) return;

  var m = document.getElementById('modal-ps-opciones');
  if (!m) { m=document.createElement('div'); m.id='modal-ps-opciones'; m.className='overlay'; document.body.appendChild(m); }

  m.innerHTML = '<div class="modal" style="max-width:380px">' +
    '<div class="modal-header"><div class="modal-title">✅ Paz y Salvo</div>' +
    '<button class="close-btn" onclick="document.getElementById(\'modal-ps-opciones\').classList.remove(\'open\')">×</button></div>' +
    '<p style="font-size:12px;color:var(--text2);margin-bottom:12px">Selecciona el tamaño de papel:</p>' +
    '<div style="display:flex;flex-direction:column;gap:10px">' +
    '<button class="btn primary" style="justify-content:flex-start;gap:10px" onclick="document.getElementById(\'modal-ps-opciones\').classList.remove(\'open\');construirPazSalvoPDF('+ventaId+',\'letter\')">' +
      '<span style="font-size:20px">📄</span><div style="text-align:left"><div style="font-weight:600">Carta</div><div style="font-size:11px;opacity:.8">Impresoras normales</div></div></button>' +
    '<button class="btn" style="justify-content:flex-start;gap:10px" onclick="document.getElementById(\'modal-ps-opciones\').classList.remove(\'open\');construirPazSalvoPDF('+ventaId+',\'5x7\')">' +
      '<span style="font-size:20px">🧾</span><div style="text-align:left"><div style="font-weight:600">Comprobante 5×7</div><div style="font-size:11px;color:var(--text3)">Impresoras de tickets</div></div></button>' +
    '</div>' +
    '<div class="modal-footer"><button class="btn" onclick="document.getElementById(\'modal-ps-opciones\').classList.remove(\'open\')">Cancelar</button></div>' +
    '</div>';
  m.classList.add('open');
}

async function construirPazSalvoPDF(ventaId, tamano) {
  var v = ventas.find(function(x){return x.id===ventaId;});
  if (!v) return;

  var ab  = abonadoPor('venta', v.id);
  var misAbonos = abonos.filter(function(a){return a.tipo==='venta'&&a.ref_id===v.id;}).sort(function(a,b){return a.id-b.id;});

  var {jsPDF} = window.jspdf;
  var isSmall = tamano==='5x7';
  var format  = isSmall?[127,178]:'letter';
  var doc = new jsPDF({orientation:'portrait',unit:'mm',format:format});

  var W  = isSmall?127:215.9;
  var mx = isSmall?8:15;
  var cw = W-mx*2;
  var fs = isSmall?7:9;
  var y  = 0;

  function ln(yy){ doc.setDrawColor(0);doc.setLineWidth(0.3);doc.line(mx,yy,W-mx,yy); }
  function bold(s){ doc.setFont('helvetica','bold');doc.setFontSize(s||fs); }
  function norm(s){ doc.setFont('helvetica','normal');doc.setFontSize(s||fs); }
  function chk(n){ if(y+(n||10)>(isSmall?165:260)){doc.addPage();y=10;} }

  // Encabezado
  bold(isSmall?11:14); doc.text(FACTURA_VENDEDOR.negocio, mx, 12);
  norm(isSmall?6:8);
  doc.text(FACTURA_VENDEDOR.nombre+' · C.C. '+FACTURA_VENDEDOR.cedula, mx, 17);
  doc.text(FACTURA_VENDEDOR.direccion, mx, 21);
  doc.text('Tel: '+FACTURA_VENDEDOR.telefono, mx, 25);
  bold(isSmall?8:10); doc.text('PAZ Y SALVO', W-mx, 12,{align:'right'});
  norm(isSmall?6:8);
  doc.text('No. '+String(v.id).padStart(6,'0'), W-mx, 17,{align:'right'});
  doc.text('Fecha: '+today(), W-mx, 21,{align:'right'});
  y=29; ln(y); y+=4;

  // Datos
  bold(fs-1); doc.text('DATOS DEL COMPRADOR', mx, y); y+=4;
  norm(fs);
  doc.text(v.cliente||'', mx, y); y+=4;
  if(v.cedula_cliente){ doc.text('C.C.: '+v.cedula_cliente, mx, y); y+=4; }
  if(v.telefono_cliente){ doc.text('Tel: '+v.telefono_cliente, mx, y); y+=4; }
  y+=2; ln(y); y+=4;

  // Equipo
  bold(fs-1); doc.text('EQUIPO', mx, y); y+=4;
  norm(fs);
  doc.text(v.producto||'', mx, y); y+=4;
  if(v.imei){ doc.text('IMEI 1: '+v.imei, mx, y); y+=4; }
  if(v.imei2){ doc.text('IMEI 2: '+v.imei2, mx, y); y+=4; }
  y+=2; ln(y); y+=4;

  // Certificación
  doc.setFillColor(240,240,240);
  doc.rect(mx,y,cw,isSmall?16:18,'F');
  bold(isSmall?9:11);
  doc.text('CERTIFICADO DE PAZ Y SALVO', W/2, y+(isSmall?5:6),{align:'center'});
  norm(fs);
  var cert = 'Se certifica que '+v.cliente+' ha cancelado la totalidad del valor del equipo '+v.producto+' por un monto de '+fmt(v.precio)+'.';
  var cL = doc.splitTextToSize(cert, cw-4);
  doc.text(cL, W/2, y+(isSmall?10:12),{align:'center'});
  y+=isSmall?18:20; ln(y); y+=4;

  // Historial pagos
  bold(fs-1); doc.text('HISTORIAL DE PAGOS', mx, y); y+=4;
  doc.setFillColor(0,0,0);
  doc.rect(mx,y,cw,isSmall?5:6,'F');
  doc.setTextColor(255,255,255); bold(fs);
  doc.text('FECHA', mx+2, y+(isSmall?3.5:4.5));
  doc.text('CONCEPTO', mx+30, y+(isSmall?3.5:4.5));
  doc.text('MONTO', W-mx-2, y+(isSmall?3.5:4.5),{align:'right'});
  doc.setTextColor(0,0,0); y+=isSmall?6:7;

  norm(fs);
  misAbonos.forEach(function(a){
    chk(6);
    doc.text(a.fecha||'', mx+2, y);
    doc.text(a.obs||'Abono', mx+30, y);
    doc.text(fmt(a.monto), W-mx-2, y,{align:'right'});
    y+=5;
  });
  ln(y); y+=2;
  bold(fs); doc.text('TOTAL PAGADO', mx+2, y+4);
  bold(isSmall?9:11); doc.text(fmt(ab), W-mx-2, y+4,{align:'right'});
  y+=8; ln(y); y+=4;

  // Letras
  chk(10);
  doc.setLineWidth(0.2); doc.setDrawColor(100);
  doc.rect(mx,y,cw,isSmall?9:10);
  doc.setDrawColor(0);
  bold(fs-1); doc.text('PRECIO EN LETRAS:', mx+2, y+(isSmall?4:4.5));
  norm(fs-1);
  var letras=numeroALetras(Math.round(parseFloat(v.precio)||0))+' PESOS M/CTE';
  var lL=doc.splitTextToSize(letras,cw-38);
  doc.text(lL,mx+38,y+(isSmall?4:4.5));
  y+=isSmall?11:12;

  // Firmas
  chk(30); y+=12;
  var fw=(cw-10)/2;
  doc.line(mx,y,mx+fw,y);
  doc.line(mx+fw+10,y,mx+fw+10+fw,y);
  y+=3; norm(fs-1);
  doc.text('Firma comprador', mx, y);
  doc.text('Firma vendedor', mx+fw+10, y); y+=4;
  bold(fs-1);
  doc.text(v.cliente||'', mx, y);
  doc.text(FACTURA_VENDEDOR.nombre, mx+fw+10, y); y+=4;
  norm(fs-1);
  if(v.cedula_cliente) doc.text('C.C. '+v.cedula_cliente, mx, y);
  doc.text('C.C. '+FACTURA_VENDEDOR.cedula, mx+fw+10, y);
  y+=8; ln(y); y+=3;
  doc.setFontSize(fs-2);
  doc.text(FACTURA_VENDEDOR.negocio+' · '+FACTURA_VENDEDOR.web, W/2, y+3,{align:'center'});

  var nombre='paz-y-salvo-'+(v.cliente||'').replace(/\s+/g,'-')+'-'+v.id+'.pdf';
  doc.save(nombre);
  toast('Paz y Salvo generado ✓');
}
