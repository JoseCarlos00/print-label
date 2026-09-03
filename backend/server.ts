import express from 'express';
import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';

import { config, __dirname } from './src/config.js'; 
import { initializeDatabase } from './src/db.js'

initializeDatabase()

// Import Middlewares
import { attachAdminStatus } from './src/middleware/auth.middleware.js';

// Import Routes
import authApiRoutes from './src/api/auth.route.js';


// Definir la ruta de estáticos una sola vez para evitar inconsistencias
// const relativePath = config.NODE_ENV === 'production' ? '../..' : '..';
const frontendPath = path.join(__dirname, '/', 'public');

/**
 * Configura y devuelve una instancia de la aplicación Express.
 * @returns {express.Application} La aplicación Express configurada.
 */
function configureApp(): express.Application {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
	app.use(attachAdminStatus);
  app.use(express.static(frontendPath));

  return app;
}

const app = configureApp();

/**
 * Configura y devuelve un servidor HTTP con la aplicación Express.
 * @param {express.Application} app La aplicación Express.
 * @returns {http.Server} El servidor HTTP configurado.
 */
const server = http.createServer(app);


// Routes
app.use('/health', ((_, res) => {
  res.status(200).json({ status: 'ACTIVE' });
}));

app.use('/api/auth', authApiRoutes);

async function startServer() {
  try {
   
    server.listen(config.PORT, () => {
      console.log(`Servidor Express escuchando en el puerto ${config.PORT}`);
    });
  } catch (error) {
    console.error(`Error fatal al iniciar el servidor: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

// Inicia el servidor
startServer();
