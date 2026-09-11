import type { LabelElement, PrinterProfile } from '../types.js';

import { mmToDots } from './units.js';

import { buildTextCommand } from './renderers/text.js';
import { buildBarcodeCommand } from './renderers/barcode.js';
import { buildQrCommand } from './renderers/qr.js';

import { loadSwiss721 } from "./fonts/loadFont.node.js";
import type { GraphicBitmap } from './renderers/graphic.js'
import { fontSizeMmToOpenType, renderText } from './fonts/rasterizeText.js'
import type { Font } from 'opentype.js'

const font = await loadSwiss721();

function printBitmap(bitmap: GraphicBitmap): void {
	for (let y = 0; y < bitmap.heightDots; y++) {
		let row = '';

		for (let x = 0; x < bitmap.widthDots; x++) {
			const byteIndex = y * bitmap.bytesPerRow + Math.floor(x / 8);

			const bitIndex = 7 - (x % 8);

			const isBlack = (bitmap.data[byteIndex] & (1 << bitIndex)) !== 0;

			row += isBlack ? '██' : '  ';
		}

		console.log(row);
	}
}


const fontSizeMm = 10;
const dpi = 203;

const openTypeFontSize = fontSizeMmToOpenType(font, fontSizeMm, dpi);

const result = renderText(
  font,
  'AVAVAVAVAVAVAV',
  openTypeFontSize,
  500,
  'L',
);

console.log({
	naturalWidthDots: result.naturalWidthDots,
	widthDots: result.widthDots,
	heightDots: result.heightDots,
	overflows: result.overflows,
});

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
export function generateZpl(elements: LabelElement[], profile: PrinterProfile): string {
	const widthDots = mmToDots(profile.widthMm, profile.dpi);
	const heightDots = mmToDots(profile.heightMm, profile.dpi);

	const commands = elements.map((el) => {
		switch (el.type) {
			case 'text':
				return buildTextCommand(el, profile.dpi);
			case 'barcode':
				return buildBarcodeCommand(el, profile.dpi);
			case 'qr':
				return buildQrCommand(el, profile.dpi);
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

export type { GraphicBitmap } from './renderers/graphic.js';

export { ZplValidationError } from './units.js';
export { getQrModuleCount } from './renderers/qr.js';

export { createCode128Bitmap } from './barcode/code128.js';
export { createEan13Bitmap } from './barcode/ean13.js';
