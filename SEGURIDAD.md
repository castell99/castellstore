# Puesta en marcha — seguridad CastellStore

Orden importa: si subes el código antes de crear el usuario, te
quedas fuera del admin.

## 1. Crear el usuario administrador

Supabase → **Authentication** → **Users** → *Add user* → *Create new user*.

- Correo: el tuyo real
- Contraseña: nueva y larga. **No reutilices `techstore2025`** — esa
  clave lleva tiempo publicada en el repositorio y hay que darla por
  quemada.
- Marca *Auto Confirm User* (si no, el login falla esperando
  confirmación por correo)

Opcional pero recomendable: en **Authentication → Providers → Email**,
desactiva *Enable signups*. Si queda activo, cualquiera puede
registrarse solo y obtener un token `authenticated` — que es
exactamente el permiso que las políticas RLS conceden.

## 2. Ejecutar el SQL

Supabase → **SQL Editor** → New query → pega `sql/01_seguridad.sql` → Run.

La última consulta debe devolver `rowsecurity = true` en las 10 tablas.

## 3. Subir el código

Reemplaza los archivos modificados:

- `js/config.js` — sesión, `sb()` con token, `uploadHeaders()`
- `js/auth.js` — login contra Supabase Auth
- `js/catalogo.js` — lee `productos_publicos`
- `js/inventario.js`, `js/tecnicos.js`, `js/contrato.js`,
  `js/financiamiento_modulo.js` — subidas con token de sesión
- `index.html` — campo de correo en el login

## 4. Probar

1. Abre el catálogo sin iniciar sesión → debe verse igual que antes.
2. Consola del navegador: `await sb('ventas')` → debe fallar.
3. Consola: `isAdmin = true; showAdminView()` → debe devolverte al
   catálogo, no al admin.
4. Inicia sesión con el usuario nuevo → todo debe funcionar.
5. Sube una foto a un servicio → debe subir sin error.

Si el paso 2 devuelve datos, RLS no quedó aplicado en esa tabla.

## 5. Rotar la anon key

La anon key actual está en el historial de Git. Publicada no es
catastrófica por sí sola — está diseñada para ser pública — pero
rotarla es sano ahora que RLS es lo que realmente protege.

Supabase → Settings → API → *Rotate anon key*, y actualiza `KEY` en
`config.js`.

---

# Pendiente (no cubierto por estos cambios)

## Buckets de Storage — RESUELTO

Ejecutar `sql/02_storage.sql` y subir config.js, tecnicos.js y
contrato.js. `servicios-fotos` y `contratos-docs` quedan privados;
`equipos-imagenes` sigue público porque es el catálogo.

Las fotos ahora se muestran con URLs firmadas que vencen en una hora.
Al borrar una foto también se borra el archivo del bucket, cosa que
antes no pasaba (quedaban huérfanos).

### Fotos subidas antes del cambio
Las filas viejas de `servicios_fotos` guardan la URL completa; las
nuevas guardan solo la ruta. El código acepta ambos formatos, así que
no hace falta migrar nada.

## Claves de desbloqueo

`tecnicos.clave_bloqueo` y `tecnicos.patron_bloqueo` guardan PIN y
patrón de desbloqueo de equipos de clientes en texto plano. Con RLS
esto ya no es accesible desde fuera, pero sigue siendo el dato más
sensible de la base: si alguien obtiene tu contraseña de admin, se
lleva la llave de los equipos de tus clientes.

Dos caminos, de menor a mayor esfuerzo:

1. **Borrado automático** — un cron que limpie esos campos cuando el
   servicio pasa a *Entregado*. Deja de existir el dato en reposo.
2. **Cifrado en el cliente** — con una clave que no viva en la base.

La opción 1 cubre casi todo el riesgo real y es media hora de trabajo.

## Rate limiting del login

Supabase limita intentos por IP en su endpoint de auth, así que hay
protección básica de fábrica. Si más adelante manejas varios usuarios,
vale la pena revisar los límites en Authentication → Rate Limits.
