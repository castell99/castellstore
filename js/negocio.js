// ═══════════════════════════════════════════
//  negocio.js — Datos del negocio
//  Fuente unica para facturas, paz y salvo,
//  comprobantes y contratos.
//
//  IMPORTANTE: si cambia un telefono o una
//  direccion, se cambia AQUI y en ningun otro
//  archivo. Antes estaban duplicados en
//  factura.js y recibo.js con datos distintos.
// ═══════════════════════════════════════════

var NEGOCIO = {
  // Identidad
  // nombre = razon comercial, va en facturas, contratos y recibos.
  // sitio  = nombre del sitio web, solo para el pie y la URL.
  nombre   : 'Castell Tech',
  sitio    : 'CastellStore',
  web      : 'castell99.github.io/castellstore',

  // Responsable (aparece en documentos formales)
  titular  : 'Carlos Castro Elles',
  cedula   : '1052740183',

  // Ubicacion y contacto
  direccion: 'Cra 18 N 10-53',
  ciudad   : 'Villanueva, Bolivar',
  telefono : '304 601 9483',
  whatsapp : '573046019483',
  correo   : 'carlosstrolle@gmail.com',
  // Datos de recaudo — van impresos en el contrato (clausula CUARTA).
  banco       : 'Davivienda',
  llave       : '@davi3046019483',
  titularPago : 'Carlos Castro Elles',
  // Redes
  facebook : 'castelltechco',
  instagram: 'castelltechco',
  tiktok   : 'castelltechco',
  youtube  : 'castelltechco',

  // Paleta compartida por todos los documentos
  color: {
    fondo  : '#101f2b',
    texto  : '#e8f0f5',
    suave  : '#8a9aa1',
    linea  : '#1e3347',
    verde  : '#a4d65e',
    azul   : '#5ba3c9'
  }
};

// Linea de contacto lista para usar en encabezados.
function negocioContacto() {
  return NEGOCIO.direccion + ' · ' + NEGOCIO.ciudad + ' · Tel: ' + NEGOCIO.telefono;
}

// Compatibilidad con el codigo anterior de factura.js.
var FACTURA_VENDEDOR = {
  nombre   : NEGOCIO.titular,
  cedula   : NEGOCIO.cedula,
  direccion: NEGOCIO.direccion + ' ' + NEGOCIO.ciudad,
  telefono : NEGOCIO.telefono,
  negocio  : NEGOCIO.nombre,
  web      : NEGOCIO.web
};
