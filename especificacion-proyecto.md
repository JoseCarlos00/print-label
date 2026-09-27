# Especificación del proyecto: Editor de etiquetas Zebra

## 1. Qué hace la aplicación

Es un editor visual (WYSIWYG) para diseñar etiquetas que se imprimen en impresoras
Zebra, con soporte para dos tamaños de etiqueta: 4"x4" y 70x32mm. El usuario coloca,
mueve, edita y elimina elements —texto, códigos de barras, códigos QR— dentro de
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
  su propio nombre (`requestedBy`). Esto **no se guarda directo**: se envía a
  un área de **staging** con state `"pending"`.

### Admin (usuario único, con login)
- Inicia sesión con usuario/contraseña fijos (definidos en `.env`, no hay tabla
  de usuarios ni roles). El login es un modal, no una página aparte.
- Ve el mismo editor, pero con un **indicador visual de "modo admin"**.
- Al guardar, la plantilla se guarda **directo como `"approved"`** (no pasa por
  staging).
- Tiene acceso a un **panel de staging**: lista de plantillas `"pending"`, cada
  una con el nombre de quien la solicitó.
- Puede **aprobar** (pasa a `"approved"`) o **rechazar** (pasa a `"rejected"`,
  se conserva como historial, no se borra) cada plantilla pending.

## 3. Modelo de datos (vive en `shared/types.ts`)

- **`LabelElement`**: unión discriminada (`texto` | `barcode` | `qr`), cada
  uno con posición en **milímetros** (nunca píxeles) y rotación restringida a
  `0 | 90 | 180 | 270` (límite real de ZPL, no hay rotación libre en impresión).
- **`PrinterProfile`**: ancho/alto en mm, DPI (203 o 300 típico en Zebra), IP.
- **`Template`**: `elements[]`, `profileId`, `public` (visible en galería
  general o no), `state` (`pending | approved | rejected`), `requestedBy`
  (solo aplica si vino de staging).
- **`CreateTemplateInput`**: lo que viaja al crear una plantilla. El backend
  decide el `state` según la ruta/autenticación — **nunca lo decide el cliente**.

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
| POST | `/api/templates/staging` | público | Crea plantilla `pending` |
| POST | `/api/templates` | admin | Crea plantilla `approved` directo |
| GET | `/api/templates` | público | Lista plantillas `approved` + `public` |
| GET | `/api/templates/all` | admin | Lista todas las `approved` (incl. no públicas) |
| GET | `/api/templates/:id` | público/admin | Detalle de una plantilla |
| GET | `/api/staging` | admin | Lista plantillas `pending` |
| POST | `/api/staging/:id/approve` | admin | Cambia a `approved` |
| POST | `/api/staging/:id/reject` | admin | Cambia a `rejected` |
| POST | `/api/print` | público/admin | Genera ZPL y lo envía a la impresora por IP |
| GET | `/api/printers` | público | Lista de impresoras para imprimir |

## 5. Cómo se guarda la sesión del admin

No usamos JWT ni tokens autocontenidos. El mecanismo es más simple y fácil de
razonar:

1. Al hacer login correcto, el backend genera un **token aleatorio**
   (`crypto.randomBytes`), lo guarda en una tabla `sessions` de SQLite junto con
   su fecha de expiración (**7 días**, según lo que definido).
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
- Tablas: `templates`, `sessions` y `printer_profiles`.

## 8. Generación e impresión ZPL

**Decisión de arquitectura:** en vez de generar comandos ZPL nativos por tipo
de elemento (`^A` para texto, `^BC` para barcode, `^BQ` para QR), cada elemento
se **rasteriza a un bitmap monocromo** con `opentype.js` (para el trazado de
glyphs de texto y de los dígitos legibles del barcode) y se envía como un único
comando gráfico `^GFA` por elemento. Es intencional, no un desvío accidental:

- Da control **pixel-perfect** sobre fuente, kerning, negrita emulada, wrap de
  texto y justificado — cosas que los comandos ZPL nativos no permiten
  controlar con esa precisión.
- El resultado es **determinístico** entre impresoras/firmwares distintos: la
  impresora solo dibuja el bitmap ya calculado, no interpreta la fuente ella
  misma.
- El costo es más CPU al generar el ZPL (rasterizado + hex-encode del bitmap)
  y un payload más pesado en bytes que el de comandos nativos equivalentes.

Flujo real (vive en `shared/zpl/`):

1. Por cada `LabelElement`, se genera un bitmap (`createTextBitmap`,
   `createCode128Bitmap` / `createEan13Bitmap`, `createQrBitmap`), con
   posición y tamaño convertidos de mm a dots según el DPI del perfil
   (`dots = mm * (dpi / 25.4)`).
2. El bitmap se rota (0/90/180/270°) y se recorta contra el área imprimible
   de la etiqueta (`clipBitmapToLabel`) — un elemento total o parcialmente
   fuera de los límites se recorta o se omite, no rompe la impresión.
3. Se arma el ZPL completo (`^XA ... ^XZ`) con un comando `^FO` (posición) +
   `^GFA` (gráfico) por elemento.
4. El backend recibe `{ elements, profileId }` en `POST /api/print`, genera
   el ZPL, abre un socket TCP a la IP del perfil, y lo envía crudo — la
   impresora lo interpreta directo, sin pasar por el navegador.

Un contenido de elemento inválido para su tipo (ej. un EAN-13 sin 12-13
dígitos numéricos, o texto/QR vacío) lanza `ZplValidationError`, que el
controller traduce a `400` — es un error de datos del usuario, no de
conexión con la impresora.

## 9. Arquitectura de carpetas (monorepo con npm workspaces)

```
frontend/   → Vite + React + TypeScript + Tailwind (modo oscuro)
              React Router para las vistas: editor, galería, staging
backend/    → Express + TypeScript
              tsx en desarrollo, esbuild bundle a dist/server.js en build
              (shared se inlinea, express/dotenv/etc. quedan como dependencias externas)
shared/     → Tipos TypeScript compartidos + generador de ZPL, TS fuente sin compilar
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

## 11. Estado actual y pendientes

Esta sección se actualiza a medida que avanza el proyecto, para que la spec
no quede desincronizada del código real.

**Implementado y en línea con esta spec:** todo lo descrito en §1 a §10.

**Pendiente:**
- **Resize de elementos con el mouse.** Hoy el tamaño de cada elemento
  (ancho/alto de barcode, tamaño de fuente, tamaño de QR) solo se edita
  numéricamente desde el panel de propiedades, en mm. Falta el handle
  visual para redimensionar arrastrando directo en el lienzo.
- **Importación de imágenes.** Aún no implementado. Falta decidir qué
  formatos soportar y confirmar el approach de conversión — lo más
  consistente con §8 sería rasterizar la imagen a bitmap monocromo y
  enviarla como `^GFA`, igual que el resto de los elementos.
- **Primera prueba de despliegue a producción del backend:** en curso.
  Puntos a validar: cierre ordenado del proceso bajo el servicio de
  Windows, conectividad real a las impresoras desde la máquina servidor,
  y persistencia de `backend/data/` entre redeploys.
