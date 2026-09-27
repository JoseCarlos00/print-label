# PrintLabel — Editor de etiquetas Zebra

Editor visual (WYSIWYG) para diseñar etiquetas que se imprimen directo en
impresoras Zebra por ZPL, vía socket TCP (sin pasar por el motor de
impresión del navegador).

La especificación funcional completa (flujos de usuario, modelo de datos,
API, decisiones de arquitectura) vive en [`especificacion-proyecto.md`](./especificacion-proyecto.md).
Este archivo es solo la puerta de entrada rápida.

## Estructura (monorepo, npm workspaces)

```
frontend/   → Vite + React + TypeScript + Tailwind. Ver frontend/README.md
backend/    → Express + TypeScript. Ver backend/README.md
shared/     → Tipos TS compartidos + generador de ZPL (sin paso de build)
```

## Quick start (desarrollo)

Requisitos: Node 20+, npm.

```bash
npm install          # instala todo el monorepo (workspaces)
```

Necesitás dos terminales:

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env   # completar ADMIN_USER / ADMIN_PASSWORD
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Más detalle de cada lado (variables de entorno, scripts, deploy) en:
- [`backend/README.md`](./backend/README.md)
- [`frontend/README.md`](./frontend/README.md)

## Estado del proyecto

**Funcionalidad core (spec completa) implementada:**
editor de elementos (texto/barcode/QR), drag & drop, undo/redo, guías de
alineación, flujo libre → staging, flujo admin → aprobado directo, panel
de staging (aprobar/rechazar), generación de ZPL, impresión por socket TCP,
sesión de admin por cookie.

**Pendiente:**
- Resize de elementos con el mouse (hoy el tamaño se edita solo desde el
  panel de propiedades, en mm).
- Importación de imágenes al editor (en evaluación: qué formatos soportar
  y cómo convertirlas a ZPL — probablemente como bitmap `^GFA`, igual que
  texto/barcode/QR).
- Primera prueba de despliegue a producción del backend: **en curso**.

## Notas de arquitectura a tener en cuenta

- El ZPL no se genera con comandos nativos simples (`^A`, `^BC`, `^BQ`).
  Todo elemento (texto, barcode, QR) se **rasteriza a bitmap** con
  `opentype.js` y se envía como gráfico `^GFA`. Es una decisión consciente
  para tener control pixel-perfect de fuentes/kerning, no un desvío
  accidental de la spec original. Ver `backend/README.md` para más detalle.
- El frontend asume que corre en la misma red local que las impresoras
  Zebra (spec §8, §10) — no está pensado para exponerse a internet.
