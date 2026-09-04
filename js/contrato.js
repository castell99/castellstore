// ═══════════════════════════════════════════
//  contrato.js — Contrato de Financiamiento PDF
//  CastellStore · Carlos Castro Elles
// ═══════════════════════════════════════════

// Datos tomados de js/negocio.js (fuente unica).
const VENDEDOR = {
  nombre   : NEGOCIO.titular,
  cedula   : NEGOCIO.cedula,
  direccion: NEGOCIO.direccion + ' ' + NEGOCIO.ciudad,
  telefono : NEGOCIO.telefono,
  negocio  : NEGOCIO.nombre,
};

// Paleta monocroma — definida en negocio.js (fuente unica).
// jsPDF trabaja con RGB en arreglos, no con hex, asi que se
// convierte una sola vez aqui.
function hexRGB(h) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
}
const C_TINTA = hexRGB(NEGOCIO.doc.tinta);
const C_SUAVE = hexRGB(NEGOCIO.doc.suave);
const C_LINEA = hexRGB(NEGOCIO.doc.linea);

let _contratoVentaId = null;
let _contratoData    = null;
let _firmaCli        = false;
let _firmaVen        = false;
let _cedulaFrontFile = null;
let _cedulaBackFile  = null;

// ── Abrir modal ───────────────────────────
function abrirContrato(ventaId) {
  var v = ventas.find(function(x) { return x.id === ventaId; });
  if (!v) return;
  var ini     = parseFloat(v.inicial_pagada) || 0;
  var fin     = parseFloat(v.precio) || 0;
  var contado = parseFloat(v.precio_contado) || fin;
  var cuotasN = parseInt(v.cuotas) || 0;
  var cuotaVal = cuotasN > 0 ? Math.round((fin - ini) / cuotasN) : 0;

  // El plan real de cuotas, con sus fechas. La clausula CUARTA lleva
  // el cuadro completo, asi que se toma de la tabla y no se recalcula.
  var plan = (typeof cuotas !== 'undefined' ? cuotas : [])
    .filter(function(c) { return c.venta_id === ventaId; })
    .sort(function(a,b) { return a.numero - b.numero; });

  _contratoVentaId = ventaId;
  _contratoData    = { v:v, ini:ini, fin:fin, contado:contado, cuotasN:cuotasN, cuotaVal:cuotaVal, plan:plan };
  _cedulaFrontFile = null;
  _cedulaBackFile  = null;
  _firmaCli = false;
  _firmaVen = false;

  ['front','back'].forEach(function(s) {
    var p = document.getElementById('contrato-prev-' + s);
    if (p) { p.src = ''; p.style.display = 'none'; }
  });
  var cedEl = document.getElementById('contrato-cedula');
  if (cedEl) cedEl.value = v.cedula_cliente || '';

  // Por defecto se entrega en el local; si fue a domicilio se cambia.
  var lugEl = document.getElementById('contrato-lugar');
  if (lugEl) lugEl.value = NEGOCIO.direccion + ', ' + NEGOCIO.ciudad;

  var res = document.getElementById('contrato-resumen');
  if (res) {
    res.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      '<div><div style="font-size:11px;color:var(--text3)">Cliente</div><div style="font-weight:600">' + v.cliente + '</div></div>' +
      '<div><div style="font-size:11px;color:var(--text3)">Equipo</div><div style="font-weight:600">' + v.producto + '</div></div>' +
      '<div><div style="font-size:11px;color:var(--text3)">Precio financiado</div><div style="font-weight:700;color:var(--green);font-family:var(--mono)">' + fmt(fin) + '</div></div>' +
      '<div><div style="font-size:11px;color:var(--text3)">Inicial</div><div style="font-weight:600;font-family:var(--mono);color:var(--amber)">' + fmt(ini) + '</div></div>' +
      '<div><div style="font-size:11px;color:var(--text3)">Cuotas</div><div style="font-weight:600">' + cuotasN + ' meses</div></div>' +
      '<div><div style="font-size:11px;color:var(--text3)">Valor cuota</div><div style="font-weight:700;font-family:var(--mono);color:var(--green)">' + fmt(cuotaVal) + '/mes</div></div>' +
      '</div>';
  }

  openModal('modal-contrato');
  setTimeout(function() { iniciarFirmas(); }, 300);
}

// ── Canvas de firmas ──────────────────────
function iniciarFirmas() {
  iniciarFirmaCanvas('firma-cliente-canvas', 'cliente');
  iniciarFirmaCanvas('firma-vendedor-canvas', 'vendedor');
}

function iniciarFirmaCanvas(canvasId, tipo) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var newCanvas = canvas.cloneNode(true);
  canvas.parentNode.replaceChild(newCanvas, canvas);
  var nc  = document.getElementById(canvasId);
  var ctx = nc.getContext('2d');
  var drawing = false;

  ctx.clearRect(0, 0, nc.width, nc.height);
  ctx.fillStyle = tipo === 'cliente' ? 'rgba(57,255,20,0.03)' : 'rgba(91,163,201,0.03)';
  ctx.fillRect(0, 0, nc.width, nc.height);
  ctx.fillStyle = 'rgba(150,170,180,0.3)';
  ctx.font = '14px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Firme aquí', nc.width/2, nc.height/2);
  ctx.textAlign = 'left';

  function getPos(e) {
    var rect = nc.getBoundingClientRect();
    var scaleX = nc.width/rect.width, scaleY = nc.height/rect.height;
    return {
      x: ((e.touches?e.touches[0].clientX:e.clientX)-rect.left)*scaleX,
      y: ((e.touches?e.touches[0].clientY:e.clientY)-rect.top)*scaleY
    };
  }

  nc.addEventListener('mousedown', function(e) {
    drawing = true;
    ctx.clearRect(0,0,nc.width,nc.height);
    ctx.fillStyle = tipo==='cliente'?'rgba(57,255,20,0.03)':'rgba(91,163,201,0.03)';
    ctx.fillRect(0,0,nc.width,nc.height);
    var p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y);
    if (tipo==='cliente') _firmaCli=true; else _firmaVen=true;
  });
  nc.addEventListener('mousemove', function(e) {
    if (!drawing) return;
    var p = getPos(e);
    ctx.lineWidth=2; ctx.lineCap='round';
    ctx.strokeStyle = tipo==='cliente'?'#1a1a1a':'#1a1a1a';
    ctx.lineTo(p.x,p.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x,p.y);
  });
  nc.addEventListener('mouseup',    function() { drawing=false; ctx.beginPath(); });
  nc.addEventListener('touchstart', function(e) {
    e.preventDefault(); drawing=true;
    ctx.clearRect(0,0,nc.width,nc.height);
    ctx.fillStyle=tipo==='cliente'?'rgba(57,255,20,0.03)':'rgba(91,163,201,0.03)';
    ctx.fillRect(0,0,nc.width,nc.height);
    var p=getPos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y);
    if(tipo==='cliente')_firmaCli=true;else _firmaVen=true;
  },{passive:false});
  nc.addEventListener('touchmove', function(e) {
    e.preventDefault(); if(!drawing)return;
    var p=getPos(e); ctx.lineWidth=2;ctx.lineCap='round';ctx.strokeStyle='#1a1a1a';
    ctx.lineTo(p.x,p.y);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x,p.y);
  },{passive:false});
  nc.addEventListener('touchend', function(e) { e.preventDefault(); drawing=false; ctx.beginPath(); },{passive:false});
}

function limpiarFirma(tipo) {
  if (tipo==='cliente') _firmaCli=false; else _firmaVen=false;
  iniciarFirmaCanvas(tipo==='cliente'?'firma-cliente-canvas':'firma-vendedor-canvas', tipo);
}

function prevContratoCedula(input, lado) {
  var file = input.files[0]; if (!file) return;
  if (lado==='front') _cedulaFrontFile=file; else _cedulaBackFile=file;
  var reader = new FileReader();
  reader.onload = function(e) {
    var prev = document.getElementById('contrato-prev-'+lado);
    if (prev) { prev.src=e.target.result; prev.style.display='block'; }
  };
  reader.readAsDataURL(file);
}

async function subirArchivoContrato(file, nombre) {
  var res = await fetch(SUPA+'/storage/v1/object/contratos-docs/'+nombre, {
    method:'POST', headers: uploadHeaders(file.type), body:file
  });
  if (!res.ok) throw new Error('Error subiendo archivo');
  // Ruta, no URL publica: el bucket es privado. Para mostrar estas
  // imagenes usa firmarUrl(ruta).
  return 'contratos-docs/'+nombre;
}

// ── Generar contrato ──────────────────────
async function generarContrato() {
  if (!_contratoData) return;
  var cedula = document.getElementById('contrato-cedula')?.value.trim();
  if (!cedula) { toast('Ingresa el número de cédula del cliente', 'err'); return; }
  if (!_firmaCli) { toast('El cliente debe firmar el contrato', 'err'); return; }
  if (!_firmaVen) { toast('El vendedor debe firmar el contrato', 'err'); return; }

  setBtn('btn-contrato', true, 'Generando PDF...');
  try {
    var { v, ini, fin, contado, cuotasN, cuotaVal, plan } = _contratoData;
    var ts = Date.now();

    var firmaCliImg = document.getElementById('firma-cliente-canvas')?.toDataURL('image/png');
    var firmaVenImg = document.getElementById('firma-vendedor-canvas')?.toDataURL('image/png');

    var urlFront = '', urlBack = '';
    if (_cedulaFrontFile) urlFront = await subirArchivoContrato(_cedulaFrontFile, 'cedula_front_'+v.id+'_'+ts+'.'+_cedulaFrontFile.name.split('.').pop());
    if (_cedulaBackFile)  urlBack  = await subirArchivoContrato(_cedulaBackFile,  'cedula_back_' +v.id+'_'+ts+'.'+_cedulaBackFile.name.split('.').pop());

      var datos = {
        venta_id:v.id, cliente:v.cliente, cedula_cliente:cedula,
        ciudad_expedicion: v.ciudad_expedicion || '',
        telefono: v.telefono_cliente || '', email: v.email_cliente || '',
        equipo: v.producto,
        almacenamiento: v.almacenamiento || '', color: v.color || '',
        estado_equipo: v.estado_equipo || '', numero_serie: v.numero_serie || '',
        accesorios: v.accesorios || '', factura_num: v.factura_num || '',
        imei: v.imei || '', imei2: v.imei2 || '',
        lugar_entrega: document.getElementById('contrato-lugar')?.value.trim() || '',
        fecha_entrega: v.fecha || today(),
        precio_contado: contado,
        precio_financiado:fin, inicial:ini, cuotas:cuotasN,
        valor_cuota:cuotaVal, fecha_inicio:today(),
        firma_cliente:firmaCliImg, firma_vendedor:firmaVenImg,
        foto_cedula_front:urlFront, foto_cedula_back:urlBack, estado:'firmado',
      };

    await sb('contratos','POST', datos);
    await generarPDFContrato(datos, firmaCliImg, firmaVenImg);

    toast('Contrato generado ✓');
    closeModal('modal-contrato');
  } catch(e) { toast('Error: '+e.message,'err'); }
  setBtn('btn-contrato', false, '📄 Generar contrato');
}

// ── PDF con jsPDF ─────────────────────────
async function generarPDFContrato(datos, firmaCliImg, firmaVenImg) {
  var { jsPDF } = window.jspdf;
  var doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'letter' });

  var W    = 215.9; // ancho carta mm
  var mx   = 15;    // margen
  var cw   = W - mx*2; // ancho contenido
  var y    = 0;

  // ── Encabezado ──
  // Sin franja oscura: dos paginas con fondo lleno consumen mucha
  // tinta y el documento se lee peor impreso en laser.
  try {
    doc.addImage(LOGO_BN_B64, 'PNG', mx, 8, 18, 18);
  } catch(e){}

  doc.setTextColor(C_TINTA[0], C_TINTA[1], C_TINTA[2]);
  doc.setFont('helvetica','bold');
  doc.setFontSize(14);
  doc.text(VENDEDOR.negocio, mx + 22, 15);

  doc.setTextColor(C_SUAVE[0], C_SUAVE[1], C_SUAVE[2]);
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.text(VENDEDOR.direccion, mx + 22, 20);
  doc.text('Tel: ' + VENDEDOR.telefono + '  |  C.C. ' + VENDEDOR.cedula, mx + 22, 24);

  doc.setTextColor(C_TINTA[0], C_TINTA[1], C_TINTA[2]);
  doc.setFont('helvetica','bold');
  doc.setFontSize(9);
  doc.text('Contrato N° ' + datos.venta_id, W - mx, 15, {align:'right'});
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.setTextColor(C_SUAVE[0], C_SUAVE[1], C_SUAVE[2]);
  doc.text('Fecha: ' + datos.fecha_inicio, W - mx, 20, {align:'right'});

  // Linea gruesa bajo el encabezado
  doc.setDrawColor(C_TINTA[0], C_TINTA[1], C_TINTA[2]);
  doc.setLineWidth(0.6);
  doc.line(mx, 30, W - mx, 30);

  y = 40;

  // ── Titulo ──
  doc.setTextColor(C_TINTA[0], C_TINTA[1], C_TINTA[2]);
  doc.setFont('helvetica','bold');
  doc.setFontSize(13);
  doc.text('CONTRATO DE COMPRAVENTA DE EQUIPO MÓVIL', W/2, y, {align:'center'});
  y += 10;

  // ── Helper: titulo de clausula + texto ajustado al ancho ──
    function addSection(titulo, texto) {
      checkPage(24);
      doc.setFont('helvetica','bold');
      doc.setFontSize(9);
      doc.setTextColor(C_TINTA[0], C_TINTA[1], C_TINTA[2]);
      doc.text(titulo, mx, y);
      y += 5;
      doc.setFont('helvetica','normal');
      doc.setFontSize(8.5);
      var lines = doc.splitTextToSize(texto, cw);
      doc.text(lines, mx, y);
      y += lines.length * 4.2 + 5;
    }
  
    // Salta de pagina ANTES de escribir, no despues: asi un titulo
    // nunca queda solo al final de una hoja.
    function checkPage(alto) {
      if (y + (alto || 10) > 255) { doc.addPage(); y = 20; }
    }
  
    // ── Comparecientes ──
    addSection('',
      'Entre los suscritos a saber: ' + VENDEDOR.nombre.toUpperCase() +
      ', mayor de edad, vecino de ' + NEGOCIO.ciudad + ', identificado con cédula de ciudadanía No. ' +
      VENDEDOR.cedula + ' expedida en Villanueva, quien obra en nombre propio y para efectos del presente ' +
      'contrato se denominará EL VENDEDOR; y de la otra parte, ' + datos.cliente.toUpperCase() +
      ', mayor de edad, identificado con cédula de ciudadanía No. ' + datos.cedula_cliente +
      (datos.ciudad_expedicion ? ' expedida en ' + datos.ciudad_expedicion : '') +
      ', quien obra en nombre propio y para efectos del presente contrato se denominará EL COMPRADOR; ' +
      'hemos convenido celebrar el presente CONTRATO DE COMPRAVENTA DE BIEN MUEBLE, el cual se regirá por ' +
      'las normas civiles y comerciales aplicables y especialmente por las siguientes cláusulas:'
    );
  
    // ── PRIMERA: ficha del equipo ──
    // Va como lista y no como parrafo: es la identificacion del bien
    // sobre el que se reserva el dominio, tiene que leerse de un vistazo.
    checkPage(60);
    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    doc.text('PRIMERA. OBJETO E IDENTIFICACIÓN DEL BIEN', mx, y);
    y += 5;
    doc.setFont('helvetica','normal');
    doc.setFontSize(8.5);
    doc.text('El VENDEDOR vende al COMPRADOR el siguiente equipo móvil:', mx, y);
    y += 6;
  
    var ficha = [
      ['Marca y modelo', datos.equipo],
      ['Capacidad',      datos.almacenamiento],
      ['Color',          datos.color],
      ['Estado',         datos.estado_equipo],
      ['IMEI 1',         datos.imei],
      ['IMEI 2',         datos.imei2],
      ['Número de serie',datos.numero_serie],
      ['Accesorios entregados', datos.accesorios],
      ['Factura o documento equivalente No.', datos.factura_num],
    ];
    ficha.forEach(function(f) {
      if (!f[1]) return;   // los opcionales vacios no imprimen renglon
      doc.setFont('helvetica','bold');
      doc.text('•  ' + f[0] + ': ', mx + 3, y);
      var anchoEt = doc.getTextWidth('•  ' + f[0] + ': ');
      doc.setFont('helvetica','normal');
      doc.text(String(f[1]), mx + 3 + anchoEt, y);
      y += 4.6;
    });
    y += 5;
  
    addSection('SEGUNDA. ENTREGA',
      'El VENDEDOR entrega materialmente el equipo al COMPRADOR el día ' + datos.fecha_entrega +
      ', en ' + (datos.lugar_entrega || NEGOCIO.direccion + ', ' + NEGOCIO.ciudad) +
      (datos.accesorios ? ', junto con los accesorios descritos' : '') +
      '. El COMPRADOR declara haberlo recibido y haber verificado su estado aparente de funcionamiento, ' +
      'sin perjuicio de la garantía legal aplicable.'
    );
  
    var saldoFin = datos.precio_contado - datos.inicial;
    var cargoFin = datos.precio_financiado - datos.precio_contado;
  
    addSection('TERCERA. PRECIO Y FINANCIACIÓN',
      'El precio de contado del equipo es de ' + fmt(datos.precio_contado) +
      '. El COMPRADOR paga una cuota inicial de ' + fmt(datos.inicial) +
      ', recibida por el VENDEDOR el día ' + datos.fecha_entrega + '. ' +
      'El saldo financiado es de ' + fmt(saldoFin) +
      '. Los intereses remuneratorios y demás cargos expresamente pactados ascienden, en total, a ' + fmt(cargoFin) +
      '. Por tanto, el valor total a pagar por la compra financiada es de ' + fmt(datos.precio_financiado) +
      '. No se cobrarán cargos distintos a los expresamente informados en esta cláusula.'
    );
  
    // ── CUARTA: cuadro de cuotas ──
    checkPage(30 + (plan.length || datos.cuotas) * 5);
    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    doc.text('CUARTA. FORMA DE PAGO', mx, y);
    y += 5;
    doc.setFont('helvetica','normal');
    doc.setFontSize(8.5);
    var introPago = doc.splitTextToSize(
      'El COMPRADOR pagará el saldo en ' + datos.cuotas + ' cuota(s) de ' + fmt(datos.valor_cuota) +
      ' cada una, con vencimiento en las siguientes fechas:', cw);
    doc.text(introPago, mx, y);
    y += introPago.length * 4.2 + 4;
  
    // Encabezado del cuadro
    var col1 = mx + 3, col2 = mx + 30, col3 = W - mx - 3;
    doc.setDrawColor(C_TINTA[0], C_TINTA[1], C_TINTA[2]);
    doc.setLineWidth(0.4);
    doc.line(mx, y - 4, W - mx, y - 4);
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    doc.text('CUOTA', col1, y);
    doc.text('FECHA DE VENCIMIENTO', col2, y);
    doc.text('VALOR', col3, y, {align:'right'});
    y += 2;
    doc.setLineWidth(0.2);
    doc.line(mx, y, W - mx, y);
    y += 5;
  
    doc.setFont('helvetica','normal');
    doc.setFontSize(8.5);
    if (plan.length) {
      plan.forEach(function(c) {
        checkPage(8);
        doc.text(String(c.numero), col1, y);
        doc.text(String(c.fecha_venc), col2, y);
        doc.text(fmt(c.monto), col3, y, {align:'right'});
        y += 5;
      });
    } else {
      doc.text('Plan de cuotas pendiente de definir.', col1, y);
      y += 5;
    }
    doc.setDrawColor(C_TINTA[0], C_TINTA[1], C_TINTA[2]);
    doc.setLineWidth(0.4);
    doc.line(mx, y - 1, W - mx, y - 1);
    y += 6;
  
    var lineasPago = doc.splitTextToSize(
      'El pago podrá realizarse en ' + NEGOCIO.direccion + ', ' + NEGOCIO.ciudad +
      ' o mediante transferencia a ' + NEGOCIO.banco + ', llave ' + NEGOCIO.llave +
      ' a nombre de ' + NEGOCIO.titularPago +
      '. El VENDEDOR entregará constancia de cada pago y, al pago total, constancia de cancelación definitiva.', cw);
    doc.text(lineasPago, mx, y);
    y += lineasPago.length * 4.2 + 6;
  
    addSection('QUINTA. MORA',
      'Sobre las sumas efectivamente vencidas e insolutas se causarán intereses de mora a la tasa máxima legal ' +
      'vigente al momento de su causación, sin exceder los límites legales aplicables. Cualquier exigibilidad ' +
      'anticipada del saldo se sujetará a las condiciones y límites establecidos por la ley para la venta con ' +
      'reserva de dominio.'
    );
  
    addSection('SEXTA. RESERVA DE DOMINIO',
      'Hasta que el COMPRADOR pague la totalidad del precio pactado, el VENDEDOR conserva la propiedad del equipo. ' +
      'El COMPRADOR tendrá la tenencia y uso ordinario del bien desde su entrega, asumirá los riesgos derivados de ' +
      'esta y no podrá venderlo, gravarlo, ni disponer de él sin autorización previa y escrita del VENDEDOR. ' +
      'Una vez pagado el total, el VENDEDOR entregará constancia de adquisición de la propiedad.'
    );
  
    addSection('SÉPTIMA. GARANTÍA LEGAL',
      'El equipo cuenta con la garantía legal que corresponda conforme a la Ley 1480 de 2011 y las condiciones ' +
      'informadas por el productor o proveedor. La garantía cubre la calidad, idoneidad, seguridad y funcionamiento ' +
      'del producto en los términos legales. La presente cláusula no limita los derechos legales del COMPRADOR.'
    );
  
    addSection('OCTAVA. OBLIGACIONES DEL COMPRADOR',
      'El COMPRADOR se obliga a: (i) pagar las cuotas en las fechas pactadas; (ii) usar el equipo de manera ordinaria ' +
      'y conforme a sus instrucciones; (iii) informar al VENDEDOR cualquier cambio de domicilio dentro de los diez (10) ' +
      'días siguientes; y (iv) informar oportunamente cualquier medida cautelar o de ejecución que recaiga sobre el equipo.'
    );
  
    addSection('NOVENA. ATENCIÓN DE RECLAMACIONES',
      'El COMPRADOR podrá presentar solicitudes relacionadas con pagos, garantía o el contrato en ' +
      NEGOCIO.direccion + ', ' + NEGOCIO.ciudad + ', ' + NEGOCIO.telefono + ' y ' + NEGOCIO.correo +
      '. El VENDEDOR conservará la constancia de la operación y entregará copia de este contrato al COMPRADOR.'
    );
  
    addSection('DÉCIMA. DATOS PERSONALES',
      'Si el VENDEDOR recolecta o trata datos personales del COMPRADOR, lo hará conforme a la autorización y política ' +
      'de tratamiento de datos aplicables. Cualquier reporte a centrales de riesgo requerirá el cumplimiento previo ' +
      'de los requisitos legales correspondientes.'
    );
  
    addSection('DÉCIMA PRIMERA. SOLUCIÓN DE CONTROVERSIAS',
      'Las partes procurarán resolver directamente cualquier diferencia. De no ser posible, serán competentes las ' +
      'autoridades y jueces que determine la ley.'
    );
  
    addSection('DÉCIMA SEGUNDA. FIRMA',
      'El presente contrato se firma en ' + NEGOCIO.ciudad + ', el ' + datos.fecha_inicio +
      ', en dos ejemplares o mediante mecanismo electrónico que permita identificar la aceptación de las partes.'
    );

  // ── Fotos cédula ──
  if (_cedulaFrontFile || _cedulaBackFile) {
    checkPage();
    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    doc.setTextColor(oscuro[0],oscuro[1],oscuro[2]);
    doc.text('DOCUMENTOS DE IDENTIDAD', mx, y);
    y += 5;

    var imgW = (cw - 8) / 2;
    var imgH = 35;

    if (_cedulaFrontFile) {
      var frontB64 = await fileToBase64(_cedulaFrontFile);
      try {
        doc.addImage(frontB64, 'JPEG', mx, y, imgW, imgH);
        doc.setFont('helvetica','normal');
        doc.setFontSize(7);
        doc.setTextColor(gris[0],gris[1],gris[2]);
        doc.text('Cédula frontal', mx, y+imgH+4);
      } catch(e){}
    }
    if (_cedulaBackFile) {
      var backB64 = await fileToBase64(_cedulaBackFile);
      try {
        doc.addImage(backB64, 'JPEG', mx+imgW+8, y, imgW, imgH);
        doc.setFont('helvetica','normal');
        doc.setFontSize(7);
        doc.setTextColor(gris[0],gris[1],gris[2]);
        doc.text('Cédula posterior', mx+imgW+8, y+imgH+4);
      } catch(e){}
    }
    y += imgH + 10;
  }

  // ── Firmas ──
  doc.addPage();
  y = 20;
  doc.setDrawColor(200,200,200);
  doc.setLineWidth(0.3);
  doc.line(mx, y, W-mx, y);
  y += 6;

  doc.setFont('helvetica','bold');
  doc.setFontSize(10);
  doc.setTextColor(oscuro[0],oscuro[1],oscuro[2]);
  doc.text('FIRMAS DE LAS PARTES', W/2, y, {align:'center'});
  y += 8;

  var fw = (cw-10)/2;
  var fh = 30;

  // Recuadros firma
  doc.setDrawColor(verde[0],verde[1],verde[2]);
  doc.setLineWidth(0.4);
  doc.rect(mx, y, fw, fh);

  doc.setDrawColor(azul[0],azul[1],azul[2]);
  doc.rect(mx+fw+10, y, fw, fh);

  // Imágenes firma
  try {
    doc.addImage(firmaCliImg,'PNG', mx+2, y+2, fw-4, fh-4);
  } catch(e){}
  try {
    doc.addImage(firmaVenImg,'PNG', mx+fw+12, y+2, fw-4, fh-4);
  } catch(e){}

  y += fh + 4;
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.setTextColor(negro[0],negro[1],negro[2]);
  doc.text('COMPRADOR: '+datos.cliente, mx, y);
  doc.text('VENDEDOR: '+VENDEDOR.nombre, mx+fw+10, y);
  y += 4;
  doc.text('C.C. '+datos.cedula_cliente, mx, y);
  doc.text('C.C. '+VENDEDOR.cedula, mx+fw+10, y);
  y += 12;

  // Pie de página
  doc.setFont('helvetica','italic');
  doc.setFontSize(7);
  doc.setTextColor(gris[0],gris[1],gris[2]);
  doc.text('Contrato generado digitalmente por '+VENDEDOR.negocio+' · '+datos.fecha_inicio, W/2, y, {align:'center'});
  y += 4;
  doc.text('Validez legal conforme al artículo 11 de la Ley 527 de 1999 (Comercio Electrónico — Colombia)', W/2, y, {align:'center'});

  // ── Descargar PDF ──
  var nombre = 'contrato-'+datos.cliente.replace(/\s+/g,'-')+'-'+datos.venta_id+'.pdf';
  doc.save(nombre);

  // Modal compartir
  var msg = encodeURIComponent(
    '📄 *CONTRATO DE FINANCIAMIENTO — '+VENDEDOR.negocio+'*\n\n'+
    'Estimado/a *'+datos.cliente+'*,\n'+
    'Adjunto su contrato de compraventa a crédito del equipo *'+datos.equipo+'*.\n\n'+
    '💰 Valor financiado: *'+fmt(datos.precio_financiado)+'*\n'+
    '📅 Cuotas: *'+datos.cuotas+' x '+fmt(datos.valor_cuota)+'/mes*\n\n'+
    '📞 '+VENDEDOR.telefono+' | '+VENDEDOR.negocio
  );

  var m = document.getElementById('modal-contrato-preview');
  if (!m) { m=document.createElement('div');m.id='modal-contrato-preview';m.className='overlay';document.body.appendChild(m); }
  m.innerHTML = '<div class="modal" style="max-width:500px">'+
    '<div class="modal-header"><div class="modal-title">📄 Contrato generado</div>'+
    '<button class="close-btn" onclick="document.getElementById(\'modal-contrato-preview\').classList.remove(\'open\')">×</button></div>'+
    '<div class="alert info" style="margin-bottom:14px">El PDF se descargó automáticamente en tu dispositivo.</div>'+
    '<div class="modal-footer">'+
    '<button class="btn" onclick="document.getElementById(\'modal-contrato-preview\').classList.remove(\'open\')">Cerrar</button>'+
    '<button class="btn" onclick="generarPDFContrato(_contratoData,\''+firmaCliImg+'\',\''+firmaVenImg+'\')">⬇️ Descargar de nuevo</button>'+
    '<a href="https://wa.me/?text='+msg+'" target="_blank"><button class="btn" style="background:#25D366;border-color:#25D366;color:#fff">💬 WhatsApp</button></a>'+
    '</div></div>';
  m.classList.add('open');
}

function fileToBase64(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload  = function(e) { resolve(e.target.result); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
