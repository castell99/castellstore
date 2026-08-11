// ═══════════════════════════════════════════
//  factura.js — Factura de Venta PDF
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
  if (num === 1000000) return 'UN MILLON';

  var resultado = '';

  if (num >= 1000000) {
    var m = Math.floor(num / 1000000);
    resultado += (m === 1 ? 'UN MILLON' : numeroALetras(m) + ' MILLONES');
    num %= 1000000;
    if (num > 0) resultado += ' ';
  }
  if (num >= 1000) {
    var m2 = Math.floor(num / 1000);
    resultado += (m2 === 1 ? 'MIL' : numeroALetras(m2) + ' MIL');
    num %= 1000;
    if (num > 0) resultado += ' ';
  }
  if (num >= 100) {
    resultado += centenas[Math.floor(num / 100)];
    num %= 100;
    if (num > 0) resultado += ' ';
  }
  if (num >= 20) {
    resultado += decenas[Math.floor(num / 10)];
    num %= 10;
    if (num > 0) resultado += ' Y ' + unidades[num];
  } else if (num > 0) {
    resultado += unidades[num];
  }

  return resultado.trim();
}

function abrirModalFactura(ventaId) {
  var v = ventas.find(function(x) { return x.id === ventaId; });
  if (!v) return;

  var m = document.getElementById('modal-factura-size');
  if (!m) {
    m = document.createElement('div');
    m.id = 'modal-factura-size';
    m.className = 'overlay';
    document.body.appendChild(m);
  }

  m.innerHTML = '<div class="modal" style="max-width:380px">' +
    '<div class="modal-header"><div class="modal-title">🧾 Generar Factura</div>' +
    '<button class="close-btn" onclick="document.getElementById(\'modal-factura-size\').classList.remove(\'open\')">×</button></div>' +
    '<div style="padding:8px 0">' +
    '<p style="font-size:13px;color:var(--text2);margin-bottom:14px">Selecciona el tamaño de papel:</p>' +
    '<div style="display:flex;flex-direction:column;gap:10px">' +
    '<button class="btn primary" style="justify-content:flex-start;gap:10px" onclick="generarFacturaVenta(' + ventaId + ',\'letter\');document.getElementById(\'modal-factura-size\').classList.remove(\'open\')">' +
      '<span style="font-size:20px">📄</span><div style="text-align:left"><div style="font-weight:600">Carta (Letter)</div><div style="font-size:11px;opacity:.8">21.6 x 27.9 cm — Para impresoras normales</div></div>' +
    '</button>' +
    '<button class="btn" style="justify-content:flex-start;gap:10px" onclick="generarFacturaVenta(' + ventaId + ',\'5x7\');document.getElementById(\'modal-factura-size\').classList.remove(\'open\')">' +
      '<span style="font-size:20px">🧾</span><div style="text-align:left"><div style="font-weight:600">Comprobante 5×7</div><div style="font-size:11px;color:var(--text3)">12.7 x 17.8 cm — Para impresoras de tickets</div></div>' +
    '</button>' +
    '</div></div>' +
    '<div class="modal-footer"><button class="btn" onclick="document.getElementById(\'modal-factura-size\').classList.remove(\'open\')">Cancelar</button></div>' +
    '</div>';
  m.classList.add('open');
}

async function generarFacturaVenta(ventaId, tamano) {
  if (!tamano) { abrirModalFactura(ventaId); return; }

  var v   = ventas.find(function(x) { return x.id === ventaId; });
  if (!v) return;

  var eq  = equiposFin.find(function(e) { return e.marca + ' ' + e.modelo === v.producto; });
  var esModoLibre = !eq; // Si no está en catálogo es segunda o no catalogado
  var mesesGarantia = esModoLibre ? 2 : 6;
  var tipoEquipo    = esModoLibre ? 'segunda / no catalogado' : 'nuevo del catalogo';

  var ab  = abonadoPor('venta', v.id);
  var sal = saldoPendiente('venta', v.id, v.precio);
  var misCuotas = cuotas.filter(function(c) { return c.venta_id === v.id; }).sort(function(a,b) { return a.numero - b.numero; });
  var ini = parseFloat(v.inicial_pagada) || 0;
  var cuotaVal = misCuotas.length > 0 ? parseFloat(misCuotas[0].monto) : 0;

  var { jsPDF } = window.jspdf;

  // Tamaños
  var isSmall = tamano === '5x7';
  var format  = isSmall ? [127, 178] : 'letter'; // mm
  var doc = new jsPDF({ orientation:'portrait', unit:'mm', format: format });

  var W   = isSmall ? 127 : 215.9;
  var mx  = isSmall ? 8   : 15;
  var cw  = W - mx*2;
  var fs  = isSmall ? 7   : 9;
  var fsT = isSmall ? 9   : 12;
  var y   = 0;

  function line(x1, yy, x2) {
    doc.setDrawColor(0); doc.setLineWidth(0.3);
    doc.line(x1, yy, x2, yy);
  }

  function bold(size) { doc.setFont('helvetica','bold'); doc.setFontSize(size || fs); }
  function normal(size) { doc.setFont('helvetica','normal'); doc.setFontSize(size || fs); }
  function checkPage(needed) { if (y + (needed||10) > (isSmall?168:267)) { doc.addPage(); y = 10; } }

  // ── Encabezado ──
  bold(isSmall?11:14);
  doc.text(FACTURA_VENDEDOR.negocio, mx, 12);
  normal(isSmall?6:8);
  doc.text(FACTURA_VENDEDOR.nombre + ' · C.C. ' + FACTURA_VENDEDOR.cedula, mx, 17);
  doc.text(FACTURA_VENDEDOR.direccion, mx, 21);
  doc.text('Tel: ' + FACTURA_VENDEDOR.telefono, mx, 25);

  // Caja factura (derecha)
  bold(isSmall?7:9);
  doc.text('FACTURA DE VENTA', W-mx, 12, {align:'right'});
  normal(isSmall?6:8);
  doc.text('No. ' + String(v.id).padStart(6,'0'), W-mx, 17, {align:'right'});
  doc.text('Fecha: ' + today(), W-mx, 21, {align:'right'});

  y = 29;
  line(mx, y, W-mx);
  y += 4;

  // ── Datos comprador + equipo ──
  var colW = (cw-4)/2;
  bold(fs-1); doc.text('DATOS DEL COMPRADOR', mx, y); y += 4;
  normal(fs);
  doc.text(v.cliente || '', mx, y); y += 4;
  if (v.cedula_cliente) { doc.text('C.C.: ' + v.cedula_cliente, mx, y); y += 4; }
  if (v.telefono_cliente) { doc.text('Tel: ' + v.telefono_cliente, mx, y); y += 4; }
  y += 2;

  bold(fs-1); doc.text('DATOS DEL EQUIPO', mx, y); y += 4;
  normal(fs);
  doc.text(v.producto || '', mx, y); y += 4;
  if (v.color) { doc.text('Color: ' + v.color, mx, y); y += 4; }
  if (eq && eq.ram) { doc.text('RAM: ' + eq.ram + (eq.almacenamiento ? ' · ' + eq.almacenamiento : ''), mx, y); y += 4; }
  if (v.imei)  { doc.text('IMEI 1: ' + v.imei, mx, y); y += 4; }
  if (v.imei2) { doc.text('IMEI 2: ' + v.imei2, mx, y); y += 4; }
  y += 2;
  line(mx, y, W-mx);
  y += 4;

  // ── Tabla producto ──
  doc.setFillColor(0,0,0);
  doc.rect(mx, y, cw, isSmall?5:6, 'F');
  doc.setTextColor(255,255,255);
  bold(fs);
  doc.text('DESCRIPCION', mx+2, y+(isSmall?3.5:4.5));
  doc.text('VALOR', W-mx-2, y+(isSmall?3.5:4.5), {align:'right'});
  doc.setTextColor(0,0,0);
  y += isSmall?6:7;

  normal(fs);
  var descProd = v.producto;
  if (eq && eq.ram) descProd += ' · ' + eq.ram;
  if (eq && eq.almacenamiento) descProd += ' · ' + eq.almacenamiento;
  if (v.color) descProd += ' · ' + v.color;
  var descLines = doc.splitTextToSize(descProd, cw - 25);
  doc.text(descLines, mx+2, y+3);

  // Detalle financiamiento
  var detalleF = '';
  if (v.pago === 'Financiado' && misCuotas.length > 0) {
    detalleF = 'Financiado · ' + misCuotas.length + ' cuotas de ' + fmt(cuotaVal) + '/mes · Inicial: ' + fmt(ini);
  } else if (v.pago === 'Financiado') {
    detalleF = 'Financiado · Inicial: ' + fmt(ini);
  } else {
    detalleF = 'Contado';
  }
  var detLines = doc.splitTextToSize(detalleF, cw - 25);
  doc.text(descLines, mx+2, y+3);
  doc.setFontSize(fs-1);
  doc.text(detLines, mx+2, y+3+descLines.length*3.5);

  bold(fs);
  doc.text(fmt(v.precio), W-mx-2, y+3, {align:'right'});
  y += Math.max(descLines.length + detLines.length, 1) * 4 + 6;

  line(mx, y, W-mx);
  y += 2;
  bold(fsT-2);
  doc.text('TOTAL', mx+2, y+4);
  bold(fsT);
  doc.text(fmt(v.precio), W-mx-2, y+4, {align:'right'});
  y += 8;
  line(mx, y, W-mx);
  y += 4;

  // ── Valor en letras ──
  checkPage(10);
  doc.setDrawColor(150); doc.setLineWidth(0.2);
  doc.rect(mx, y, cw, isSmall?8:9);
  doc.setDrawColor(0);
  bold(fs-1);
  doc.text('SON:', mx+2, y+(isSmall?3:3.5));
  normal(fs-1);
  var letras = numeroALetras(Math.round(parseFloat(v.precio)||0)) + ' PESOS M/CTE';
  var letrasLines = doc.splitTextToSize('(' + letras + ')', cw-12);
  doc.text(letrasLines, mx+12, y+(isSmall?3:3.5));
  y += isSmall?10:11;

  // ── Método de pago ──
  checkPage(12);
  bold(fs-1); doc.text('METODO DE PAGO:', mx, y); y += 4;
  normal(fs);
  var metodo = v.pago || 'No especificado';
  if (v.observaciones) metodo += ' · ' + v.observaciones;
  var metLines = doc.splitTextToSize(metodo, cw);
  doc.text(metLines, mx, y);
  y += metLines.length * 4 + 2;
  line(mx, y, W-mx);
  y += 4;

  // ── Garantía ──
  checkPage(30);
  var colG = (cw-4)/2;

  bold(fs-1); doc.text('GARANTIA DEL EQUIPO', mx, y); y += 4;
  normal(fs);
  bold(fs); doc.text(mesesGarantia + ' meses (' + tipoEquipo + ')', mx, y); y += 4;
  normal(fs);
  doc.text('· Mal funcionamiento del equipo por defecto de fabrica', mx, y); y += 4;
  doc.text('· No aplica para equipos no registrados ante operadores', mx, y); y += 6;

  bold(fs-1); doc.text('GARANTIA NO APLICA POR:', mx, y); y += 4;
  normal(fs);
  GARANTIA_NO_APLICA.forEach(function(item) {
    checkPage(5);
    doc.text('· ' + item, mx, y); y += 4;
  });
  y += 2;
  line(mx, y, W-mx);
  y += 4;

  // ── Términos ──
  checkPage(20);
  bold(fs-1); doc.text('TERMINOS Y CONDICIONES', mx, y); y += 4;
  normal(fs-1);
  var terminos = [
    '1. El equipo sale en perfectas condiciones segun revision al momento de la entrega.',
    '2. Para hacer efectiva la garantia debe presentar esta factura original.',
    '3. La garantia no cubre los casos mencionados anteriormente.',
    '4. Los pagos deben realizarse en las fechas acordadas segun el plan de cuotas.',
    '5. En caso de mora se aplicaran los intereses legales vigentes.',
  ];
  terminos.forEach(function(t) {
    var tLines = doc.splitTextToSize(t, cw);
    checkPage(tLines.length * 3.5 + 1);
    doc.text(tLines, mx, y);
    y += tLines.length * 3.5 + 1;
  });
  y += 4;

  // ── Firmas ──
  checkPage(30);
  var fw = (cw-10)/2;
  y += 15;
  line(mx, y, mx+fw);
  line(mx+fw+10, y, mx+fw+10+fw);
  y += 3;
  normal(fs-1);
  doc.text('Firma vendedor', mx, y);
  doc.text('Firma comprador', mx+fw+10, y);
  y += 4;
  bold(fs-1);
  doc.text(FACTURA_VENDEDOR.nombre, mx, y);
  doc.text(v.cliente || '', mx+fw+10, y);
  y += 4;
  normal(fs-1);
  doc.text('C.C. ' + FACTURA_VENDEDOR.cedula, mx, y);
  if (v.cedula_cliente) doc.text('C.C. ' + v.cedula_cliente, mx+fw+10, y);
  y += 8;

  // Pie
  line(mx, y, W-mx);
  y += 3;
  doc.setFontSize(fs-2);
  doc.text(FACTURA_VENDEDOR.negocio + ' · ' + FACTURA_VENDEDOR.web + ' · Tel: ' + FACTURA_VENDEDOR.telefono, W/2, y+3, {align:'center'});

  var nombre = 'factura-' + (v.cliente||'').replace(/\s+/g,'-') + '-' + v.id + '.pdf';
  doc.save(nombre);
  toast('Factura generada ✓');
}
