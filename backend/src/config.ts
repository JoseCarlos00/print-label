import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

function getOptionalEnvVar(key: string, defaultValue: string): string {
	return process.env[key] || defaultValue;
}

function getRequiredEnvVar(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Falta la variable de entorno requerida: ${key}. Revisa tu archivo .env`);
	}
	return value;
}

export const config = {
	PORT: parseInt(getOptionalEnvVar('PORT', '8001'), 10),
	NODE_ENV: getOptionalEnvVar('NODE_ENV', 'development'),
	DB_FILENAME: getOptionalEnvVar('DB_FILENAME', 'label-printer.db'),

	// Credenciales del único usuario admin. Sin valores por defecto a propósito:
	// el servidor debe fallar al arrancar si no están configuradas.
	// Se comparan con timingSafeEqual (ver utils/credentials.ts), no con hash:
	// es un solo usuario fijo en red interna, no expuesta a internet (spec §6).
	ADMIN_USER: getRequiredEnvVar('ADMIN_USER'),
	ADMIN_PASSWORD: getRequiredEnvVar('ADMIN_PASSWORD'),

	SESSION_COOKIE_NAME: 'session_token',
	SESSION_DURATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 días
};

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
