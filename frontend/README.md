# Frontend

Interfaz de PrintLabel construida con Vite, React, TypeScript y Tailwind CSS.

## Desarrollo

Desde esta carpeta, crea `.env.local` a partir del ejemplo y ejecuta Vite:

```bash
cp .env.example .env.local
npm run dev
```

El servidor se inicia con `--host` para permitir acceso desde otros dispositivos de la red local.

### Configuración

| Variable | Requerida | Valor predeterminado | Uso |
|---|---|---|---|
| `VITE_BACKEND_URL` | No | `http://192.168.15.189:8001` | Destino del proxy de desarrollo para las solicitudes `/api` |

Define otra dirección en `.env.local` si el backend está en otro host o puerto. En producción, el frontend usa rutas `/api` del mismo origen y las atiende Express.

## Comandos

```bash
npm run dev         # servidor de desarrollo Vite
npm run build       # verifica tipos y genera frontend/dist/
npm run type-check  # verificación de TypeScript
npm run lint        # ESLint
npm run preview     # vista local del build
```

## Funcionalidad

- Editor de etiquetas con texto, códigos de barras, códigos QR, formas e imágenes.
- Edición de propiedades, selección y redimensionamiento en el lienzo, guías de alineación y deshacer/rehacer.
- Importación de imágenes PNG y JPEG de hasta 10 MB.
- Guardado y carga de plantillas, galería y envío de trabajos de impresión.
- Flujo de staging para propuestas de usuarios y herramientas de moderación para administradores.

Las pantallas principales son `/` (editor), `/editor/:id` (edición de una plantilla), `/galeria` y `/staging` (solo admin).

### Atajos del editor

Los atajos de edición no se activan mientras el foco está en un campo de texto.

| Teclas | Acción |
|---|---|
| `Ctrl/Cmd + Z` / `Ctrl/Cmd + Y` | Deshacer / rehacer |
| `Delete` | Eliminar el elemento seleccionado |
| `Ctrl/Cmd + D` | Duplicar |
| `Ctrl/Cmd + C` / `Ctrl/Cmd + V` | Copiar / pegar elemento |
| `R` | Rotar |
| Flechas | Mover en incrementos de 0.1 mm |
| `Shift` + flechas | Mover en incrementos de 1 mm |
| `Shift` al redimensionar una forma | Mantener temporalmente la relación de aspecto |
| `Escape` | Quitar selección o cerrar el foco del campo activo |
