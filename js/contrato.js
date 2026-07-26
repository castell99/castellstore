// ═══════════════════════════════════════════
//  contrato.js — Contrato de Financiamiento PDF
//  CastellStore · Carlos Castro Elles
// ═══════════════════════════════════════════

const VENDEDOR = {
  nombre   : 'Carlos Castro Elles',
  cedula   : '1052740183',
  direccion: 'Cra 18 N 10-53 Villanueva, Bolívar',
  telefono : '301 719 2825',
  negocio  : 'CastellStore',
};

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
  var eq      = equiposFin.find(function(e) { return e.marca + ' ' + e.modelo === v.producto; });
  var ini     = parseFloat(v.inicial_pagada) || 0;
  var fin     = parseFloat(v.precio) || 0;
  var cuotasN = parseInt(v.cuotas) || 0;
  var cuotaVal = cuotasN > 0 ? Math.round((fin - ini) / cuotasN) : 0;

  _contratoVentaId = ventaId;
  _contratoData    = { v:v, eq:eq, ini:ini, fin:fin, cuotasN:cuotasN, cuotaVal:cuotaVal };
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
    method:'POST', headers:{'Authorization':'Bearer '+KEY,'Content-Type':file.type,'x-upsert':'true'}, body:file
  });
  if (!res.ok) throw new Error('Error subiendo archivo');
  return SUPA+'/storage/v1/object/public/contratos-docs/'+nombre;
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
    var { v, eq, ini, fin, cuotasN, cuotaVal } = _contratoData;
    var ts = Date.now();

    var firmaCliImg = document.getElementById('firma-cliente-canvas')?.toDataURL('image/png');
    var firmaVenImg = document.getElementById('firma-vendedor-canvas')?.toDataURL('image/png');

    var urlFront = '', urlBack = '';
    if (_cedulaFrontFile) urlFront = await subirArchivoContrato(_cedulaFrontFile, 'cedula_front_'+v.id+'_'+ts+'.'+_cedulaFrontFile.name.split('.').pop());
    if (_cedulaBackFile)  urlBack  = await subirArchivoContrato(_cedulaBackFile,  'cedula_back_' +v.id+'_'+ts+'.'+_cedulaBackFile.name.split('.').pop());

    var datos = {
      venta_id:v.id, cliente:v.cliente, cedula_cliente:cedula,
      telefono:v.telefono_cliente||'', equipo:v.producto,
      precio_contado: eq?eq.precio_contado:fin,
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

  // ── Colores ──
  var verde  = [164,214,94];
  var azul   = [91,163,201];
  var oscuro = [16,31,43];
  var gris   = [138,154,161];
  var negro  = [30,30,30];

  // ── Encabezado ──
  doc.setFillColor(oscuro[0],oscuro[1],oscuro[2]);
  doc.rect(0,0,W,28,'F');

  // Logo
  try {
    doc.addImage(LOGO_B64,'PNG',mx,3,22,22);
  } catch(e){}

  doc.setTextColor(verde[0],verde[1],verde[2]);
  doc.setFont('helvetica','bold');
  doc.setFontSize(14);
  doc.text(VENDEDOR.negocio, mx+26, 11);

  doc.setTextColor(gris[0],gris[1],gris[2]);
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.text(VENDEDOR.direccion, mx+26, 17);
  doc.text('Tel: '+VENDEDOR.telefono+'  |  C.C. '+VENDEDOR.cedula, mx+26, 22);

  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(9);
  doc.text('Contrato N° '+datos.venta_id, W-mx, 11, {align:'right'});
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.text('Fecha: '+datos.fecha_inicio, W-mx, 17, {align:'right'});

  y = 36;

  // ── Título ──
  doc.setTextColor(oscuro[0],oscuro[1],oscuro[2]);
  doc.setFont('helvetica','bold');
  doc.setFontSize(13);
  doc.text('CONTRATO DE COMPRAVENTA A CRÉDITO', W/2, y, {align:'center'});
  y += 5;
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.setTextColor(gris[0],gris[1],gris[2]);
  doc.text('(Persona Natural — Régimen Simplificado)', W/2, y, {align:'center'});
  y += 6;

  // Línea verde
  doc.setDrawColor(verde[0],verde[1],verde[2]);
  doc.setLineWidth(0.5);
  doc.line(mx, y, W-mx, y);
  y += 6;

  // ── Función helper texto con wrap ──
  function addSection(titulo, texto) {
    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    doc.setTextColor(oscuro[0],oscuro[1],oscuro[2]);
    doc.text(titulo, mx, y);
    y += 5;
    doc.setFont('helvetica','normal');
    doc.setFontSize(8.5);
    doc.setTextColor(negro[0],negro[1],negro[2]);
    var lines = doc.splitTextToSize(texto, cw);
    doc.text(lines, mx, y);
    y += lines.length * 4.5 + 5;
    checkPage();
  }

  function checkPage() {
    if (y > 240) { doc.addPage(); y = 20; }
  }

  // ── Comparecientes ──
  addSection('COMPARECIENTES',
    'Entre los suscritos, por una parte '+VENDEDOR.nombre+', identificado con C.C. N° '+VENDEDOR.cedula+
    ', domiciliado en '+VENDEDOR.direccion+', actuando como VENDEDOR, y por otra parte '+datos.cliente+
    ', identificado con C.C. N° '+datos.cedula_cliente+
    (datos.telefono?', con número de contacto '+datos.telefono:'')+
    ', quien en adelante se denominará el COMPRADOR, se ha celebrado el presente contrato de compraventa a crédito, '+
    'regido por las disposiciones del Código de Comercio colombiano (Decreto 410 de 1971) y las normas concordantes.'
  );

  addSection('PRIMERA — OBJETO DEL CONTRATO',
    'El VENDEDOR se compromete a transferir al COMPRADOR la propiedad del siguiente bien mueble: '+datos.equipo+
    '. El precio total de la operación es de '+fmt(datos.precio_financiado)+
    ' (incluido el cargo financiero correspondiente), con una cuota inicial de '+fmt(datos.inicial)+
    ' pagada al momento de la firma del presente contrato.'
  );

  addSection('SEGUNDA — FORMA DE PAGO',
    'El saldo restante de '+fmt(datos.precio_financiado-datos.inicial)+
    ' será cancelado en '+datos.cuotas+' cuotas mensuales iguales de '+fmt(datos.valor_cuota)+
    ' cada una, pagaderas el mismo día de cada mes a partir de la fecha de suscripción. '+
    'Los pagos deberán realizarse directamente en el establecimiento o mediante transferencia a los medios de pago indicados por el VENDEDOR.'
  );

  addSection('TERCERA — MORA E INCUMPLIMIENTO',
    'En caso de mora en el pago de cualquiera de las cuotas por más de cinco (5) días calendario, '+
    'el VENDEDOR podrá exigir el pago inmediato del saldo total pendiente, de conformidad con el artículo 69 '+
    'de la Ley 45 de 1990. Adicionalmente, se causarán intereses moratorios a la tasa máxima legal permitida '+
    'por la Superintendencia Financiera de Colombia.'
  );

  addSection('CUARTA — GARANTÍA Y RESERVA DE DOMINIO',
    'El bien objeto del presente contrato se entrega al COMPRADOR en calidad de préstamo de uso hasta tanto no se cancele '+
    'la totalidad del precio pactado. El VENDEDOR se reserva el dominio del bien de conformidad con los artículos 952 y '+
    'siguientes del Código de Comercio. El COMPRADOR no podrá enajenar, pignorar ni gravar el bien sin autorización expresa y escrita del VENDEDOR.'
  );

  // Obligaciones como lista
  doc.setFont('helvetica','bold');
  doc.setFontSize(9);
  doc.setTextColor(oscuro[0],oscuro[1],oscuro[2]);
  doc.text('QUINTA — OBLIGACIONES DEL COMPRADOR', mx, y);
  y += 5;
  var obligaciones = [
    'Pagar puntualmente las cuotas en las fechas acordadas.',
    'Conservar el bien en buen estado y no modificarlo sin autorización.',
    'Notificar al vendedor cualquier daño, pérdida o hurto del equipo.',
    'Permitir la inspección del bien cuando el vendedor lo requiera.',
    'No ceder ni transferir el presente contrato sin autorización previa.',
  ];
  doc.setFont('helvetica','normal');
  doc.setFontSize(8.5);
  doc.setTextColor(negro[0],negro[1],negro[2]);
  obligaciones.forEach(function(ob, i) {
    doc.text((i+1)+'. '+ob, mx+3, y);
    y += 5;
  });
  y += 4;
  checkPage();

  addSection('SEXTA — JURISDICCIÓN Y COMPETENCIA',
    'Para todos los efectos legales derivados del presente contrato, las partes se someten a la '+
    'jurisdicción de los jueces y tribunales de la ciudad de Cartagena, Bolívar, República de Colombia, '+
    'renunciando expresamente a cualquier otro fuero que pudiere corresponderles.'
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
  checkPage();
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
