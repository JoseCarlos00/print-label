# Especificación del proyecto: Editor de etiquetas Zebra

## 1. Qué hace la aplicación

Es un editor visual (WYSIWYG) para diseñar etiquetas que se imprimen en impresoras
Zebra (inicialmente 4"x4", con soporte planeado para 70x32mm). El usuario coloca,
mueve, edita y elimina elementos —texto, códigos de barras, códigos QR— dentro de
un área que representa físicamente el tamaño de la etiqueta.

Al momento de imprimir, el diseño **no se manda al navegador para imprimir**: se
convierte a comandos **ZPL** y se envía directo a la impresora por su dirección IP
(socket TCP, puerto 9100). Esto elimina los problemas de márgenes/escala que
causaba depender del motor de impresión del navegador.

## 2. Los dos flujos de usuario

### Usuario libre (sin cuenta, sin login)
- Entra directo al editor.
- Diseña la etiqueta.
- Puede **imprimir directo**, sin guardar nada.
- Puede **"Guardar como plantilla"**: debe escribir un nombre para la plantilla y
  su propio nombre (`solicitadoPor`). Esto **no se guarda directo**: se envía a
  un área de **staging** con estado `"pendiente"`.

### Admin (usuario único, con login)
- Inicia sesión con usuario/contraseña fijos (definidos en `.env`, no hay tabla
  de usuarios ni roles).
- Ve el mismo editor, pero con un **indicador visual de "modo admin"**.
- Al guardar, la plantilla se guarda **directo como `"aprobada"`** (no pasa por
  staging).
- Tiene acceso a un **panel de staging**: lista de plantillas `"pendiente"`, cada
  una con el nombre de quien la solicitó.
- Puede **aprobar** (pasa a `"aprobada"`) o **rechazar** (pasa a `"rechazada"`,
  se conserva como historial, no se borra) cada plantilla pendiente.

## 3. Modelo de datos (vive en `shared/types.ts`)

- **`ElementoEtiqueta`**: unión discriminada (`texto` | `barcode` | `qr`), cada
  uno con posición en **milímetros** (nunca píxeles) y rotación restringida a
  `0 | 90 | 180 | 270` (límite real de ZPL, no hay rotación libre en impresión).
- **`PerfilImpresora`**: ancho/alto en mm, DPI (203 o 300 típico en Zebra), IP.
- **`Plantilla`**: `elementos[]`, `perfilId`, `publica` (visible en galería
  general o no), `estado` (`pendiente | aprobada | rechazada`), `solicitadoPor`
  (solo aplica si vino de staging).
- **`CrearPlantillaInput`**: lo que viaja al crear una plantilla. El backend
  decide el `estado` según la ruta/autenticación — **nunca lo decide el cliente**.

## 4. Comunicación frontend ↔ backend

REST sobre JSON, mismo origen: en producción, Express sirve el build de React
como archivos estáticos, así que no hay problemas de CORS. En desarrollo, el
frontend corre en el servidor de Vite (puerto distinto) y hace `fetch` al
backend.

**Rutas principales del API:**

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| POST | `/api/auth/login` | público | Verifica credenciales, crea sesión |
| POST | `/api/auth/logout` | público | Cierra sesión |
| GET | `/api/auth/me` | público | Indica si hay sesión de admin activa |
| POST | `/api/templates/staging` | público | Crea plantilla `pendiente` |
| POST | `/api/templates` | admin | Crea plantilla `aprobada` directo |
| GET | `/api/templates` | público | Lista plantillas `aprobada` + `publica` |
| GET | `/api/templates/todas` | admin | Lista todas las `aprobada` (incl. no públicas) |
| GET | `/api/templates/:id` | público/admin | Detalle de una plantilla |
| GET | `/api/staging` | admin | Lista plantillas `pendiente` |
| POST | `/api/staging/:id/aprobar` | admin | Cambia a `aprobada` |
| POST | `/api/staging/:id/rechazar` | admin | Cambia a `rechazada` |
| POST | `/api/print` | público/admin | Genera ZPL y lo envía a la impresora por IP |

## 5. Cómo se guarda la sesión del admin

No usamos JWT ni tokens autocontenidos. El mecanismo es más simple y fácil de
razonar:

1. Al hacer login correcto, el backend genera un **token aleatorio**
   (`crypto.randomBytes`), lo guarda en una tabla `sessions` de SQLite junto con
   su fecha de expiración (**7 días**, según lo que definimos).
2. Ese token se manda al navegador como **cookie `httpOnly`** — no es accesible
   desde JavaScript del navegador, lo que protege contra robo de sesión vía XSS.
   En producción se marca además como `secure` (solo viaja por HTTPS) y
   `sameSite: lax`.
3. En cada petición, un middleware lee la cookie, busca el token en la tabla
   `sessions`, valida que no haya expirado, y marca `req.isAdmin = true/false`.
4. Al hacer logout, se borra la fila de `sessions` correspondiente y se limpia
   la cookie del navegador.

**Por qué así y no con JWT:** con un solo usuario admin, no hay necesidad de que
la sesión sea "autocontenida" (verificable sin consultar la base de datos). Usar
una tabla de sesiones es más simple de invalidar (por ejemplo, forzar cierre de
sesión) y evita la complejidad de firmar/verificar tokens.

## 6. Verificación de credenciales contra `.env`

- `ADMIN_USER` y `ADMIN_PASSWORD` son variables de entorno **requeridas**: el
  servidor falla al arrancar si no están definidas (evita arrancar con
  credenciales adivinables o vacías).
- La comparación se hace con `crypto.timingSafeEqual`, no con `===` directo —
  esto evita "timing attacks" (un atacante midiendo cuánto tarda la respuesta
  para adivinar la contraseña carácter por carácter).
- No se usa hash/bcrypt para esta contraseña, dado que es un único usuario fijo
  en una red interna, no expuesta a internet. Es una simplificación consciente;
  se podría reforzar más adelante si el contexto de red cambia.

## 7. Persistencia

- **SQLite** vía `better-sqlite3`, un solo archivo de base de datos.
- El archivo vive en `backend/data/`, **fuera** de `dist/`, para sobrevivir a
  los redespliegues (donde se reemplaza `dist/` completo).
- Tablas: `plantillas` (o `templates`) y `sesiones` (o `sessions`).

## 8. Generación e impresión ZPL

- Una función pura vive en `shared`: recibe `ElementoEtiqueta[]` +
  `PerfilImpresora`, devuelve un `string` con el ZPL completo (`^XA ... ^XZ`).
- Cada elemento se convierte a su comando ZPL correspondiente (`^A` texto, `^BC`
  barcode, `^BQ` QR), con posición convertida de mm a dots según el DPI del
  perfil (`dots = mm * (dpi / 25.4)`).
- El backend recibe `{ elementos, perfilId }` en `POST /api/print`, genera el
  ZPL, abre un socket TCP a la IP del perfil, y lo envía crudo — la impresora
  lo interpreta directo, sin pasar por el navegador.

## 9. Arquitectura de carpetas (monorepo con npm workspaces)

```
frontend/   → Vite + React + TypeScript + Tailwind (modo oscuro)
              React Router para las vistas: editor, login admin, panel de staging
backend/    → Express + TypeScript
              tsx en desarrollo, esbuild bundle a dist/server.js en build
              (shared se inlinea, express/dotenv/etc. quedan como dependencias externas)
shared/     → Tipos TypeScript compartidos, TS fuente sin compilar
```

## 10. Despliegue

- El backend corre como **servicio de Windows** (vía NSSM o `node-windows`) en
  una computadora dedicada dentro de la red local.
- Flujo de actualización: `npm run build` en frontend y backend → copiar
  `backend/dist/` + `package.json` a la máquina servidor → `npm install` →
  reiniciar el servicio. **La carpeta `backend/data/` nunca se toca** en este
  proceso.
- El servidor Express **no debe exponerse a internet** — solo accesible dentro
  de la red local, dado que no hay autenticación para el uso general (libre) de
  la app.
