import type { LabelElement, PrinterProfile } from './types.js';

/**
 * Convierte mm a dots según el DPI del perfil de impresora.
 * ZPL trabaja en dots, nunca en mm directamente (spec §8).
 */
function mmToDots(mm: number, dpi: number): number {
	return Math.round(mm * (dpi / 25.4));
}

/**
 * STUB TEMPORAL: genera un ZPL mínimo válido (^XA...^XZ) con el tamaño de
 * etiqueta correcto, pero SIN convertir todavía cada LabelElement a su
 * comando real (^A texto, ^BC barcode, ^BQ qr).
 *
 * TODO: reemplazar cuando tengamos las plantillas de referencia ya
 * probadas contra hardware real (ver README §8). Por ahora imprime
 * un placeholder legible para poder probar el flujo TCP de punta a punta.
 */
export function generateZpl(elements: LabelElement[], profile: PrinterProfile): string {
	const widthDots = mmToDots(profile.widthMm, profile.dpi);
	const heightDots = mmToDots(profile.heightMm, profile.dpi);

	const commands = [
		'^XA',
		`^PW${widthDots}`,
		`^LL${heightDots}`,
		`^FO10,10^A0N,20,20^FD[ZPL pendiente: ${elements.length} elemento(s)]^FS`,
		'^XZ',
	];

	return commands.join('\n');
}
