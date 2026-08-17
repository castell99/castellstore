// ═══════════════════════════════════════════
//  config.js — Configuración global
//  Aquí van las claves de Supabase y variables
//  compartidas entre todos los módulos
// ═══════════════════════════════════════════

const SUPA = 'https://inlejbenzupcgpkuiqzj.supabase.co';
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlubGVqYmVuenVwY2dwa3VpcXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzE1ODYsImV4cCI6MjA5MjQ0NzU4Nn0.PAovGQ51-cVmOsxcb9fG26kYTArzjQVbS0718-krHuQ';
// HDR se conserva por compatibilidad. Ya no lleva Authorization:
// esa cabecera la arma authHeaders() solo cuando hay sesion.
const HDR  = {
  'Content-Type' : 'application/json',
  'apikey'       : KEY,
  'Prefer'       : 'return=representation'
};

// ── Sesión (Supabase Auth) ────────────────────
// Ya no hay credenciales en el código. El acceso lo concede
// Supabase Auth y lo hace cumplir RLS del lado del servidor.
// La sesión vive en sessionStorage: muere al cerrar la pestaña.

const SESS_KEY = 'cs_session';

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESS_KEY)) || null; }
  catch (e) { return null; }
}

function setSession(s) {
  if (!s || !s.access_token) return;
  s.expires_at = s.expires_at || (Math.floor(Date.now() / 1000) + (s.expires_in || 3600));
  sessionStorage.setItem(SESS_KEY, JSON.stringify(s));
}

function clearSession() { sessionStorage.removeItem(SESS_KEY); }

function haySesion() { return !!getSession(); }

// Token del usuario, o null si no hay sesion iniciada.
function authToken() {
  const s = getSession();
  return (s && s.access_token) ? s.access_token : null;
}

// Cabeceras base de toda peticion.
// La apikey siempre viaja. El Authorization SOLO si hay sesion:
// las claves nuevas (sb_publishable_...) no se pueden enviar como
// Bearer, devuelven 401. Asi el codigo sirve con clave legacy y con
// clave nueva sin tocar nada mas.
function authHeaders(extra) {
  const h = Object.assign({ 'apikey': KEY }, extra || {});
  const t = authToken();
  if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
}

// Cabeceras para subidas a Storage.
function uploadHeaders(contentType) {
  return authHeaders({ 'Content-Type': contentType, 'x-upsert': 'true' });
}

// ── URLs firmadas (buckets privados) ─────────
// Los buckets servicios-fotos y contratos-docs son privados: sus
// archivos solo se pueden ver con una URL temporal firmada.
// La base guarda URLs completas (formato viejo) o rutas
// "bucket/archivo" (formato nuevo); esto acepta ambas.

const _firmaCache = {};

function rutaObjeto(u) {
  if (!u) return null;
  const m = String(u).match(/\/storage\/v1\/object\/(?:public\/|sign\/)?(.+?)(?:\?|$)/);
  return m ? decodeURIComponent(m[1]) : String(u).replace(/^\/+/, '');
}

// Firma varias rutas de un mismo bucket en una sola peticion.
// segundos: vigencia de la URL (1 hora por defecto).
async function firmarUrls(urls, segundos) {
  segundos = segundos || 3600;
  const res = {};
  const porBucket = {};

  for (const u of urls) {
    const ruta = rutaObjeto(u);
    if (!ruta) continue;
    if (_firmaCache[ruta] && _firmaCache[ruta].exp > Date.now()) {
      res[u] = _firmaCache[ruta].url;
      continue;
    }
    const i = ruta.indexOf('/');
    if (i < 0) continue;
    const bucket = ruta.slice(0, i), archivo = ruta.slice(i + 1);
    (porBucket[bucket] = porBucket[bucket] || []).push({ archivo, orig: u });
  }

  for (const bucket in porBucket) {
    const items = porBucket[bucket];
    try {
      if (haySesion()) await refreshSession();
      const r = await fetch(SUPA + '/storage/v1/object/sign/' + bucket, {
        method : 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body   : JSON.stringify({ expiresIn: segundos, paths: items.map(x => x.archivo) })
      });
      if (!r.ok) continue;
      const data = await r.json();
      (Array.isArray(data) ? data : []).forEach((d, n) => {
        if (!d || !d.signedURL) return;
        const full = SUPA + '/storage/v1' + d.signedURL;
        const it   = items[n];
        res[it.orig] = full;
        _firmaCache[bucket + '/' + it.archivo] = { url: full, exp: Date.now() + (segundos - 60) * 1000 };
      });
    } catch (e) { /* si falla, la imagen queda sin cargar */ }
  }
  return res;
}

async function firmarUrl(u, segundos) {
  const m = await firmarUrls([u], segundos);
  return m[u] || null;
}

// Borra un archivo del bucket. Sin esto, eliminar el registro deja
// el archivo huerfano y accesible con cualquier URL ya firmada.
async function borrarObjeto(u) {
  const ruta = rutaObjeto(u);
  if (!ruta) return false;
  try {
    if (haySesion()) await refreshSession();
    const r = await fetch(SUPA + '/storage/v1/object/' + ruta, {
      method : 'DELETE',
      headers: authHeaders()
    });
    delete _firmaCache[ruta];
    return r.ok;
  } catch (e) { return false; }
}

// Renueva el access_token si le quedan menos de 60 segundos.
async function refreshSession() {
  const s = getSession();
  if (!s || !s.refresh_token) return false;
  if (s.expires_at && s.expires_at - 60 > Math.floor(Date.now() / 1000)) return true;
  try {
    const r = await fetch(SUPA + '/auth/v1/token?grant_type=refresh_token', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': KEY },
      body   : JSON.stringify({ refresh_token: s.refresh_token })
    });
    if (!r.ok) { clearSession(); return false; }
    setSession(await r.json());
    return true;
  } catch (e) { return false; }
}

function sesionExpirada() {
  clearSession();
  toast('Tu sesión expiró, vuelve a entrar', 'err');
  if (typeof goPublic === 'function') goPublic();
}

// ── Estado global compartido ──────────────
let productos = [];
let ventas    = [];
let tecnicos  = [];
let abonos    = [];
// isAdmin quedó obsoleto: usa haySesion(). Se mantiene por
// compatibilidad con código viejo, pero no autoriza nada.
let pubFilter = '';
let varTemp   = [];
let editVentaId  = null;
let editTecId    = null;
let editProdId   = null;
let abonoVId     = null;
let abonoTId     = null;

// ── Helper de Supabase ────────────────────
async function sb(table, method = 'GET', body = null, qs = '') {
  if (haySesion()) await refreshSession();

  const url  = `${SUPA}/rest/v1/${table}${qs}`;
  const opts = {
    method,
    headers: authHeaders({
      'Content-Type': 'application/json',
      'Prefer'      : 'return=representation'
    })
  };
  if (body) opts.body = JSON.stringify(body);

  const r = await fetch(url, opts);

  // 401/403: el token no vale o RLS bloqueó la operación.
  if (r.status === 401 || r.status === 403) {
    if (haySesion()) sesionExpirada();
    throw new Error('Sin permisos para esta operación');
  }
  if (!r.ok) { const e = await r.text(); throw new Error(e); }

  const t = await r.text();
  return t ? JSON.parse(t) : [];
}

// ── Helpers UI ────────────────────────────
const fmt = n => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0
}).format(n || 0);

const today = () => new Date().toLocaleDateString('es-CO');

function toast(msg, type = 'ok') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const ic = { ok: '✓', err: '✕', inf: 'ℹ' };
  t.innerHTML = `<span>${ic[type] || 'ℹ'}</span> ${msg}`;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.style.opacity = '0', 3000);
  setTimeout(() => t.remove(), 3400);
}

function setBtn(id, loading, label = 'Guardar') {
  const b = document.getElementById(id);
  if (!b) return;
  b.disabled = loading;
  b.textContent = loading ? 'Guardando...' : label;
}

// Varios modales se crean solo al usarse, asi que pueden no existir
// todavia (o ya no existir). Se comprueba antes de tocarlos.
function openModal(id)  { var e = document.getElementById(id); if (e) e.classList.add('open'); }
function closeModal(id) { var e = document.getElementById(id); if (e) e.classList.remove('open'); }

// ── Carga de datos ────────────────────────
async function loadAll() {
  // Estas tablas son privadas: sin sesion, RLS las rechaza y solo
  // generariamos 401 en consola. Se sale en silencio.
  if (!haySesion()) {
    productos = []; ventas = []; tecnicos = []; abonos = [];
    return;
  }
  try {
    [productos, ventas, tecnicos, abonos] = await Promise.all([
      sb('productos', 'GET', null, '?order=id.desc'),
      sb('ventas',    'GET', null, '?order=id.desc'),
      sb('tecnicos',  'GET', null, '?order=id.desc'),
      sb('abonos',    'GET', null, '?order=id.desc'),
    ]);
    if (!Array.isArray(productos)) productos = [];
    if (!Array.isArray(ventas))    ventas    = [];
    if (!Array.isArray(tecnicos))  tecnicos  = [];
    if (!Array.isArray(abonos))    abonos    = [];
    // Cargar cuotas programadas
    if (typeof loadCuotas === 'function') await loadCuotas();
  } catch (e) {
    toast('Error cargando datos: ' + e.message, 'err');
    productos = []; ventas = []; tecnicos = []; abonos = [];
  }
}

// ── Cálculo de abonos ─────────────────────
function abonadoPor(tipo, id) {
  return abonos
    .filter(a => a.tipo === tipo && a.ref_id === id)
    .reduce((s, a) => s + parseFloat(a.monto || 0), 0);
}

function saldoPendiente(tipo, id, total) {
  return Math.max(0, parseFloat(total || 0) - abonadoPor(tipo, id));
}

// ── Financiamiento ────────────────────────
function calcCuota(P, r, n) {
  if (r === 0) return P / n;
  const rm = r / 100;
  return P * rm * Math.pow(1 + rm, n) / (Math.pow(1 + rm, n) - 1);
}
