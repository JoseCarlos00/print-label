// Genera dist/server.js como un único archivo autocontenido.
// - "shared" se inlinea (es TS fuente sin compilar, esbuild lo procesa directo).
// - Las dependencias reales de npm (express, dotenv...) quedan como "external":
//   en la máquina destino solo hace falta copiar dist/ + package.json y correr `npm install`

import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pkgPath = fileURLToPath(new URL('./package.json', import.meta.url));
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

// Todo lo que esté en "dependencies" (express, dotenv, etc.) se deja externo.
// "shared" NO está aquí como paquete real de npm, así que aunque aparezca en
// dependencies, esbuild igual lo resuelve por filesystem (via node_modules
// symlink de workspaces) y lo inlinea porque apunta a un archivo .ts, no a
// un paquete publicado — así que lo excluimos explícitamente de "external".
const external = Object.keys(pkg.dependencies ?? {}).filter((name) => name !== 'shared');

await build({
	entryPoints: ['server.ts'],
	outfile: 'dist/server.js',
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node20',
	external,
	logLevel: 'info',
});

console.log('Build completo: dist/server.js');
