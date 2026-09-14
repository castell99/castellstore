// ═══════════════════════════════════════════
//  escaner.js — Lectura de codigos de barras
//  Usa BarcodeDetector, nativo del navegador.
//  Funciona en Chrome Android sobre HTTPS.
//  En iPhone no existe: ahi se avisa y se teclea.
// ═══════════════════════════════════════════

// El ultimo digito del IMEI se calcula de los otros catorce
// (algoritmo de Luhn). Permite detectar un numero mal leido
// o mal tecleado antes de que llegue al contrato.
function imeiValido(s) {
  s = String(s || '').replace(/\D/g, '');
  if (s.length !== 15) return false;
  var suma = 0;
  for (var i = 0; i < 15; i++) {
    var d = parseInt(s[i], 10);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    suma += d;
  }
  return suma % 10 === 0;
}

// Muestra el resultado bajo el campo. Sin mensaje si esta vacio.
function validarIMEI(campoId) {
  var el  = document.getElementById(campoId);
  var msg = document.getElementById(campoId + '-msg');
  if (!el || !msg) return;
  var v = el.value.trim();

  if (!v) { msg.textContent = ''; el.style.borderColor = ''; return; }

  if (!imeiValido(v)) {
    msg.textContent = 'IMEI inválido — revisa el número';
    msg.style.color = 'var(--red)';
    el.style.borderColor = 'var(--red)';
    return;
  }

  // En un equipo dual SIM los dos IMEI son siempre distintos.
  // Si coinciden es que se leyo dos veces el mismo codigo.
  var otro = document.getElementById(campoId === 'v-imei' ? 'v-imei2' : 'v-imei');
  if (otro && otro.value.trim() === v) {
    msg.textContent = 'Los dos IMEI son iguales';
    msg.style.color = 'var(--amber)';
    el.style.borderColor = 'var(--amber)';
    return;
  }

  msg.textContent = '✓ IMEI válido';
  msg.style.color = 'var(--green)';
  el.style.borderColor = 'var(--green-bd)';
}

var _escStream = null;

async function escanearCodigo(campoId) {
  if (!('BarcodeDetector' in window)) {
    toast('Tu navegador no permite escanear. Escribe el número a mano.', 'inf');
    return;
  }

  var m = document.getElementById('modal-escaner');
  if (!m) { m = document.createElement('div'); m.id = 'modal-escaner'; m.className = 'overlay'; document.body.appendChild(m); }
  m.innerHTML =
    '<div class="modal" style="max-width:420px">' +
    '<div class="modal-header"><div class="modal-title">📷 Escanear código</div>' +
    '<button class="close-btn" onclick="cerrarEscaner()">×</button></div>' +
    '<div style="background:#000;border-radius:var(--radius);overflow:hidden">' +
    '<video id="esc-video" playsinline style="width:100%;display:block;max-height:60vh"></video></div>' +
    '<div style="font-size:12px;color:var(--text3);margin-top:10px;text-align:center">' +
    'Apunta al código de barras de la caja o bajo la bandeja SIM.</div>' +
    '<div class="modal-footer"><button class="btn" onclick="cerrarEscaner()">Cancelar</button></div>' +
    '</div>';
  openModal('modal-escaner');

  var video = document.getElementById('esc-video');
  try {
    // facingMode environment = camara trasera, la que enfoca de cerca.
    _escStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } }
    });
    video.srcObject = _escStream;
    await video.play();
  } catch(e) {
    toast('No se pudo abrir la cámara', 'err');
    cerrarEscaner();
    return;
  }

  var det = new BarcodeDetector({
    formats: ['code_128', 'code_39', 'ean_13', 'itf', 'codabar', 'qr_code']
  });

  (function buscar(){
    if (!_escStream) return;
    det.detect(video).then(function(cods){
      if (cods && cods.length) {
        var valor = String(cods[0].rawValue || '').trim();
        // Los IMEI son solo digitos; el serial puede traer letras.
        if (campoId !== 'v-serie') valor = valor.replace(/\D/g, '');
        var el = document.getElementById(campoId);
        if (el) {
          el.value = valor;
          if (campoId !== 'v-serie') validarIMEI(campoId);
        }
        cerrarEscaner();
        toast('Código leído ✓');
        return;
      }
      requestAnimationFrame(buscar);
    }).catch(function(){ requestAnimationFrame(buscar); });
  })();
}

function cerrarEscaner() {
  if (_escStream) {
    _escStream.getTracks().forEach(function(t){ t.stop(); });
    _escStream = null;
  }
  closeModal('modal-escaner');
}
