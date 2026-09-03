import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { config, __dirname } from './config.js';

// IMPORTANTE: la base de datos vive en backend/data, UN NIVEL AFUERA de dist/.
// __dirname viene de config.ts, y config.ts siempre queda un solo nivel debajo
// de la raíz de backend/ (ya sea backend/src en dev, o backend/dist en
// producción, porque esbuild lo inlinea todo en un único dist/server.js).
// Por eso un solo '..' llega a backend/ tanto en dev como en producción.

const relativePath = config.NODE_ENV === 'production' ? '../../' : '../';

const dataDir = path.resolve(__dirname, relativePath, 'data');
mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, config.DB_FILENAME);

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initializeDatabase() {
	console.log(`Base de datos SQLite lista en: [${dbPath}]`);

	try {
		db.exec(`
      CREATE TABLE IF NOT EXISTS plantillas (
        id TEXT PRIMARY KEY,
        NAME TEXT NOT NULL,
        profile_id TEXT NOT NULL,
        elements TEXT NOT NULL,
        public INTEGER NOT NULL DEFAULT 0,
        state TEXT NOT NULL DEFAULT 'pendiente',
        by_request TEXT,
        create_on TEXT NOT NULL,
        update_on TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sesiones (
        token TEXT PRIMARY KEY,
        create_on TEXT NOT NULL,
        expires_on TEXT NOT NULL
      );
    `,
		);
	} catch (error) {
		console.error(`[DB] Error inicializando base de datos: ${error}`);
		throw error;
	}
}
