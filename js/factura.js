// ═══════════════════════════════════════════
//  factura.js — Factura de Venta + Paz y Salvo PDF
//  CastellStore · Carlos Castro Elles
// ═══════════════════════════════════════════

// FACTURA_VENDEDOR vive ahora en js/negocio.js (fuente unica).

var GARANTIA_NO_APLICA = [
  'Daños de display',
  'Humedad',
  'Bloqueo de telefono por no registro',
  'Daños fisicos del equipo',
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

// ── Generación directa ───────────────────
// Un solo formato: tirilla termica de 58 mm. Sin modal de tamaño
// ni de firma, porque la tirilla se firma a mano sobre el papel.
// El codigo de tamaño carta sigue en construirFacturaPDF por si
// se quiere volver a ofrecer: basta con llamarlo con 'letter'.
function generarFacturaVenta(ventaId) {
  var v = ventas.find(function(x){return x.id===ventaId;});
  if (!v) return;
  _facturaVentaId = ventaId;
  _facturaSize    = 'tirilla';
  construirFacturaPDF(ventaId, 'tirilla', null, null);
}

var _facturaSize = 'tirilla';
var _facturaVentaId = null;
var _facturaFirmaCliFile = null;
var _facturaFirmaVenFile = null;
var _facturaFirmaCli = false;
var _facturaFirmaVen = false;

// Sin uso desde que la factura genera tirilla directa. Se conserva
// por si se vuelve a ofrecer el tamaño carta con firma digital.
function mostrarOpcionFirmaFactura() {
  var mo = document.getElementById('modal-factura-opciones');
  if (mo) mo.classList.remove('open');
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
// Diseño unificado con el comprobante: banda azul de marca,
// acento verde y todo en una sola pagina.
async function construirFacturaPDF(ventaId, tamano, firmaCliImg, firmaVenImg) {
  var v = ventas.find(function(x){return x.id===ventaId;});
  if (!v) return;

  // La tirilla termica es otro documento, no la factura reducida.
  if (tamano === 'tirilla') return construirTirillaPDF(v, firmaCliImg);

  var eq = equiposFin.find(function(e){return e.marca+' '+e.modelo===v.producto;});
  var misCuotas = cuotas.filter(function(c){return c.venta_id===v.id;}).sort(function(a,b){return a.numero-b.numero;});
  var ini      = parseFloat(v.inicial_pagada)||0;
  var cuotaVal = misCuotas.length>0 ? parseFloat(misCuotas[0].monto) : 0;

  var {jsPDF} = window.jspdf;
  var isSmall = tamano==='5x7';
  var format  = isSmall ? [127,178] : 'letter';
  var doc = new jsPDF({orientation:'portrait',unit:'mm',format:format});

  var W  = isSmall?127:215.9;
  var H  = isSmall?178:279.4;
  var mx = isSmall?7:14;
  var cw = W-mx*2;
  var fs = isSmall?6.5:8.5;

  // Paleta compartida con el comprobante
  var AZUL  = [16,31,43];
  var VERDE = [130,180,60];
  var GRIS  = [110,125,135];

  function bold(s){ doc.setFont('helvetica','bold'); doc.setFontSize(s||fs); }
  function norm(s){ doc.setFont('helvetica','normal'); doc.setFontSize(s||fs); }
  function tinta(c){ doc.setTextColor(c[0],c[1],c[2]); }

  // Titulo de seccion: texto azul con barrita verde al lado
  function seccion(txt, x, yy, ancho) {
    doc.setFillColor(VERDE[0],VERDE[1],VERDE[2]);
    doc.rect(x, yy-2.6, 1.2, 3.2, 'F');
    bold(fs-0.5); tinta(AZUL);
    doc.text(txt.toUpperCase(), x+3, yy);
    doc.setDrawColor(225,230,234); doc.setLineWidth(0.2);
    doc.line(x, yy+1.8, x+(ancho||cw), yy+1.8);
    return yy+6;
  }

  // ── Encabezado: banda azul ──
  var hb = isSmall?24:28;
  doc.setFillColor(AZUL[0],AZUL[1],AZUL[2]);
  doc.rect(0,0,W,hb,'F');
  doc.setFillColor(VERDE[0],VERDE[1],VERDE[2]);
  doc.rect(0,hb,W,1.1,'F');

  var tx = mx;
  try {
    if (typeof LOGO_B64 !== 'undefined' && LOGO_B64) {
      var ls = isSmall?11:14;
      doc.addImage(LOGO_B64,'PNG',mx,(hb-ls)/2,ls,ls);
      tx = mx+ls+4;
    }
  } catch(e){}

  bold(isSmall?11:15); doc.setTextColor(255,255,255);
  doc.text(NEGOCIO.nombre, tx, isSmall?10:11);
  norm(isSmall?5.5:7); doc.setTextColor(170,190,200);
  doc.text(NEGOCIO.titular+' · C.C. '+NEGOCIO.cedula, tx, isSmall?14:16);
  doc.text(NEGOCIO.direccion+' · '+NEGOCIO.ciudad, tx, isSmall?17.5:20);
  doc.text('Tel: '+NEGOCIO.telefono, tx, isSmall?21:24);

  bold(isSmall?8:11); doc.setTextColor(VERDE[0]+40,VERDE[1]+40,VERDE[2]+40);
  doc.text('FACTURA DE VENTA', W-mx, isSmall?10:11, {align:'right'});
  norm(isSmall?5.5:7.5); doc.setTextColor(200,215,222);
  doc.text('No. '+String(v.id).padStart(6,'0'), W-mx, isSmall?14:16, {align:'right'});
  doc.text('Fecha: '+today(), W-mx, isSmall?17.5:20, {align:'right'});

  var y = hb+9;
  tinta([25,35,45]);

  // ── Comprador y equipo, lado a lado ──
  var colW = (cw-6)/2;
  var yTop = y;
  var yA = seccion('Datos del comprador', mx, y, isSmall?cw:colW);
  norm(fs); tinta([25,35,45]);
  doc.text(v.cliente||'—', mx, yA); yA+=4;
  if(v.cedula_cliente){ doc.text('C.C.: '+v.cedula_cliente, mx, yA); yA+=4; }
  if(v.telefono_cliente){ doc.text('Tel: '+v.telefono_cliente, mx, yA); yA+=4; }

  var xB = isSmall ? mx : mx+colW+6;
  var yB = isSmall ? yA+3 : yTop;
  yB = seccion('Datos del equipo', xB, yB, isSmall?cw:colW);
  norm(fs); tinta([25,35,45]);
  var modelo = v.producto||'—';
  doc.splitTextToSize(modelo, colW).forEach(function(l){ doc.text(l, xB, yB); yB+=4; });
  if(v.color){ doc.text('Color: '+v.color, xB, yB); yB+=4; }
  if(eq && eq.almacenamiento){ doc.text('Almacenamiento: '+eq.almacenamiento, xB, yB); yB+=4; }
  if(v.imei){  doc.text('IMEI 1: '+v.imei, xB, yB); yB+=4; }
  if(v.imei2){ doc.text('IMEI 2: '+v.imei2, xB, yB); yB+=4; }

  y = Math.max(yA, yB)+4;

  // ── Tabla de valores ──
  doc.setFillColor(AZUL[0],AZUL[1],AZUL[2]);
  doc.rect(mx, y, cw, isSmall?5.5:6.5,'F');
  doc.setTextColor(255,255,255); bold(fs);
  doc.text('DESCRIPCIÓN', mx+3, y+(isSmall?3.8:4.6));
  doc.text('VALOR', W-mx-3, y+(isSmall?3.8:4.6),{align:'right'});
  y += isSmall?8:9.5;

  var detalle = v.pago==='Financiado' && misCuotas.length>0
    ? 'Financiado · '+misCuotas.length+' cuotas de '+fmt(cuotaVal)+'/mes · Inicial: '+fmt(ini)
    : v.pago==='Financiado' ? 'Financiado · Inicial: '+fmt(ini)
    : 'Contado';

  norm(fs); tinta([25,35,45]);
  var dL = doc.splitTextToSize(modelo, cw-34);
  doc.text(dL, mx+3, y);
  bold(fs); doc.text(fmt(v.precio), W-mx-3, y,{align:'right'});
  var yD = y + dL.length*4;
  norm(fs-1); tinta(GRIS);
  var dtL = doc.splitTextToSize(detalle, cw-34);
  doc.text(dtL, mx+3, yD);
  y = yD + dtL.length*3.6 + 3;

  doc.setDrawColor(225,230,234); doc.setLineWidth(0.2);
  doc.line(mx,y,W-mx,y); y+=1;

  // Fila TOTAL con fondo suave
  doc.setFillColor(244,247,249);
  doc.rect(mx, y, cw, isSmall?8:9.5,'F');
  bold(isSmall?8.5:11); tinta(AZUL);
  doc.text('TOTAL', mx+3, y+(isSmall?5.5:6.5));
  doc.text(fmt(v.precio), W-mx-3, y+(isSmall?5.5:6.5),{align:'right'});
  y += (isSmall?11:13);

  // ── Precio en letras (recuadro unico, sin solaparse) ──
  var letras = numeroALetras(Math.round(parseFloat(v.precio)||0))+' PESOS M/CTE';
  norm(fs-1);
  var lL = doc.splitTextToSize(letras, cw-6);
  var altoCaja = 6.5 + lL.length*3.8 + 2.5;
  doc.setFillColor(250,251,252);
  doc.setDrawColor(220,226,231); doc.setLineWidth(0.25);
  doc.rect(mx, y, cw, altoCaja, 'FD');
  bold(fs-1.5); tinta(GRIS);
  doc.text('PRECIO EN LETRAS', mx+3, y+4);
  norm(fs-1); tinta([25,35,45]);
  doc.text(lL, mx+3, y+8.5);
  y += altoCaja+6;

  // ── Método de pago ──
  y = seccion('Método de pago', mx, y);
  norm(fs); tinta([25,35,45]);
  var metodo = v.pago||'No especificado';
  var mL = doc.splitTextToSize(metodo, cw);
  doc.text(mL, mx, y); y += mL.length*4+5;

  // ── Garantía en dos columnas ──
  var yG = y;
  var yG1 = seccion('Garantía del equipo', mx, yG, isSmall?cw:colW);
  bold(fs); tinta([25,35,45]); doc.text('2 meses', mx, yG1); yG1+=4.5;
  norm(fs-0.5);
  ['Mal funcionamiento por defecto de fábrica',
   'No aplica para equipos no registrados ante operadores'].forEach(function(t){
    var l = doc.splitTextToSize('· '+t, isSmall?cw:colW);
    doc.text(l, mx, yG1); yG1 += l.length*3.6;
  });

  var xG2 = isSmall ? mx : mx+colW+6;
  var yG2 = isSmall ? yG1+3 : yG;
  yG2 = seccion('La garantía no aplica por', xG2, yG2, isSmall?cw:colW);
  norm(fs-0.5); tinta([25,35,45]);
  GARANTIA_NO_APLICA.forEach(function(item){
    var l = doc.splitTextToSize('· '+item, isSmall?cw:colW);
    doc.text(l, xG2, yG2); yG2 += l.length*3.6;
  });
  y = Math.max(yG1,yG2)+5;

  // ── Términos ──
  y = seccion('Términos y condiciones', mx, y);
  norm(fs-1.5); tinta([60,72,82]);
  ['1. El equipo sale en perfectas condiciones según revisión al momento de la entrega.',
   '2. Para hacer efectiva la garantía debe presentar esta factura original.',
   '3. La garantía no cubre los casos mencionados anteriormente.',
   '4. Los pagos deben realizarse en las fechas acordadas según el plan de cuotas.',
   '5. En caso de mora se aplicarán los intereses legales vigentes.'].forEach(function(t){
    var tL = doc.splitTextToSize(t, cw);
    doc.text(tL, mx, y); y += tL.length*3.4+0.6;
  });

  // ── Firmas, ancladas cerca del pie ──
  var yPie  = H - (isSmall?16:20);
  // Las firmas siguen al contenido; solo se frenan si llegan al pie.
  var yFirma = Math.min(y+20, yPie-26);
  var fw = (cw-12)/2;

  if (firmaCliImg && firmaVenImg) {
    try { doc.addImage(firmaCliImg,'PNG',mx,yFirma-11,fw,11); } catch(e){}
    try { doc.addImage(firmaVenImg,'PNG',mx+fw+12,yFirma-11,fw,11); } catch(e){}
  }
  doc.setDrawColor(150,160,170); doc.setLineWidth(0.3);
  doc.line(mx,yFirma,mx+fw,yFirma);
  doc.line(mx+fw+12,yFirma,mx+fw+12+fw,yFirma);
  var yf = yFirma+3.5;
  norm(fs-1.5); tinta(GRIS);
  doc.text('Firma comprador', mx, yf);
  doc.text('Firma vendedor', mx+fw+12, yf); yf+=4;
  bold(fs-0.5); tinta([25,35,45]);
  doc.text(v.cliente||'', mx, yf);
  doc.text(NEGOCIO.titular, mx+fw+12, yf); yf+=3.8;
  norm(fs-1.5); tinta(GRIS);
  if(v.cedula_cliente) doc.text('C.C. '+v.cedula_cliente, mx, yf);
  doc.text('C.C. '+NEGOCIO.cedula, mx+fw+12, yf);

  // ── Pie: banda azul ──
  doc.setFillColor(AZUL[0],AZUL[1],AZUL[2]);
  doc.rect(0, H-(isSmall?9:11), W, isSmall?9:11, 'F');
  doc.setFillColor(VERDE[0],VERDE[1],VERDE[2]);
  doc.rect(0, H-(isSmall?9:11), W, 0.8, 'F');
  norm(isSmall?5:6.5); doc.setTextColor(190,205,214);
  doc.text(NEGOCIO.sitio+' · '+NEGOCIO.web+' · Tel: '+NEGOCIO.telefono,
           W/2, H-(isSmall?3.5:4.5), {align:'center'});

  var nombre = 'factura-'+(v.cliente||'').replace(/\s+/g,'-')+'-'+v.id+'.pdf';
  doc.save(nombre);
  toast('Factura generada ✓');
}

// ── Tirilla térmica 58 mm ─────────────────
// Documento aparte, no la factura encogida: una sola columna,
// blanco y negro puro (la térmica no imprime color) y alto
// variable segun el contenido, para no botar papel.
//
// Ancho de rollo 58 mm · área imprimible ~48 mm.

function _tirillaPintar(doc, v, firmaImg) {
  var W = 58, mx = 4.5, cw = W - mx*2;   // 49 mm utiles
  var y = 6;

  function b(s){ doc.setFont('helvetica','bold');   doc.setFontSize(s||6.5); }
  function n(s){ doc.setFont('helvetica','normal'); doc.setFontSize(s||6.5); }
  function centro(t,s,neg){ (neg?b:n)(s); doc.text(t, W/2, y, {align:'center'}); y+=(s||6.5)*0.42+0.6; }
  function izq(t,s){ n(s); doc.splitTextToSize(t,cw).forEach(function(l){ doc.text(l,mx,y); y+=(s||6.5)*0.42+0.5; }); }
  function separador(){ doc.setLineWidth(0.15); doc.setDrawColor(0);
    doc.setLineDashPattern([0.6,0.6],0); doc.line(mx,y,W-mx,y);
    doc.setLineDashPattern([],0); y+=3; }
  function regla(){ doc.setLineWidth(0.4); doc.setDrawColor(0); doc.line(mx,y,W-mx,y); y+=3; }
  function fila(et,val,s){ n(s||6.5); doc.text(et,mx,y);
    b(s||6.5); doc.text(val, W-mx, y, {align:'right'}); y+=(s||6.5)*0.42+0.8; }

  var eq = equiposFin.find(function(e){return e.marca+' '+e.modelo===v.producto;});
  var misCuotas = cuotas.filter(function(c){return c.venta_id===v.id;}).sort(function(a,b2){return a.numero-b2.numero;});
  var iniPag = parseFloat(v.inicial_pagada)||0;

  // Encabezado
  centro(NEGOCIO.nombre.toUpperCase(), 11, true);
  y += 0.5;
  centro(NEGOCIO.titular, 6);
  centro('C.C. '+NEGOCIO.cedula, 6);
  centro(NEGOCIO.direccion, 6);
  centro(NEGOCIO.ciudad, 6);
  centro('Tel: '+NEGOCIO.telefono, 6);
  y += 1.5; regla();

  centro('FACTURA DE VENTA', 8, true);
  centro('No. '+String(v.id).padStart(6,'0')+'  ·  '+today(), 6);
  y += 1; separador();

  // Cliente
  b(6.5); doc.text('CLIENTE', mx, y); y+=3;
  izq(v.cliente||'—');
  if(v.cedula_cliente)   izq('C.C.: '+v.cedula_cliente, 6);
  if(v.telefono_cliente) izq('Tel: '+v.telefono_cliente, 6);
  y += 1; separador();

  // Equipo
  b(6.5); doc.text('EQUIPO', mx, y); y+=3;
  izq(v.producto||'—');
  if(v.color) izq('Color: '+v.color, 6);
  if(eq && eq.almacenamiento) izq('Almac.: '+eq.almacenamiento, 6);
  if(v.imei)  izq('IMEI 1: '+v.imei, 6);
  if(v.imei2) izq('IMEI 2: '+v.imei2, 6);
  y += 1; separador();

  // Valores
  var detalle = v.pago==='Financiado' && misCuotas.length>0
    ? 'Financiado · '+misCuotas.length+' cuotas de '+fmt(parseFloat(misCuotas[0].monto))
    : v.pago==='Financiado' ? 'Financiado · Inicial: '+fmt(iniPag)
    : 'Contado';
  izq(detalle, 6);
  if(v.pago==='Financiado' && iniPag>0) fila('Inicial pagada', fmt(iniPag), 6);
  y += 0.5; regla();
  b(9); doc.text('TOTAL', mx, y); b(9); doc.text(fmt(v.precio), W-mx, y, {align:'right'}); y+=4.6;
  regla();

  n(6); izq('SON: '+numeroALetras(Math.round(parseFloat(v.precio)||0))+' PESOS M/CTE', 6);
  y += 0.5;
  izq('PAGO: '+(v.pago||'No especificado'), 6);
  // Las observaciones son uso interno: no se imprimen en la
  // tirilla que se lleva el cliente.
  y += 1; separador();

  // Garantía
  b(6.5); doc.text('GARANTÍA: 2 meses', mx, y); y+=3;
  n(5.8);
  izq('· Mal funcionamiento por defecto de fábrica', 5.8);
  izq('· No aplica para equipos no registrados', 5.8);
  y += 1;
  b(6); doc.text('NO APLICA POR:', mx, y); y+=2.8;
  GARANTIA_NO_APLICA.forEach(function(it){ izq('· '+it, 5.8); });
  y += 1; separador();

  // Firma
  if (firmaImg) { try { doc.addImage(firmaImg,'PNG',mx,y,cw*0.7,9); y+=9.5; } catch(e){ y+=9; } }
  else y += 9;
  doc.setLineWidth(0.2); doc.line(mx,y,mx+cw*0.75,y); y+=3;
  n(5.8); doc.text('Firma comprador', mx, y); y+=3;
  b(6);   doc.text(v.cliente||'', mx, y); y+=4;

  separador();
  centro('¡Gracias por su compra!', 7, true);
  y += 0.5;
  centro(NEGOCIO.web, 5.5);
  centro('Conserve esta tirilla para la garantía', 5.5);

  return y;
}

async function construirTirillaPDF(v, firmaImg) {
  var {jsPDF} = window.jspdf;

  // Pasada 1: medir sobre un lienzo alto y desechable.
  var tmp = new jsPDF({orientation:'portrait',unit:'mm',format:[58,800]});
  var alto = _tirillaPintar(tmp, v, firmaImg) + 8;

  // Pasada 2: el documento real, con la altura justa.
  var doc = new jsPDF({orientation:'portrait',unit:'mm',format:[58,alto]});
  _tirillaPintar(doc, v, firmaImg);

  doc.save('tirilla-'+(v.cliente||'').replace(/\s+/g,'-')+'-'+v.id+'.pdf');
  toast('Tirilla generada ✓');
}

// ── Tirillas de servicio técnico ──────────
// Dos documentos sobre el mismo diseño de 58 mm:
//   'recepcion' → el que se lleva el cliente al dejar el equipo.
//   'servicio'  → el equivalente a la factura, al entregarlo.

function _tirillaServicioPintar(doc, t, tipo) {
  var W = 58, mx = 4.5, cw = W - mx*2;
  var y = 6;

  function b(s){ doc.setFont('helvetica','bold');   doc.setFontSize(s||6.5); }
  function n(s){ doc.setFont('helvetica','normal'); doc.setFontSize(s||6.5); }
  function centro(t2,s,neg){ (neg?b:n)(s); doc.text(t2, W/2, y, {align:'center'}); y+=(s||6.5)*0.42+0.6; }
  function izq(t2,s){ n(s); doc.splitTextToSize(t2,cw).forEach(function(l){ doc.text(l,mx,y); y+=(s||6.5)*0.42+0.5; }); }
  function separador(){ doc.setLineWidth(0.15); doc.setDrawColor(0);
    doc.setLineDashPattern([0.6,0.6],0); doc.line(mx,y,W-mx,y);
    doc.setLineDashPattern([],0); y+=3; }
  function regla(){ doc.setLineWidth(0.4); doc.setDrawColor(0); doc.line(mx,y,W-mx,y); y+=3; }
  function fila(et,val,s){ n(s||6.5); doc.text(et,mx,y);
    b(s||6.5); doc.text(val, W-mx, y, {align:'right'}); y+=(s||6.5)*0.42+0.8; }

  var esRecepcion = (tipo === 'recepcion');
  var costo   = parseFloat(t.costo)||0;
  var abonado = abonadoPor('tecnico', t.id);
  var saldo   = Math.max(0, costo - abonado);

  // Encabezado
  centro(NEGOCIO.nombre.toUpperCase(), 11, true);
  y += 0.5;
  centro(NEGOCIO.titular, 6);
  centro(NEGOCIO.direccion+' · '+NEGOCIO.ciudad, 6);
  centro('Tel: '+NEGOCIO.telefono, 6);
  y += 1.5; regla();

  centro(esRecepcion ? 'RECIBO DE RECEPCIÓN' : 'COMPROBANTE DE SERVICIO', 8, true);
  centro('Orden No. '+String(t.id).padStart(6,'0'), 6);
  centro((esRecepcion ? 'Recibido: ' : 'Entregado: ')+today(), 6);
  y += 1; separador();

  // Cliente
  b(6.5); doc.text('CLIENTE', mx, y); y+=3;
  izq(t.cliente||'—');
  y += 1; separador();

  // Equipo y falla
  b(6.5); doc.text('EQUIPO', mx, y); y+=3;
  izq(t.equipo||'—');
  y += 1;
  b(6); doc.text(esRecepcion ? 'FALLA REPORTADA:' : 'DIAGNÓSTICO:', mx, y); y+=2.8;
  izq(t.diagnostico||'Por diagnosticar', 6);
  // Las notas del servicio son uso interno: no se imprimen en el
  // comprobante que se lleva el cliente.
  y += 1; separador();

  // Estado / valores
  if (esRecepcion) {
    b(6.5); doc.text('ESTADO: '+(t.estado||'Recibido'), mx, y); y+=3.5;
    n(6);
    if (costo > 0) { fila('Costo estimado', fmt(costo), 6.5); }
    else izq('Costo por definir tras el diagnóstico.', 6);
    if (abonado > 0) fila('Abono recibido', fmt(abonado), 6.5);
    y += 1; separador();
    b(6); doc.text('IMPORTANTE', mx, y); y+=2.8;
    n(5.8);
    izq('· Presente este recibo para reclamar su equipo.', 5.8);
    izq('· El costo estimado puede variar si aparecen fallas adicionales; se le informará antes de continuar.', 5.8);
    izq('· Pasados 60 días sin reclamar, se cobrará bodegaje.', 5.8);
    izq('· No respondemos por información no respaldada.', 5.8);
  } else {
    fila('Costo del servicio', fmt(costo), 6.5);
    if (abonado > 0) fila('Abonado', fmt(abonado), 6.5);
    y += 0.5; regla();
    b(9); doc.text(saldo > 0 ? 'SALDO' : 'TOTAL', mx, y);
    b(9); doc.text(fmt(saldo > 0 ? saldo : costo), W-mx, y, {align:'right'}); y+=4.6;
    regla();
    n(6); izq('SON: '+numeroALetras(Math.round(saldo > 0 ? saldo : costo))+' PESOS M/CTE', 6);
    if (saldo <= 0) { y+=0.5; b(6.5); doc.text('PAGADO EN SU TOTALIDAD', mx, y); y+=3.5; }
    y += 1; separador();
    b(6.5); doc.text('GARANTÍA DEL SERVICIO: 30 días', mx, y); y+=3;
    n(5.8);
    izq('· Cubre únicamente la falla reparada y los repuestos instalados.', 5.8);
    izq('· No cubre daños por humedad, golpes ni manipulación de terceros.', 5.8);
    izq('· Se pierde si el equipo es abierto por otro técnico.', 5.8);
    izq('· Presente este comprobante para hacerla efectiva.', 5.8);
  }
  y += 1; separador();

  // ── Cierre ──
  // En recepcion no se pide firma: este papel se lo lleva el
  // cliente, asi que su firma aqui no le sirve de respaldo a nadie.
  // Lo util para el es saber quien le recibio el equipo.
  if (esRecepcion) {
    n(6); doc.text('Recibido por:', mx, y); y+=3;
    b(6.5); doc.text(NEGOCIO.titular, mx, y); y+=4.5;
  } else {
    y += 9;
    doc.setLineWidth(0.2); doc.line(mx,y,mx+cw*0.75,y); y+=3;
    n(5.8); doc.text('Firma de quien recibe el equipo', mx, y); y+=3;
    b(6);   doc.text(t.cliente||'', mx, y); y+=4;
  }

  separador();
  centro(esRecepcion ? 'Gracias por confiar en nosotros' : '¡Gracias por su preferencia!', 7, true);
  y += 0.5;
  centro(NEGOCIO.web, 5.5);
  centro(esRecepcion ? 'Conserve este recibo' : 'Conserve este comprobante para la garantía', 5.5);

  // ── Talón para el taller ──
  // Solo al entregar: el cliente firma esta parte, se corta y se
  // queda en el taller como constancia de que retiro el equipo.
  if (!esRecepcion) {
    y += 5;
    n(5.5); doc.setLineDashPattern([1.2,1.2],0);
    doc.setLineWidth(0.2); doc.setDrawColor(0);
    doc.line(mx,y,W-mx,y);
    doc.setLineDashPattern([],0);
    // Sin emoji: las fuentes base de jsPDF no traen ese glifo.
    doc.text('- - - corte aqui - - -', W/2, y-1.2, {align:'center'});
    y += 4.5;

    b(7); doc.text('COPIA — TALLER', mx, y); y+=3.5;
    n(5.8);
    doc.text('Orden No. '+String(t.id).padStart(6,'0')+'  ·  '+today(), mx, y); y+=3;
    doc.splitTextToSize('Cliente: '+(t.cliente||'—'), cw).forEach(function(l){ doc.text(l,mx,y); y+=2.9; });
    doc.splitTextToSize('Equipo: '+(t.equipo||'—'), cw).forEach(function(l){ doc.text(l,mx,y); y+=2.9; });
    n(5.8); doc.text('Valor:', mx, y);
    b(6.5); doc.text(fmt(saldo > 0 ? saldo : costo), W-mx, y, {align:'right'}); y+=4;
    n(5.5); doc.text('Recibí el equipo a satisfacción.', mx, y); y+=8;
    doc.setLineWidth(0.2); doc.line(mx,y,mx+cw*0.8,y); y+=3;
    n(5.5); doc.text('Firma y C.C. del cliente', mx, y); y+=3;
  }

  return y;
}

async function construirTirillaServicio(tecnicoId, tipo) {
  var t = tecnicos.find(function(x){ return x.id === tecnicoId; });
  if (!t) return;

  var {jsPDF} = window.jspdf;
  var tmp  = new jsPDF({orientation:'portrait',unit:'mm',format:[58,900]});
  var alto = _tirillaServicioPintar(tmp, t, tipo) + 8;

  var doc = new jsPDF({orientation:'portrait',unit:'mm',format:[58,alto]});
  _tirillaServicioPintar(doc, t, tipo);

  var pre = (tipo === 'recepcion') ? 'recepcion' : 'servicio';
  doc.save(pre+'-'+(t.cliente||'').replace(/\s+/g,'-')+'-'+t.id+'.pdf');
  toast((tipo === 'recepcion' ? 'Recibo' : 'Comprobante')+' generado ✓');
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
  doc.text('CONCEPTO', mx+40, y+(isSmall?3.5:4.5));
  doc.text('MONTO', W-mx-2, y+(isSmall?3.5:4.5),{align:'right'});
  doc.setTextColor(0,0,0); y+=isSmall?6:7;

  norm(fs);
  misAbonos.forEach(function(a){
    chk(6);
    doc.text(a.fecha||'', mx+2, y+3);
    var obsLines = doc.splitTextToSize(a.obs||'Abono', cw-60);
    doc.text(obsLines, mx+40, y+3);
    doc.text(fmt(a.monto), W-mx-2, y+3, {align:'right'});
    var rowH = Math.max(obsLines.length * 4, 6) + 4;
    doc.setDrawColor(200); doc.setLineWidth(0.1);
    doc.line(mx, y+rowH, W-mx, y+rowH);
    doc.setDrawColor(0);
    y += rowH;
  });
  y += 4;
  ln(y); y+=2;
  bold(fs); doc.text('TOTAL PAGADO', mx+2, y+4);
  bold(isSmall?9:11); doc.text(fmt(ab), W-mx-2, y+4,{align:'right'});
  y+=8; ln(y); y+=8;

  // ── Precio en letras ──
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
