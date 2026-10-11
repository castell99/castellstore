// ═══════════════════════════════════════════
//  auth.js — Autenticación y navegación
// ═══════════════════════════════════════════
function goAdmin() {
  if (haySesion()) { showAdminView(); return; }
  document.getElementById('login-overlay').style.display = 'flex';
}

async function doLogin() {
  const email = document.getElementById('l-user').value.trim();
  const pass  = document.getElementById('l-pass').value;
  const err   = document.getElementById('login-error');
  const btn   = document.getElementById('btn-login-submit');

  if (!email || !pass) { err.textContent = 'Completa correo y contraseña'; err.style.display = 'flex'; return; }

  if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }
  err.style.display = 'none';

  try {
    const r = await fetch(SUPA + '/auth/v1/token?grant_type=password', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': KEY },
      body   : JSON.stringify({ email: email, password: pass })
    });
    const data = await r.json();

    if (!r.ok || !data.access_token) {
      // Mensaje genérico a propósito: no revelamos si el correo existe.
      err.textContent = 'Correo o contraseña incorrectos';
      err.style.display = 'flex';
      document.getElementById('l-pass').value = '';
      return;
    }

    setSession(data);
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('l-pass').value = '';
    showAdminView();

  } catch (e) {
    err.textContent = 'Error de conexión, intenta de nuevo';
    err.style.display = 'flex';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Ingresar \u2192'; }
  }
}

async function logout() {
  const s = getSession();
  if (s) {
    // Invalida el refresh_token en el servidor, no solo en el navegador.
    try {
      await fetch(SUPA + '/auth/v1/logout', {
        method : 'POST',
        headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + s.access_token }
      });
    } catch (e) {}
  }
  detenerVigilanciaInactividad();
  clearSession();
  goPublic();
  toast('Sesión cerrada', 'inf');
}

// Si alguien fuerza la vista admin sin sesión, se le devuelve al
// catálogo. La defensa real está en RLS; esto solo evita ver una
// interfaz vacía y confusa.
function exigirSesion() {
  if (!haySesion()) { goPublic(); return false; }
  return true;
}

function showAdminView() {
  if (!exigirSesion()) return;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-admin').classList.add('active');
  document.getElementById('btn-adm').classList.add('active');
  var bp1 = document.getElementById('btn-pub'); if (bp1) bp1.classList.remove('active');
  document.getElementById('hamburger').style.display = 'flex';
  document.getElementById('btn-adm').style.display        = '';
  document.getElementById('btn-login').style.display      = 'none';
  document.getElementById('nav-agenda-btn').style.display = 'inline-block';

  // Cierre automatico por inactividad: solo corre mientras hay sesion.
  marcarActividad();
  iniciarVigilanciaInactividad();

  loadAll().then(() => {
    renderVentas();
    renderTecnicos();
    renderInventario();
    renderDashboard();
    loadAgenda();
  });
}

function goPublic() {
  var loginOverlay = document.getElementById('login-overlay');
  if (loginOverlay) loginOverlay.style.display = 'none';
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-public').classList.add('active');
  var bp2 = document.getElementById('btn-pub'); if (bp2) bp2.classList.add('active');
  document.getElementById('btn-adm').classList.remove('active');
  document.getElementById('hamburger').style.display = 'none';
  document.getElementById('btn-adm').style.display        = 'none';
  document.getElementById('btn-login').style.display      = '';
  document.getElementById('nav-agenda-btn').style.display = 'none';
  closeSidebar();
  if (typeof verInicio === 'function') verInicio();
  renderPublic();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
}

function showSec(s, el) {
  document.querySelectorAll('.section').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(x => x.classList.remove('active'));
  document.getElementById('sec-' + s).classList.add('active');
  if (el) el.classList.add('active');
  closeSidebar();
  if (s === 'ventas')     renderVentas();
  if (s === 'tecnicos')   renderTecnicos();
  if (s === 'inventario') renderInventario();
  if (s === 'dashboard')  renderDashboard();
}

// ── Cierre de sesión por inactividad ──────
// La sesion se renovaba sola mientras la pestaña siguiera abierta.
// Esto la corta si nadie toca nada en un rato.
var INACTIVIDAD_MIN = 15;   // minutos sin actividad antes de cerrar
var AVISO_SEG       = 60;   // aviso previo, en segundos

var _ultimaActividad = Date.now();
var _inactTimer      = null;
var _avisoMostrado   = false;

function marcarActividad() {
  _ultimaActividad = Date.now();
  if (_avisoMostrado) {
    _avisoMostrado = false;
    var a = document.getElementById('aviso-inactividad');
    if (a) a.remove();
  }
}

function iniciarVigilanciaInactividad() {
  if (_inactTimer) return;
  // mousemove queda fuera a proposito: un roce del raton no deberia
  // mantener la sesion viva.
  ['click','keydown','touchstart','scroll'].forEach(function(ev) {
    document.addEventListener(ev, marcarActividad, { passive: true });
  });
  // Se compara contra el reloj, no se cuenta: un temporizador se
  // ralentiza cuando la pestaña pasa a segundo plano.
  _inactTimer = setInterval(revisarInactividad, 5000);
}

function detenerVigilanciaInactividad() {
  if (_inactTimer) { clearInterval(_inactTimer); _inactTimer = null; }
  var a = document.getElementById('aviso-inactividad');
  if (a) a.remove();
  _avisoMostrado = false;
}

function revisarInactividad() {
  if (!haySesion()) return;
  var restante = INACTIVIDAD_MIN * 60 - (Date.now() - _ultimaActividad) / 1000;
  if (restante <= 0) { cerrarPorInactividad(); return; }
  if (restante <= AVISO_SEG) {
    if (!_avisoMostrado) mostrarAvisoInactividad();
    var s = document.getElementById('aviso-inact-seg');
    if (s) s.textContent = Math.ceil(restante);
  }
}

function mostrarAvisoInactividad() {
  _avisoMostrado = true;
  var a = document.createElement('div');
  a.id = 'aviso-inactividad';
  a.style.cssText = 'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:3000;' +
    'background:var(--bg3,#152535);border:1px solid var(--amber,#e6aa3c);color:var(--amber,#e6aa3c);' +
    'border-radius:10px;padding:12px 18px;font-size:13px;display:flex;align-items:center;gap:14px;' +
    'box-shadow:0 6px 24px rgba(0,0,0,.45)';
  a.innerHTML = '<span>Tu sesión se cerrará en <strong id="aviso-inact-seg">' + AVISO_SEG +
                '</strong> s por inactividad.</span>' +
                '<button class="btn sm" onclick="marcarActividad()">Sigo aquí</button>';
  document.body.appendChild(a);
}

function cerrarPorInactividad() {
  var s = getSession();
  detenerVigilanciaInactividad();
  clearSession();
  // Se invalida tambien del lado del servidor, no solo en el navegador.
  if (s) {
    try {
      fetch(SUPA + '/auth/v1/logout', {
        method : 'POST',
        headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + s.access_token }
      });
    } catch (e) {}
  }
  goPublic();
  toast('Sesión cerrada por inactividad', 'inf');
}  
