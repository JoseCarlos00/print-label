import type { LabelElement, PrinterProfile } from '../types.js';

import { mmToDots, type ZplTarget } from './units.js';

import { buildTextCommand } from './renderers/text.js';
import { buildBarcodeCommand } from './renderers/barcode.js';
import { buildQrCommand } from './renderers/qr.js';


// ──────────────────────────────────────────────────────────────────────────
// Generador principal
// ──────────────────────────────────────────────────────────────────────────

/**
 * Convierte el diseño de una etiqueta (LabelElement[]) al ZPL completo
 * (^XA...^XZ) listo para enviar por socket TCP a la impresora (spec §8).
 *
 * Lanza ZplValidationError si algún elemento no es válido para su tipo
 * (ej. contenido de barcode que no cumple el formato del symbology).
 * El caller debe capturar ese error específico y devolver 400.
 */
export function generateZpl(elements: LabelElement[], profile: PrinterProfile, target: ZplTarget): string {
	const widthDots = mmToDots(profile.widthMm, profile.dpi);
	const heightDots = mmToDots(profile.heightMm, profile.dpi);

	const commands = elements.map((el) => {
		switch (el.type) {
			case 'text':
				return buildTextCommand(el, profile.dpi);
			case 'barcode':
				return buildBarcodeCommand(el, profile.dpi);
			case 'qr':
				return buildQrCommand(el, profile.dpi, target);
		}
	});

	return [
		'^XA',
		'^CI28', // UTF-8: necesario para acentos y ñ en textos/QRs en español
		`^PW${widthDots}`,
		`^LL${heightDots}`,
		'^LH0,0',
		...commands,
		'^XZ',
	].join('\n');
}


export { ZplValidationError, type ZplTarget } from './units.js';
export { getQrSizeDots } from './renderers/qr.js';

