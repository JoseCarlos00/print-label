# Backend — PrintLabel

Express + TypeScript. Sirve la API REST, genera el ZPL de las etiquetas y
lo envía directo a las impresoras Zebra por socket TCP (puerto 9100).

## Requisitos

- Node 20+
- Acceso de red a las impresoras Zebra (puerto 9100) para poder imprimir.

## Setup

```bash
cp .env.example .env
```

Completar `.env` con, como mínimo, `ADMIN_USER` y `ADMIN_PASSWORD` — el
servidor **falla al arrancar** si faltan (a propósito, ver `src/config.ts`).

### Variables de entorno

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `ADMIN_USER` | Sí | — | Usuario del único admin |
| `ADMIN_PASSWORD` | Sí | — | Contraseña del admin (comparación con `timingSafeEqual`, no hash — ver spec §6) |
| `PORT` | No | `8001` | Puerto HTTP del servidor |
| `NODE_ENV` | No | `development` | `production` activa cookies `secure` y ajusta la ruta de `backend/data/` |
| `DB_FILENAME` | No | `label-printer.db` | Nombre del archivo SQLite |

No hay tabla de usuarios ni roles: es un único admin fijo, pensado para
red interna no expuesta a internet (spec §6).

## Scripts

```bash
npm run dev          # tsx watch, recarga en caliente
npm run typecheck    # tsc, sin emitir (validación de tipos)
npm run build        # typecheck + bundle a dist/server.js (esbuild)
npm run start         # corre dist/server.js (NODE_ENV=production)
```

## Arquitectura

### Generación de ZPL: rasterizado a bitmap, no comandos nativos

A diferencia de un generador ZPL "clásico" (`^A` para texto, `^BC` para
barcode, `^BQ` para QR), acá **cada elemento se rasteriza a un bitmap**
usando `opentype.js` para renderizar el glyph path, y se envía como un
único comando gráfico `^GFA` por elemento (ver `shared/zpl/`).

Es una decisión intencional, no un desvío:
- Control pixel-perfect de la fuente (kerning, negrita emulada, wrap,
  justificado) que los comandos nativos de la impresora no ofrecen.
- El resultado es determinístico entre impresoras/firmwares distintos,
  porque la impresora solo dibuja el bitmap que ya viene calculado —
  no interpreta la fuente ella misma.
- El costo es más CPU en el momento de generar el ZPL (rasterizado +
  hex-encode del bitmap) y un ZPL más pesado en bytes que el de comandos
  nativos.

`shared/zpl/units.ts::ZplValidationError` es el único tipo de error que
el controller (`print.controller.ts`) debe tratar como 400 (dato inválido
del usuario); cualquier otro error en la generación es 500.

### Persistencia

- SQLite (`better-sqlite3`), un solo archivo, vive en `backend/data/`
  **fuera** de `dist/` (sobrevive a redeploys que reemplazan `dist/`).
- Tablas: `templates`, `sessions`, `printer_profiles` (esta última se
  sincroniza en cada arranque desde `src/printerDevices.ts` — el código
  es la fuente de verdad, no se edita a mano en la DB).

### Staging: rechazadas

- `GET /api/staging/rejected` lista las plantillas rechazadas.
- `POST /api/staging/:id/restore` las devuelve a `pending`.
- `DELETE /api/staging/:id` las elimina definitivamente.
- Una limpieza automática al arrancar y cada 24 horas elimina las rechazadas
  cuyo `update_on` tenga más de 90 días. El contador de staging sigue contando
  únicamente las pendientes.

### Bundle de producción

`esbuild.config.js` genera `dist/server.js` autocontenido:
- `shared` se inlinea (es TS fuente sin compilar).
- Las dependencias de npm reales (`express`, `dotenv`, etc.) quedan
  `external` — en el servidor de destino hace falta `npm install` después
  de copiar `dist/` + `package.json`.

## Despliegue (servicio de Windows)

Ver spec §10 para el detalle completo. Resumen:

1. `npm run build` (backend y frontend).
2. Copiar `backend/dist/` + `backend/package.json` a la máquina servidor.
3. `npm install` en el servidor.
4. Reiniciar el servicio (NSSM / `node-windows`).
5. **`backend/data/` nunca se toca** en este proceso — ahí vive la DB.

### Estado de la primera prueba en producción

🚧 En curso. Cosas a validar en ese primer despliegue real:
- Que el cierre ordenado (`SIGTERM`/`SIGINT` → `shutdown()` en `server.ts`)
  funcione bien cuando el servicio de Windows reinicia/detiene el proceso.
- Conectividad real a las IPs de `printerDevices.ts` desde la máquina
  servidor (no solo desde la máquina de desarrollo).
- Que `backend/data/` efectivamente persista entre redeploys.
