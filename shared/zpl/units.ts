import type { Rotation } from '../types.js';

export type ZplTarget = 'print' | 'preview';

/** Convierte mm a dots según el DPI del perfil. ZPL trabaja en dots (spec §8). */
export function mmToDots(mm: number, dpi: number): number {
	return Math.round(mm * (dpi / 25.4));
}

/**
 * Error de validación de contenido contra las reglas de un symbology de
 * código de barras específico (ej. EAN-13 exige 12-13 dígitos numéricos).
 * El controller que llame a generateZpl debe capturar este error y
 * devolver 400 al cliente — es un error de datos del usuario, no un
 * error de conexión con la impresora.
 */
export class ZplValidationError extends Error {
	constructor(
		message: string,
		public elementId?: string,
	) {
		super(message);
		this.name = 'ZplValidationError';
	}
}

export const ROTATION_MAP: Record<Rotation, string> = {
	0: 'N',
	90: 'R',
	180: 'I',
	270: 'B',
};


/**
 * Escapa el contenido de un campo ^FD para uso con ^FH activo.
 * ZPL interpreta '^' y '~' como prefijos de comando/control en CUALQUIER
 * parte del stream, incluso dentro de ^FD — sin este escape, un contenido
 * de usuario como "Precio ~10" o "Ref^123" rompería el ZPL generado.
 * Con ^FH antes de ^FD, una secuencia "_XX" (dos hex) se interpreta como
 * ese byte literal, así que también hay que escapar el propio '_'.
 */
export function escapeZplField(content: string): string {
	return content.replace(/[\^~_]/g, (char) => {
		const hex = char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
		return `_${hex}`;
	});
}
