import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import http from 'http';
import path from 'path';
import cookieParser from 'cookie-parser';

import { config, __dirname } from './src/config.js';
import { initializeDatabase, closeDatabase } from './src/db.js';
import { syncPrinterProfiles } from './src/printerProfileRepo.js';


// Import Middlewares
import { attachAdminStatus } from './src/middleware/auth.middleware.js';

// Import Routes
import authApiRoutes from './src/api/auth.route.js';
import printerApiRoutes from './src/api/printer.route.js';
import printApiRoutes from './src/api/print.route.js';
import templatesApiRoutes from './src/api/templates.route.js';
import stagingApiRoutes from './src/api/staging.route.js';

initializeDatabase();
syncPrinterProfiles();

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
app.use('/health', (_, res) => {
	res.status(200).json({ status: 'ACTIVE' });
});

app.use('/api/auth', authApiRoutes);
app.use('/api/templates', templatesApiRoutes);
app.use('/api/staging', stagingApiRoutes);
app.use('/api/print', printApiRoutes);
app.use('/api/printers', printerApiRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
	console.error('Error no manejado:', err);

	if (res.headersSent) {
		return;
	}

	res.status(500).json({ message: 'Error interno del servidor' });
});

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

// Cierre ordenado: el backend corre como servicio de Windows (spec §10),
// y cada redeploy/reinicio lo mata con SIGTERM. Sin este handler, la DB
// en modo WAL y las conexiones HTTP activas se cortan de golpe.
function shutdown(signal: string) {
	console.log(`\n${signal} recibido. Cerrando servidor ordenadamente...`);

	server.close((err) => {
		if (err) {
			console.error(`Error cerrando el servidor HTTP: ${err}`);
		} else {
			console.log('Servidor HTTP cerrado.');
		}

		closeDatabase();
		process.exit(err ? 1 : 0);
	});

	// Si algo se queda colgado (ej. una conexión HTTP que nunca cierra),
	// forzamos la salida después de un tiempo razonable en vez de que el
	// proceso quede zombie esperando indefinidamente.
	setTimeout(() => {
		console.error('Cierre forzado: el servidor no cerró a tiempo.');
		process.exit(1);
	}, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
