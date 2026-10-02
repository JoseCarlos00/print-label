# PrintLabel

Editor web para diseñar etiquetas y enviarlas a impresoras Zebra. La aplicación genera ZPL en el backend y transmite los trabajos directamente a la impresora por TCP (puerto 9100); no usa el diálogo de impresión del navegador.

## Requisitos

- Node.js 20 o superior
- npm
- Acceso desde el backend a la red de impresoras

## Desarrollo local

Instala las dependencias desde la raíz del monorepo:

```bash
npm install
```

Configura y ejecuta el backend desde una terminal:

```bash
cd backend
cp .env.example .env
# Completa ADMIN_USER y ADMIN_PASSWORD en .env
npm run dev
```

Configura y ejecuta el frontend desde otra terminal:

```bash
cd frontend
cp .env.example .env.local
npm run dev
```

El frontend usa el proxy de Vite para enviar `/api` al backend. Si el backend no está en la dirección configurada, cambia `VITE_BACKEND_URL` en `frontend/.env.local`. Los detalles de configuración y comandos están en [frontend/README.md](./frontend/README.md) y [backend/README.md](./backend/README.md).

## Componentes

| Carpeta | Responsabilidad |
|---|---|
| `frontend/` | Editor, galería de plantillas e interfaz de administración |
| `backend/` | API, persistencia SQLite, generación ZPL y comunicación con impresoras |
| `shared/` | Tipos compartidos y utilidades de generación de ZPL usadas por ambos lados |

La aplicación está diseñada para una red local confiable. El uso general y la impresión no requieren inicio de sesión; no expongas el backend directamente a Internet. Para conocer las rutas de API, almacenamiento, límites y despliegue, consulta [backend/README.md](./backend/README.md).
