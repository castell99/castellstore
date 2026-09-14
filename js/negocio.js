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
  correo   : 'carlosstroller@gmail.com',
  // Datos de recaudo — van impresos en el contrato (clausula CUARTA).
  banco       : 'Davivienda',
  llave       : '@davi3046019483',
  titularPago : 'Carlos Castro Elles',
  // Redes
  facebook : 'castelltechco',
  instagram: 'castelltechco',
  tiktok   : 'castelltechco',
  youtube  : 'castelltechco',

    // Grados de condicion del equipo. El texto vive aqui, no en cada
  // fila del catalogo: si hay que corregir una palabra se corrige
  // una vez y cambia en todos los equipos.
  grados: {
    'Nuevo': {
      resumen: 'Equipo nuevo, sellado de fábrica.',
      puntos : []
    },
    'Grado A': {
      resumen: 'Seminuevo en excelente estado estético y funcional.',
      puntos : [
        'Estética: marcas de uso mínimas o casi imperceptibles. Sin golpes profundos, rajaduras ni rayones notables.',
        'Funcionamiento: cámara, Face ID, botones y altavoces operan al 100%.',
        'Disponible para cualquier operador.'
      ]
    },
    'Grado B': {
      resumen: 'Usado, funciona al 100%, con marcas estéticas visibles.',
      puntos : [
        'Estética: rayones y rasguños leves en carcasa, bordes o pantalla, visibles al detallarlos. Sin trizaduras ni golpes graves.',
        'Funcionamiento: sistema, cámara, sensores y todas las funciones operan correctamente.',
        'Disponible para cualquier operador.'
      ]
    }
  },

    // Terminos de garantia. Los plazos van aqui para poder ajustarlos
  // sin tocar codigo. Antes de fijarlos conviene revisarlos con un
  // abogado: la Ley 1480 hace solidarios al productor y al proveedor,
  // y anunciar un plazo menor al del fabricante puede acarrear
  // sancion en lugar de proteger.
    garantia: {
    version : '2026-09',        // queda registrada en cada aceptacion

    // Nuevos: 10 meses. Usados: 3 meses.
    // OJO: la garantia del fabricante sigue vigente aunque aqui se
    // anuncie un plazo menor — el proveedor responde solidariamente
    // (Ley 1480, art. 10). Revisar con abogado antes de fijarlo.
    meses   : { 'Nuevo': 10, 'Grado A': 6, 'Grado B': 3, 'Usado': 3, 'Reacondicionado': 3 },

    cubre: 'Mal funcionamiento por defecto de fábrica que afecte la ' +
           'calidad, idoneidad o el funcionamiento normal del equipo.',

    // corto → tirilla de 58mm · largo → pagina de aceptacion.
    // Una sola lista: la tirilla y lo que firma el cliente nunca
    // pueden decir cosas distintas.
    exclusiones: [
      { corto: 'Golpes, caídas o presión',
        largo: 'Golpes, caídas o presión sobre el equipo, aunque el vidrio no presente rotura visible.' },
      { corto: 'Humedad o líquidos',
        largo: 'Contacto con líquidos o humedad, verificable por los indicadores internos del equipo.' },
      { corto: 'Equipos abiertos por terceros',
        largo: 'Apertura, reparación o manipulación por personal ajeno a Castell Tech.' },
      { corto: 'Cargadores no compatibles',
        largo: 'Uso de cargadores o accesorios no compatibles con el equipo.' },
      { corto: 'Software modificado',
        largo: 'Modificación del software de fábrica o instalación de sistemas no oficiales.' },
      { corto: 'Desgaste normal y batería',
        largo: 'Desgaste normal por uso, incluida la disminución progresiva de la capacidad de la batería.' },
      { corto: 'Bloqueo por IMEI no registrado',
        largo: 'Bloqueo del equipo por falta de registro del IMEI ante el operador, trámite que corresponde al comprador.' },
      { corto: 'Fuerza mayor',
        largo: 'Fuerza mayor, caso fortuito o hecho de un tercero.' }
    ]
  },
  
  // Paleta de documentos — monocroma.
  // La usan recibo.js, contrato.js y factura.js. Cambiar aqui
  // cambia todos los documentos a la vez.
  doc: {
    tinta  : '#000000',   // texto principal, bordes, franjas
    suave  : '#5a5a5a',   // etiquetas y texto secundario
    linea  : '#d4d4d4',   // separadores finos
    caja   : '#f6f6f6',   // relleno de cajas de datos
    papel  : '#ffffff'
  },

  // Paleta anterior — la conservan pantallas y documentos que aun
  // no se han pasado a monocromo. No usar en documentos nuevos.
  color: {
    fondo  : '#101f2b',
    texto  : '#e8f0f5',
    suave  : '#8a9aa1',
    linea  : '#1e3347',
    verde  : '#a4d65e',
    aazul   : '#5ba3c9'
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

// Arma el nombre del equipo sin repetir la marca.
// En el catalogo hay filas donde el modelo ya la incluye
// ('IPHONE' + 'IPHONE 15 PRO MAX') y otras donde no
// ('SAMSUNG' + 'Galaxy S25 Ultra 5G'). Se compara sin
// distinguir mayusculas porque tampoco son consistentes.
function nombreEquipo(marca, modelo) {
  var ma = (marca  || '').trim();
  var mo = (modelo || '').trim();
  if (!ma) return mo;
  if (!mo) return ma;
  if (mo.toUpperCase().indexOf(ma.toUpperCase()) === 0) return mo;
  return ma + ' ' + mo;
}
