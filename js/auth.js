// ═══════════════════════════════════════════
//  auth.js — Autenticación y navegación
// ═══════════════════════════════════════════

function goAdmin() {
  if (isAdmin) { showAdminView(); return; }
  document.getElementById('login-overlay').style.display = 'flex';
}

function doLogin() {
  const u = document.getElementById('l-user').value.trim();
  const p = document.getElementById('l-pass').value;
  const err = document.getElementById('login-error');
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    isAdmin = true;
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('l-pass').value = '';
    err.style.display = 'none';
    showAdminView();
  } else {
    err.style.display = 'flex';
    document.getElementById('l-pass').value = '';
  }
}

function logout() {
  isAdmin = false;
  goPublic();
  toast('Sesión cerrada', 'inf');
}

function showAdminView() {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-admin').classList.add('active');
  document.getElementById('btn-adm').classList.add('active');
  document.getElementById('btn-pub').classList.remove('active');
  document.getElementById('hamburger').style.display = 'flex';

  // Mostrar botones de admin, ocultar botón de ingresar
  document.getElementById('btn-adm').style.display       = '';
  document.getElementById('btn-login').style.display     = 'none';
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
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-public').classList.add('active');
  document.getElementById('btn-pub').classList.add('active');
  document.getElementById('btn-adm').classList.remove('active');
  document.getElementById('hamburger').style.display = 'none';

  // Ocultar botones admin, mostrar botón ingresar
  document.getElementById('btn-adm').style.display        = 'none';
  document.getElementById('btn-login').style.display      = '';
  document.getElementById('nav-agenda-btn').style.display = 'none';

  closeSidebar();
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
  if (s === 'ventas')        renderVentas();
  if (s === 'tecnicos')      renderTecnicos();
  if (s === 'inventario')    renderInventario();
  if (s === 'dashboard')     renderDashboard();
}
