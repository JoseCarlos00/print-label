import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

function getOptionalEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config = {
	PORT: parseInt(getOptionalEnvVar('PORT', '8001'), 10),
	NODE_ENV: getOptionalEnvVar('NODE_ENV', 'development'),
};



const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
