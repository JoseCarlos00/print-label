# Backend

API REST de PrintLabel, implementada con Express y TypeScript. También genera ZPL, conserva las plantillas y perfiles en SQLite y envía trabajos a impresoras Zebra por TCP (puerto 9100).

## Requisitos y configuración

- Node.js 20 o superior
- Acceso de red desde el backend a las impresoras configuradas

Desde esta carpeta, copia `.env.example` a `.env` y define las credenciales administrativas:

```bash
cp .env.example .env
npm run dev
```

El servidor no inicia si faltan `ADMIN_USER` o `ADMIN_PASSWORD`.

| Variable | Requerida | Predeterminado | Descripción |
|---|---|---|---|
| `ADMIN_USER` | Sí | — | Usuario administrativo |
| `ADMIN_PASSWORD` | Sí | — | Contraseña administrativa |
| `PORT` | No | `8001` | Puerto HTTP |
| `NODE_ENV` | No | `development` | En `production` la cookie de sesión se marca `secure` |
| `DB_FILENAME` | No | `label-printer.db` | Nombre del archivo SQLite |

La ruta completa del archivo SQLite se imprime en el log al iniciar. En desarrollo queda en `backend/data/`; con el bundle de producción, la ruta se resuelve desde `backend/dist/` y queda en el directorio `data/` un nivel por encima de la carpeta `backend/`. Mantén y respalda la ruta que indique el servidor al actualizar o desplegar; `DB_FILENAME` cambia el nombre del archivo, no su ubicación.

## Comandos

```bash
npm run dev         # servidor con recarga automática
npm run typecheck   # comprobación de tipos
npm run build       # comprobación de tipos y bundle en dist/server.js
npm run start       # inicia el bundle con NODE_ENV=production
npm run db:clear-sessions  # elimina sesiones administrativas
```

## API

Todas las rutas, salvo `/health`, están bajo `/api`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/health` | Público | Estado del servicio |
| `POST` | `/api/auth/login` | Público | Iniciar sesión administrativa |
| `POST` | `/api/auth/logout` | Público | Cerrar sesión |
| `GET` | `/api/auth/me` | Público | Consultar el estado de sesión |
| `GET` | `/api/printers` | Público | Listar perfiles de impresora |
| `GET` | `/api/printers/:id` | Público | Consultar perfil de impresora |
| `POST` | `/api/print` | Público | Generar ZPL e imprimir |
| `GET` | `/api/templates` | Público | Listar plantillas públicas aprobadas |
| `GET` | `/api/templates/:id` | Público | Consultar una plantilla |
| `POST` | `/api/templates/staging` | Público | Enviar una plantilla para revisión |
| `GET` | `/api/templates/all` | Admin | Listar plantillas aprobadas, incluidas las privadas |
| `POST` | `/api/templates` | Admin | Crear una plantilla aprobada |
| `PUT` / `DELETE` | `/api/templates/:id` | Admin | Actualizar o eliminar una plantilla |
| `GET` | `/api/staging` | Admin | Listar propuestas pendientes |
| `GET` | `/api/staging/count` | Admin | Consultar el contador de propuestas pendientes |
| `GET` | `/api/staging/rejected` | Admin | Listar propuestas rechazadas |
| `POST` | `/api/staging/:id/approve` | Admin | Aprobar una propuesta |
| `POST` | `/api/staging/:id/reject` | Admin | Rechazar una propuesta |
| `POST` | `/api/staging/:id/restore` | Admin | Restaurar una propuesta rechazada |
| `DELETE` | `/api/staging/:id` | Admin | Eliminar una propuesta rechazada |

## Impresión y almacenamiento

Los elementos de etiqueta se rasterizan a gráficos monocromos y se codifican en ZPL como `^GFA`. Esto hace que el resultado visual no dependa de las fuentes instaladas en la impresora. Las posiciones y dimensiones se convierten de milímetros a puntos según el DPI del perfil. La impresora recibe el ZPL directamente por TCP, puerto 9100.

Los perfiles y dispositivos se definen en `src/printerDevices.ts` y se sincronizan con SQLite al iniciar el servidor. La base guarda perfiles, plantillas y sesiones administrativas. Las sesiones expiran a los 7 días. Las plantillas rechazadas se eliminan automáticamente tras 90 días; la limpieza se ejecuta al iniciar y cada 24 horas.

## Seguridad y red

- El acceso administrativo usa una cookie `httpOnly`, `sameSite=lax` y, en producción, `secure`. Las credenciales se comparan en tiempo constante.
- El uso normal y el endpoint de impresión son públicos. Ejecuta el servicio únicamente en una red confiable y no lo expongas directamente a Internet.
- Hay límites por dirección IP: 10 intentos fallidos de login en 15 minutos, una solicitud de staging cada 2 segundos y una solicitud de impresión cada 0.5 segundos. Se almacenan en memoria y se reinician al reiniciar el proceso.
- Las impresoras deben ser accesibles desde la máquina que ejecuta el backend; la conexión TCP a cada impresora usa el puerto 9100.

## Build e integración con el frontend

`npm run build` genera `backend/dist/server.js` y empaqueta el código de `shared`. Para servir la aplicación desde Express, coloca el contenido del build de `frontend/dist/` en `backend/dist/public/`; Express sirve esos archivos y devuelve `index.html` para las rutas del frontend.

Al desplegar, instala las dependencias de producción requeridas por el backend y conserva la base de datos en la ruta indicada por el log de inicio. Configura `NODE_ENV=production`, `ADMIN_USER` y `ADMIN_PASSWORD` en el entorno del servicio. La configuración de impresoras y sus perfiles se mantiene en `src/printerDevices.ts`.
