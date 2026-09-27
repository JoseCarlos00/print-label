# Frontend — PrintLabel

Vite + React 19 + TypeScript + Tailwind (modo oscuro fijo, sin tema claro).
React Router para editor / galería / staging.

## Setup

```bash
cp .env.example .env.local
```

### Variables de entorno

| Variable | Requerida | Default (si no se define) | Descripción |
|---|---|---|---|
| `VITE_BACKEND_URL` | No | `http://192.168.15.189:8001` | IP/puerto del backend en la red local, usado por el proxy de `/api` en `vite.config.ts` |

La app está pensada para correr en la misma red local que las impresoras
Zebra — no hay forma de que funcione apuntando a un backend fuera de esa
red, así que el default hardcodeado no es un bug, es la topología real del
proyecto. La variable de entorno existe para no tener que editar
`vite.config.ts` (archivo versionado) si tu máquina de desarrollo necesita
apuntar a otra IP.

## Scripts

```bash
npm run dev          # vite --host (accesible desde otros dispositivos de la LAN)
npm run build        # tsc -b && vite build
npm run lint         # eslint .
npm run preview       # sirve el build de producción localmente
```

## Estructura

```
src/
├─ api/
│   └─ client.ts              ← wrapper fetch + ApiError
├─ context/                   ← AuthContext/Provider, LoginDialogContext/Provider
├─ store/
│   ├─ editorStore.types.ts   ← contrato de estado + acciones
│   ├─ useEditorStore.ts      ← implementación con zustand + zundo (undo/redo)
│   ├─ history.ts             ← transacciones de historial + tracking de "dirty"
│   └─ templatesCache.ts      ← invalidación cross-componente al mutar plantillas
├─ utils/
│   ├─ elementDefaults.ts     ← valores por defecto al crear texto/barcode/qr
│   ├─ scale.ts               ← conversión mm ↔ px (escala fija de pantalla)
│   ├─ printerPreference.ts   ← última impresora usada (localStorage)
│   ├─ navigationGuard.ts     ← confirm() al salir del editor con cambios sin guardar
│   └─ geometry/              ← bounds de elementos + snapping/alineación
├─ hooks/
│   ├─ usePrinterProfiles.ts  ← fetch de GET /api/printers
│   ├─ useTemplate.ts         ← fetch de GET /api/templates/:id
│   ├─ useTemplates.ts        ← fetch de listados (público/admin), reactivo a templatesCache
│   ├─ useAuth.ts / useLoginDialog.ts
│   ├─ useEditorKeyboard.ts   ← atajos: undo/redo, delete, duplicar, copiar/pegar, mover con flechas
│   └─ useUnsavedChangesGuard.ts
├─ components/
│   ├─ ui/                    ← primitives de shadcn (@base-ui/react)
│   ├─ NavBar.tsx / TopBar.tsx / ProtectedRoute.tsx / LoginDialog.tsx
│   ├─ gallery/                ← TemplateCard
│   ├─ staging/                ← preview de solo lectura (StaticLabelPreview/Element)
│   └─ editor/
│       ├─ TopBar ya vive en components/ (no en editor/)
│       ├─ Toolbar.tsx            ← agregar texto/barcode/qr
│       ├─ Canvas.tsx             ← área mm→px, drag & drop, snapping
│       ├─ CanvasElement.tsx      ← render + mini-toolbar flotante (rotar/duplicar/eliminar)
│       ├─ EditorPanelTabs.tsx    ← tabs Propiedades/Plantillas (drawer en mobile, fijo en desktop)
│       ├─ QuickTemplatesPanel.tsx
│       ├─ FloatingActionBar.tsx  ← undo/redo/limpiar
│       ├─ GuidesOverlay.tsx      ← líneas de alineación
│       ├─ OutOfBoundsWarning.tsx
│       ├─ SaveTemplateModal.tsx  ← nombre, público, positionLocked, locked por elemento, requestedBy
│       ├─ previews/              ← render de cada tipo de elemento + error boundary
│       └─ panel-editor/          ← PropertiesPanel + campos por tipo (Text/Barcode/Qr/Common)
└─ pages/
    ├─ EditorPage.tsx  ← orquesta editor nuevo o con :id
    ├─ GalleryPage.tsx
    └─ StagingPage.tsx
```

## Pendiente / TODO

- **Resize de elementos con el mouse.** Hoy el tamaño (`width`/`height`,
  `fontSize`, `size` de QR) solo se edita desde `PropertiesPanel`, en mm.
  Falta el handle visual en `CanvasElement` para redimensionar arrastrando.
- **Importación de imágenes.** Todavía no está implementado ni decidido:
  - Qué formatos aceptar (PNG/JPG probablemente, ¿SVG?).
  - Cómo se convierte a ZPL — lo más consistente con el resto del proyecto
    sería rasterizar a bitmap monocromo y enviarlo como `^GFA`, igual que
    texto/barcode/QR (ver `backend/README.md`), pero falta confirmar el
    approach (dithering vs. threshold puro, tamaño máximo, etc.).

## Notas

- `services/labelary.ts` llama a la API pública de Labelary
  (`api.labelary.com`) para renderizar ZPL a imagen — es un servicio
  externo, no el preview en vivo del editor (ese usa los bitmaps propios
  de `shared/zpl` vía canvas, ver `components/editor/previews/`).
- No hay ruta `/login` — el login es un modal (`LoginDialog`) que se abre
  desde el dropdown del logo (`TopBar`) o desde `NavBar`, no una página.
