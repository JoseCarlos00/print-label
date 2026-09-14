import type { LabelElement, PrinterProfile } from '../types.js';

import { mmToDots } from './units.js';

import { buildTextCommand } from './renderers/text.js';
import { buildBarcodeCommand } from './renderers/barcode.js';
import { buildQrCommand } from './renderers/qr.js';
import type { Font } from 'opentype.js'

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
export function generateZpl(elements: LabelElement[], profile: PrinterProfile, font: Font): string {
	const widthDots = mmToDots(profile.widthMm, profile.dpi);
	const heightDots = mmToDots(profile.heightMm, profile.dpi);

	const commands = elements
		.map((el) => {
			switch (el.type) {
				case 'text':
					return buildTextCommand(el, profile.dpi, font, widthDots, heightDots);
				case 'barcode':
					return buildBarcodeCommand(el, profile.dpi, font, widthDots, heightDots);
				case 'qr':
					return buildQrCommand(el, profile.dpi, font, widthDots, heightDots);
			}
		})
		.filter((command): command is string => command !== null);

	return [
		'^XA',
		'^CI28',
		`^PW${widthDots}`,
		`^LL${heightDots}`,
		'^LH0,0',
		...commands,
		'^XZ'
	].join('\n');
}

export type { GraphicBitmap } from './renderers/graphic.js';
export type { Font } from 'opentype.js';

export { ZplValidationError } from './units.js';
export { getQrModuleCount } from './renderers/qr.js';

export { createCode128Bitmap } from './barcode/code128.js';
export { createEan13Bitmap } from './barcode/ean13.js';
export { createQrBitmap } from './renderers/qr.js';
export { createTextBitmap } from './renderers/text.js';
