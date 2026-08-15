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
  document.getElementById('btn-pub').classList.remove('active');
  document.getElementById('hamburger').style.display = 'flex';
  document.getElementById('btn-adm').style.display        = '';
  document.getElementById('btn-login').style.display      = 'none';
  document.getElementById('nav-agenda-btn').style.display = 'inline-block';
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
  document.getElementById('btn-pub').classList.add('active');
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
