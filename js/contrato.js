// ═══════════════════════════════════════════
//  contrato.js — Contrato de Financiamiento
//  CastellStore · Carlos Castro Elles
//  C.C. 1052740183 · Villanueva, Bolívar
// ═══════════════════════════════════════════

const VENDEDOR = {
  nombre   : 'Carlos Castro Elles',
  cedula   : '1052740183',
  direccion: 'Cra 18 N 10-53 Villanueva, Bolívar',
  telefono : '301 719 2825',
  negocio  : 'CastellStore',
};

let _contratoVentaId   = null;
let _contratoData      = null;
let _firmaCli          = false;
let _firmaVen          = false;
let _cedulaFrontFile   = null;
let _cedulaBackFile    = null;
let _firmaCliCanvas    = null;
let _firmaVenCanvas    = null;

// ── Abrir modal de contrato ───────────────
function abrirContrato(ventaId) {
  const v   = ventas.find(x => x.id === ventaId);
  if (!v) return;
  const eq  = equiposFin.find(e => e.marca + ' ' + e.modelo === v.producto);
  const ini = parseFloat(v.inicial_pagada) || 0;
  const fin = parseFloat(v.precio) || 0;
  const cuotasN = parseInt(v.cuotas) || 0;
  const cuotaVal = cuotasN > 0 ? Math.round((fin - ini) / cuotasN) : 0;

  _contratoVentaId = ventaId;
  _contratoData = { v, eq, ini, fin, cuotasN, cuotaVal };
  _cedulaFrontFile = null;
  _cedulaBackFile  = null;

  // Limpiar previsualizaciones
  ['front','back'].forEach(function(s) {
    var p = document.getElementById('contrato-prev-' + s);
    if (p) { p.src = ''; p.style.display = 'none'; }
  });
  var cedEl = document.getElementById('contrato-cedula');
  if (cedEl) cedEl.value = v.cedula_cliente || '';

  // Resumen del contrato
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

// ── Iniciar canvas de firmas ──────────────
function iniciarFirmas() {
  iniciarFirmaCanvas('firma-cliente-canvas', 'cliente');
  iniciarFirmaCanvas('firma-vendedor-canvas', 'vendedor');
}

function iniciarFirmaCanvas(canvasId, tipo) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx    = canvas.getContext('2d');
  var drawing = false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = tipo === 'cliente' ? 'rgba(57,255,20,0.03)' : 'rgba(91,163,201,0.03)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Texto guía
  ctx.fillStyle = 'rgba(150,170,180,0.3)';
  ctx.font      = '14px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Firme aquí', canvas.width/2, canvas.height/2);
  ctx.textAlign = 'left';

  function getPos(e) {
    var rect  = canvas.getBoundingClientRect();
    var scaleX = canvas.width  / rect.width;
    var scaleY = canvas.height / rect.height;
    var cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    var cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x: cx * scaleX, y: cy * scaleY };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    // Limpiar texto guía al primer trazo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = tipo === 'cliente' ? 'rgba(57,255,20,0.03)' : 'rgba(91,163,201,0.03)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    if (tipo === 'cliente') _firmaCli = true; else _firmaVen = true;
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing) return;
    var p = getPos(e);
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.strokeStyle = tipo === 'cliente' ? '#39ff14' : '#5ba3c9';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function endDraw(e) { e.preventDefault(); drawing = false; ctx.beginPath(); }

  // Remover listeners anteriores clonando
  var newCanvas = canvas.cloneNode(true);
  canvas.parentNode.replaceChild(newCanvas, canvas);
  var nc = document.getElementById(canvasId);
  var nctx = nc.getContext('2d');

  nctx.clearRect(0, 0, nc.width, nc.height);
  nctx.fillStyle = tipo === 'cliente' ? 'rgba(57,255,20,0.03)' : 'rgba(91,163,201,0.03)';
  nctx.fillRect(0, 0, nc.width, nc.height);
  nctx.fillStyle = 'rgba(150,170,180,0.3)';
  nctx.font = '14px Outfit, sans-serif';
  nctx.textAlign = 'center';
  nctx.fillText('Firme aquí', nc.width/2, nc.height/2);
  nctx.textAlign = 'left';

  var drawingNew = false;

  nc.addEventListener('mousedown',  function(e){ drawingNew=true; nctx.clearRect(0,0,nc.width,nc.height); nctx.fillStyle=tipo==='cliente'?'rgba(57,255,20,0.03)':'rgba(91,163,201,0.03)'; nctx.fillRect(0,0,nc.width,nc.height); var p=getPosNew(e); nctx.beginPath(); nctx.moveTo(p.x,p.y); if(tipo==='cliente')_firmaCli=true;else _firmaVen=true; });
  nc.addEventListener('mousemove',  function(e){ if(!drawingNew)return; var p=getPosNew(e); nctx.lineWidth=2;nctx.lineCap='round';nctx.strokeStyle=tipo==='cliente'?'#39ff14':'#5ba3c9'; nctx.lineTo(p.x,p.y);nctx.stroke();nctx.beginPath();nctx.moveTo(p.x,p.y); });
  nc.addEventListener('mouseup',    function(){ drawingNew=false; nctx.beginPath(); });
  nc.addEventListener('touchstart', function(e){ e.preventDefault(); drawingNew=true; nctx.clearRect(0,0,nc.width,nc.height); nctx.fillStyle=tipo==='cliente'?'rgba(57,255,20,0.03)':'rgba(91,163,201,0.03)'; nctx.fillRect(0,0,nc.width,nc.height); var p=getPosNew(e); nctx.beginPath();nctx.moveTo(p.x,p.y); if(tipo==='cliente')_firmaCli=true;else _firmaVen=true; }, {passive:false});
  nc.addEventListener('touchmove',  function(e){ e.preventDefault(); if(!drawingNew)return; var p=getPosNew(e); nctx.lineWidth=2;nctx.lineCap='round';nctx.strokeStyle=tipo==='cliente'?'#39ff14':'#5ba3c9'; nctx.lineTo(p.x,p.y);nctx.stroke();nctx.beginPath();nctx.moveTo(p.x,p.y); }, {passive:false});
  nc.addEventListener('touchend',   function(e){ e.preventDefault(); drawingNew=false; nctx.beginPath(); }, {passive:false});

  function getPosNew(e) {
    var rect=nc.getBoundingClientRect();
    var scaleX=nc.width/rect.width, scaleY=nc.height/rect.height;
    var cx=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;
    var cy=(e.touches?e.touches[0].clientY:e.clientY)-rect.top;
    return {x:cx*scaleX, y:cy*scaleY};
  }
}

function limpiarFirma(tipo) {
  var canvasId = tipo === 'cliente' ? 'firma-cliente-canvas' : 'firma-vendedor-canvas';
  if (tipo === 'cliente') _firmaCli = false; else _firmaVen = false;
  iniciarFirmaCanvas(canvasId, tipo);
}

// ── Previsualizar cédula ──────────────────
function prevContratoCedula(input, lado) {
  var file = input.files[0];
  if (!file) return;
  if (lado === 'front') _cedulaFrontFile = file;
  else _cedulaBackFile = file;
  var reader = new FileReader();
  reader.onload = function(e) {
    var prev = document.getElementById('contrato-prev-' + lado);
    if (prev) { prev.src = e.target.result; prev.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

// ── Subir archivo a Storage ───────────────
async function subirArchivoContrato(file, nombre) {
  var res = await fetch(SUPA + '/storage/v1/object/contratos-docs/' + nombre, {
    method : 'POST',
    headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': file.type, 'x-upsert': 'true' },
    body   : file,
  });
  if (!res.ok) throw new Error('Error subiendo archivo');
  return SUPA + '/storage/v1/object/public/contratos-docs/' + nombre;
}

// ── Generar contrato PDF ──────────────────
async function generarContrato() {
  if (!_contratoData) return;
  var cedula = document.getElementById('contrato-cedula')?.value.trim();
  if (!cedula) { toast('Ingresa el número de cédula del cliente', 'err'); return; }
  if (!_firmaCli) { toast('El cliente debe firmar el contrato', 'err'); return; }
  if (!_firmaVen) { toast('El vendedor debe firmar el contrato', 'err'); return; }

  setBtn('btn-contrato', true, 'Generando...');

  try {
    var { v, eq, ini, fin, cuotasN, cuotaVal } = _contratoData;
    var ts = Date.now();

    // Capturar firmas como imágenes
    var firmaCliImg = document.getElementById('firma-cliente-canvas')?.toDataURL('image/png');
    var firmaVenImg = document.getElementById('firma-vendedor-canvas')?.toDataURL('image/png');

    // Subir cédulas si las hay
    var urlFront = '', urlBack = '';
    if (_cedulaFrontFile) urlFront = await subirArchivoContrato(_cedulaFrontFile, 'cedula_front_' + v.id + '_' + ts + '.' + _cedulaFrontFile.name.split('.').pop());
    if (_cedulaBackFile)  urlBack  = await subirArchivoContrato(_cedulaBackFile,  'cedula_back_'  + v.id + '_' + ts + '.' + _cedulaBackFile.name.split('.').pop());

    // Guardar en BD
    var payload = {
      venta_id          : v.id,
      cliente           : v.cliente,
      cedula_cliente    : cedula,
      telefono          : v.telefono_cliente || '',
      equipo            : v.producto,
      precio_contado    : eq ? eq.precio_contado : fin,
      precio_financiado : fin,
      inicial           : ini,
      cuotas            : cuotasN,
      valor_cuota       : cuotaVal,
      fecha_inicio      : today(),
      firma_cliente     : firmaCliImg,
      firma_vendedor    : firmaVenImg,
      foto_cedula_front : urlFront,
      foto_cedula_back  : urlBack,
      estado            : 'firmado',
    };
    await sb('contratos', 'POST', payload);

    // Generar PDF visual
    await dibujarContrato(payload, firmaCliImg, firmaVenImg, urlFront, urlBack);

    toast('Contrato generado y guardado ✓');
    closeModal('modal-contrato');

  } catch (e) {
    toast('Error: ' + e.message, 'err');
  }
  setBtn('btn-contrato', false, '📄 Generar contrato');
}

// ── Dibujar contrato en Canvas → PNG ─────
async function dibujarContrato(datos, firmaCliImg, firmaVenImg, urlFront, urlBack) {
  var W = 816, H = 1056; // Tamaño carta en píxeles a 96dpi
  var canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  var ctx = canvas.getContext('2d');

  // Fondo blanco (estilo documento)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Márgenes
  var mx = 55;

  // ── Encabezado ──
  // Franja superior
  var grad = ctx.createLinearGradient(0,0,W,0);
  grad.addColorStop(0,'#101f2b'); grad.addColorStop(1,'#1a3347');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, 100);

  // Logo
  var logo = new Image(); logo.src = LOGO_B64;
  await new Promise(function(r){logo.onload=r;logo.onerror=r;});
  ctx.drawImage(logo, mx, 10, 80, 80);

  ctx.fillStyle = '#a4d65e';
  ctx.font = 'bold 20px Outfit, sans-serif';
  ctx.fillText(VENDEDOR.negocio, mx + 90, 42);
  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '13px Outfit, sans-serif';
  ctx.fillText(VENDEDOR.direccion, mx + 90, 64);
  ctx.fillText('Tel: ' + VENDEDOR.telefono + '  |  C.C. ' + VENDEDOR.cedula, mx + 90, 82);

  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 13px Outfit, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Contrato N° ' + datos.venta_id, W - mx, 42);
  ctx.fillStyle = '#8a9aa1';
  ctx.font      = '12px Outfit, sans-serif';
  ctx.fillText('Fecha: ' + datos.fecha_inicio, W - mx, 62);
  ctx.textAlign = 'left';

  var y = 120;

  // ── Título ──
  ctx.fillStyle = '#101f2b';
  ctx.font = 'bold 16px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CONTRATO DE COMPRAVENTA A CRÉDITO', W/2, y);
  ctx.font = '12px Outfit, sans-serif';
  ctx.fillStyle = '#555';
  ctx.fillText('(Persona Natural — Régimen Simplificado)', W/2, y + 22);
  ctx.textAlign = 'left';
  y += 50;

  // Línea
  ctx.strokeStyle = '#a4d65e'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(mx, y); ctx.lineTo(W - mx, y); ctx.stroke();
  y += 20;

  // ── Comparecientes ──
  ctx.fillStyle = '#101f2b';
  ctx.font      = 'bold 14px Outfit, sans-serif';
  ctx.fillText('COMPARECIENTES', mx, y);
  y += 20;

  var parrafo1 = 'Entre los suscritos, por una parte ' + VENDEDOR.nombre + ', identificado con C.C. N° ' +
    VENDEDOR.cedula + ', domiciliado en ' + VENDEDOR.direccion + ', actuando como VENDEDOR, y por otra parte ' +
    datos.cliente + ', identificado con C.C. N° ' + datos.cedula_cliente +
    (datos.telefono ? ', con número de contacto ' + datos.telefono : '') +
    ', quien en adelante se denominará el COMPRADOR, se ha celebrado el presente contrato de compraventa a crédito, ' +
    'regido por las disposiciones del Código de Comercio colombiano (Decreto 410 de 1971) y las normas concordantes.';

  y = wrapText(ctx, parrafo1, mx, y, W - mx*2, 20, '#333', '13px Outfit, sans-serif');
  y += 20;

  // ── Objeto del contrato ──
  ctx.fillStyle = '#101f2b';
  ctx.font      = 'bold 14px Outfit, sans-serif';
  ctx.fillText('PRIMERA — OBJETO DEL CONTRATO', mx, y);
  y += 20;

  var parrafo2 = 'El VENDEDOR se compromete a transferir al COMPRADOR la propiedad del siguiente bien mueble: ' +
    datos.equipo + (datos.cedula_cliente ? ' (equipo identificado en la presente operación)' : '') +
    '. El precio total de la operación es de ' + fmt(datos.precio_financiado) +
    ' (incluido el cargo financiero correspondiente), con una cuota inicial de ' + fmt(datos.inicial) +
    ' pagada al momento de la firma del presente contrato.';

  y = wrapText(ctx, parrafo2, mx, y, W - mx*2, 20, '#333', '13px Outfit, sans-serif');
  y += 20;

  // ── Forma de pago ──
  ctx.fillStyle = '#101f2b';
  ctx.font      = 'bold 14px Outfit, sans-serif';
  ctx.fillText('SEGUNDA — FORMA DE PAGO', mx, y);
  y += 20;

  var parrafo3 = 'El saldo restante de ' + fmt(datos.precio_financiado - datos.inicial) +
    ' será cancelado en ' + datos.cuotas + ' cuotas mensuales iguales de ' + fmt(datos.valor_cuota) +
    ' cada una, pagaderas el mismo día de cada mes a partir de la fecha de suscripción. ' +
    'Los pagos deberán realizarse directamente en el establecimiento o mediante transferencia a los medios de pago indicados por el VENDEDOR.';

  y = wrapText(ctx, parrafo3, mx, y, W - mx*2, 20, '#333', '13px Outfit, sans-serif');
  y += 20;

  // ── Mora ──
  ctx.fillStyle = '#101f2b';
  ctx.font      = 'bold 14px Outfit, sans-serif';
  ctx.fillText('TERCERA — MORA E INCUMPLIMIENTO', mx, y);
  y += 20;

  var parrafo4 = 'En caso de mora en el pago de cualquiera de las cuotas por más de cinco (5) días calendario, ' +
    'el VENDEDOR podrá exigir el pago inmediato del saldo total pendiente, de conformidad con el artículo 69 ' +
    'de la Ley 45 de 1990. Adicionalmente, se causarán intereses moratorios a la tasa máxima legal permitida ' +
    'por la Superintendencia Financiera de Colombia.';

  y = wrapText(ctx, parrafo4, mx, y, W - mx*2, 20, '#333', '13px Outfit, sans-serif');
  y += 20;

  // ── Garantía ──
  ctx.fillStyle = '#101f2b';
  ctx.font      = 'bold 14px Outfit, sans-serif';
  ctx.fillText('CUARTA — GARANTÍA Y RESERVA DE DOMINIO', mx, y);
  y += 20;

  var parrafo5 = 'El bien objeto del presente contrato se entrega al COMPRADOR en calidad de préstamo de uso ' +
    'hasta tanto no se cancele la totalidad del precio pactado. El VENDEDOR se reserva el dominio del bien ' +
    'de conformidad con los artículos 952 y siguientes del Código de Comercio. El COMPRADOR no podrá enajenar, ' +
    'pignorar ni gravar el bien sin autorización expresa y escrita del VENDEDOR.';

  y = wrapText(ctx, parrafo5, mx, y, W - mx*2, 20, '#333', '13px Outfit, sans-serif');
  y += 20;

  // ── Obligaciones comprador ──
  ctx.fillStyle = '#101f2b';
  ctx.font      = 'bold 14px Outfit, sans-serif';
  ctx.fillText('QUINTA — OBLIGACIONES DEL COMPRADOR', mx, y);
  y += 20;

  var obligaciones = [
    'Pagar puntualmente las cuotas en las fechas acordadas.',
    'Conservar el bien en buen estado y no modificarlo sin autorización.',
    'Notificar al vendedor cualquier daño, pérdida o hurto del equipo.',
    'Permitir la inspección del bien cuando el vendedor lo requiera.',
    'No ceder ni transferir el presente contrato sin autorización previa.',
  ];

  obligaciones.forEach(function(ob, i) {
    ctx.fillStyle = '#333';
    ctx.font      = '13px Outfit, sans-serif';
    ctx.fillText((i+1) + '. ' + ob, mx + 10, y);
    y += 22;
  });
  y += 10;

  // ── Jurisdicción ──
  ctx.fillStyle = '#101f2b';
  ctx.font      = 'bold 14px Outfit, sans-serif';
  ctx.fillText('SEXTA — JURISDICCIÓN Y COMPETENCIA', mx, y);
  y += 20;

  var parrafo6 = 'Para todos los efectos legales derivados del presente contrato, las partes se someten a la ' +
    'jurisdicción de los jueces y tribunales de la ciudad de Cartagena, Bolívar, República de Colombia, ' +
    'renunciando expresamente a cualquier otro fuero que pudiere corresponderles.';

  y = wrapText(ctx, parrafo6, mx, y, W - mx*2, 20, '#333', '13px Outfit, sans-serif');
  y += 30;

  // ── Fotos cédula ──
  if (urlFront || urlBack) {
    ctx.fillStyle = '#101f2b';
    ctx.font      = 'bold 14px Outfit, sans-serif';
    ctx.fillText('DOCUMENTOS DE IDENTIDAD', mx, y);
    y += 16;
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;

    var loadImg = function(src) {
      return new Promise(function(resolve) {
        if (!src) { resolve(null); return; }
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload  = function() { resolve(img); };
        img.onerror = function() { resolve(null); };
        img.src = src;
      });
    };

    var imgFront = await loadImg(urlFront);
    var imgBack  = await loadImg(urlBack);
    var cW = (W - mx*2 - 20) / 2;
    var cH = 160;

    if (imgFront) {
      ctx.drawImage(imgFront, mx, y, cW, cH);
      ctx.strokeRect(mx, y, cW, cH);
      ctx.fillStyle='#888'; ctx.font='11px Outfit,sans-serif';
      ctx.fillText('Cédula frontal', mx, y + cH + 14);
    }
    if (imgBack) {
      ctx.drawImage(imgBack, mx + cW + 20, y, cW, cH);
      ctx.strokeRect(mx + cW + 20, y, cW, cH);
      ctx.fillStyle='#888'; ctx.font='11px Outfit,sans-serif';
      ctx.fillText('Cédula posterior', mx + cW + 20, y + cH + 14);
    }
    y += cH + 30;
  }

  // ── Firmas ──
  ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(mx, y); ctx.lineTo(W-mx, y); ctx.stroke();
  y += 20;

  ctx.fillStyle = '#101f2b';
  ctx.font      = 'bold 14px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FIRMAS DE LAS PARTES', W/2, y);
  ctx.textAlign = 'left';
  y += 20;

  var fw = (W - mx*2 - 40) / 2;
  var fh = 120;

  // Firma cliente
  ctx.fillStyle = '#f9fffe';
  ctx.strokeStyle = '#a4d65e'; ctx.lineWidth = 1;
  roundRectContrato(ctx, mx, y, fw, fh, 8); ctx.fill(); ctx.stroke();

  if (firmaCliImg) {
    var fci = new Image(); fci.src = firmaCliImg;
    await new Promise(function(r){fci.onload=r;fci.onerror=r;});
    ctx.drawImage(fci, mx+5, y+5, fw-10, fh-10);
  }

  ctx.fillStyle = '#333'; ctx.font = '11px Outfit, sans-serif';
  ctx.fillText('COMPRADOR: ' + datos.cliente, mx, y + fh + 16);
  ctx.fillText('C.C. ' + datos.cedula_cliente, mx, y + fh + 30);

  // Firma vendedor
  var vx = mx + fw + 40;
  ctx.fillStyle = '#f9f9ff';
  ctx.strokeStyle = '#5ba3c9'; ctx.lineWidth = 1;
  roundRectContrato(ctx, vx, y, fw, fh, 8); ctx.fill(); ctx.stroke();

  if (firmaVenImg) {
    var fvi = new Image(); fvi.src = firmaVenImg;
    await new Promise(function(r){fvi.onload=r;fvi.onerror=r;});
    ctx.drawImage(fvi, vx+5, y+5, fw-10, fh-10);
  }

  ctx.fillStyle = '#333'; ctx.font = '11px Outfit, sans-serif';
  ctx.fillText('VENDEDOR: ' + VENDEDOR.nombre, vx, y + fh + 16);
  ctx.fillText('C.C. ' + VENDEDOR.cedula, vx, y + fh + 30);

  y += fh + 60;

  // Pie de página
  ctx.fillStyle = '#888'; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Contrato generado digitalmente por ' + VENDEDOR.negocio + ' · ' + datos.fecha_inicio, W/2, y);
  ctx.fillText('Este documento tiene validez legal conforme al artículo 11 de la Ley 527 de 1999 (Comercio Electrónico)', W/2, y+16);
  ctx.textAlign = 'left';

  // Franja inferior
  var gb = ctx.createLinearGradient(0, H-8, W, H-8);
  gb.addColorStop(0,'#a4d65e'); gb.addColorStop(1,'#5ba3c9');
  ctx.fillStyle = gb; ctx.fillRect(0, H-8, W, 8);

  // Descargar y mostrar
  var dataURL = canvas.toDataURL('image/png');
  var nombre  = 'contrato-' + datos.cliente.replace(/\s+/g,'-') + '-' + datos.venta_id + '.png';

  var link = document.createElement('a');
  link.href = dataURL; link.download = nombre; link.click();

  var msg = encodeURIComponent(
    '📄 *CONTRATO DE FINANCIAMIENTO — ' + VENDEDOR.negocio + '*\n\n' +
    'Estimado/a *' + datos.cliente + '*,\n' +
    'Adjunto encontrará su contrato de compraventa a crédito del equipo *' + datos.equipo + '*.\n\n' +
    '💰 Valor financiado: *' + fmt(datos.precio_financiado) + '*\n' +
    '📅 Cuotas: *' + datos.cuotas + ' x ' + fmt(datos.valor_cuota) + '/mes*\n\n' +
    'Guarde este documento como soporte de su compra.\n' +
    '📞 ' + VENDEDOR.telefono + ' | ' + VENDEDOR.negocio
  );

  var m = document.getElementById('modal-contrato-preview');
  if (!m) { m=document.createElement('div'); m.id='modal-contrato-preview'; m.className='overlay'; document.body.appendChild(m); }
  m.innerHTML = '<div class="modal" style="max-width:680px">' +
    '<div class="modal-header"><div class="modal-title">📄 Contrato — ' + datos.cliente + '</div>' +
    '<button class="close-btn" onclick="document.getElementById(\'modal-contrato-preview\').classList.remove(\'open\')">×</button></div>' +
    '<img src="' + dataURL + '" style="width:100%;border-radius:var(--radius);border:1px solid var(--border);margin-bottom:14px">' +
    '<div class="modal-footer">' +
    '<button class="btn" onclick="document.getElementById(\'modal-contrato-preview\').classList.remove(\'open\')">Cerrar</button>' +
    '<a href="' + dataURL + '" download="' + nombre + '"><button class="btn">⬇️ Descargar</button></a>' +
    '<a href="https://wa.me/?text=' + msg + '" target="_blank"><button class="btn" style="background:#25D366;border-color:#25D366;color:#fff">💬 WhatsApp</button></a>' +
    '</div></div>';
  m.classList.add('open');
}

// ── Helpers ───────────────────────────────
function wrapText(ctx, text, x, y, maxW, lineH, color, font) {
  ctx.fillStyle = color; ctx.font = font;
  var words = text.split(' ');
  var line  = '';
  words.forEach(function(word) {
    var test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line !== '') {
      ctx.fillText(line, x, y); y += lineH; line = word + ' ';
    } else { line = test; }
  });
  if (line) { ctx.fillText(line, x, y); y += lineH; }
  return y;
}

function roundRectContrato(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}
