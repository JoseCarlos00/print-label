import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [react(), tailwindcss(), babel({ presets: [reactCompilerPreset()] })],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
		},
		server: {
			proxy: {
				'/api': env.VITE_BACKEND_URL ?? 'http://192.168.15.189:8001',
			},
		},
	};
});
