// Borra sesiones de admin para forzar el cierre de sesión.
//
//   npm run db:clear-sessions --workspace backend            → borra TODAS
//   npm run db:clear-sessions --workspace backend -- --expired → solo las vencidas
//   node scripts/clear-sessions.js [--expired] [ruta/a/archivo.db]
//
// Es seguro ejecutarlo con el servidor corriendo (la base usa modo WAL).

import 'dotenv/config';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const args = process.argv.slice(2);
const onlyExpired = args.includes('--expired');
const customPath = args.find((arg) => !arg.startsWith('--'));

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const dbFilename = process.env.DB_FILENAME || 'label-printer.db';
const dbPath = customPath ? path.resolve(customPath) : path.resolve(scriptDir, '..', 'data', dbFilename);

if (!existsSync(dbPath)) {
	console.error(`No se encontró la base de datos en: ${dbPath}`);
	console.error('Pasa la ruta como argumento: node scripts/clear-sessions.js <ruta/al/archivo.db>');
	process.exit(1);
}

const db = new Database(dbPath);

try {
	const result = onlyExpired
		? db.prepare('DELETE FROM sessions WHERE expires_on < ?').run(new Date().toISOString())
		: db.prepare('DELETE FROM sessions').run();

	console.log(`${result.changes} sesión(es) borrada(s) ${onlyExpired ? '(vencidas) ' : ''}en ${dbPath}`);
} finally {
	db.close();
}
