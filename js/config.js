// ═══════════════════════════════════════════
//  config.js — Configuración global
//  Aquí van las claves de Supabase y variables
//  compartidas entre todos los módulos
// ═══════════════════════════════════════════

const SUPA = 'https://inlejbenzupcgpkuiqzj.supabase.co';
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlubGVqYmVuenVwY2dwa3VpcXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzE1ODYsImV4cCI6MjA5MjQ0NzU4Nn0.PAovGQ51-cVmOsxcb9fG26kYTArzjQVbS0718-krHuQ';
const HDR  = {
  'Content-Type' : 'application/json',
  'apikey'       : KEY,
  'Authorization': 'Bearer ' + KEY,
  'Prefer'       : 'return=representation'
};

// Credenciales del administrador
// Para cambiarlas: modifica solo estas dos líneas
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'techstore2025';

// ── Estado global compartido ──────────────
let productos = [];
let ventas    = [];
let tecnicos  = [];
let abonos    = [];
let isAdmin   = false;
let pubFilter = '';
let varTemp   = [];
let editVentaId  = null;
let editTecId    = null;
let editProdId   = null;
let abonoVId     = null;
let abonoTId     = null;

// ── Helper de Supabase ────────────────────
async function sb(table, method = 'GET', body = null, qs = '') {
  const url = `${SUPA}/rest/v1/${table}${qs}`;
  const opts = { method, headers: { ...HDR } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
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

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Carga de datos ────────────────────────
async function loadAll() {
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
