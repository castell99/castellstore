function renderTarjetaEquipo(eq) {
  var tags = [];
  try { tags = typeof eq.etiquetas === 'string' ? JSON.parse(eq.etiquetas || '[]') : (eq.etiquetas || []); } catch(e) {}
  var gamaColor = { 'Baja':'green', 'Media':'blue', 'Alta':'amber' };

  // La foto va sobre un panel apenas mas claro que la tarjeta. Sin
  // fondo blanco: las fotos recortadas quedaban metidas en un bloque.
  var imgHtml;
  if (eq.imagen1 && eq.imagen2) {
    imgHtml = '<div class="cat-img-wrap"><img src="' + eq.imagen1 + '" class="cat-img-main"><img src="' + eq.imagen2 + '" class="cat-img-hover"></div>';
  } else if (eq.imagen1) {
    imgHtml = '<div class="cat-img-wrap"><img src="' + eq.imagen1 + '" class="cat-img-main"></div>';
  } else {
    imgHtml = '<div class="cat-img-wrap" style="display:flex;align-items:center;justify-content:center;font-size:46px">📱</div>';
  }

  // Especificaciones en una sola linea de texto. Antes eran pastillas:
  // con tres o cuatro saltaban de renglon y descuadraban el alto de la
  // tarjeta respecto a sus vecinas.
  var specs = [];
  if (eq.ram)            specs.push(eq.ram);
  if (eq.almacenamiento) specs.push(eq.almacenamiento);
  if (eq.g5)             specs.push('5G');
  var specsTxt = specs.join(' · ');

  var chips = '<span class="badge ' + (gamaColor[eq.gama] || 'muted') + '">' + (eq.gama || '') + '</span>' + badgeGrado(eq.grado);
  if (tags.indexOf('Más vendido') !== -1) chips += '<span class="badge amber">⭐ Más vendido</span>';

  var precio   = parseFloat(eq.precio_contado) || 0;
  var nombreWA = (eq.marca + ' ' + eq.modelo).replace(/[^a-zA-Z0-9 ]/g, '');

  var h = '';
  h += '<div class="prod-card cat-card" onclick="abrirDetalleEquipo(' + eq.id + ')">';
  h +=   '<div class="cat-foto">' + imgHtml + '</div>';
  h +=   '<div class="prod-body">';
  h +=     '<div class="cat-chips">' + chips + '</div>';
  h +=     '<div style="font-size:11px;color:var(--text3);letter-spacing:.3px">' + (eq.marca || '') + '</div>';
  h +=     '<div class="prod-name" style="font-size:16px;margin:1px 0 6px">' + (eq.modelo || '') + '</div>';
  if (specsTxt) {
    h +=   '<div style="font-size:12px;color:var(--text2)">' + specsTxt + '</div>';
  }
  // Todo lo de abajo se empuja al fondo: asi el precio y el boton
  // quedan alineados entre tarjetas aunque el texto de arriba varie.
  h +=     '<div class="cat-pie">';
  h +=       '<div class="prod-price" style="margin:10px 0 9px">' + fmt(precio) + '</div>';
  h +=       '<button class="cat-btn-wa" onclick="event.stopPropagation();consultarEquipo(\'' + nombreWA + '\')">';
  h +=         '<span style="font-size:15px">💬</span> Consultar';
  h +=       '</button>';
  h +=     '</div>';
  h +=   '</div>';
  h += '</div>';
  return h;
}
