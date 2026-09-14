import type { BarcodeElement, Symbology } from '../../types.js';
import type { Font } from 'opentype.js'
import { mmToDots, ZplValidationError } from '../units.js'
import { createCode128Bitmap } from '../barcode/code128.js';
import { buildGraphicCommand, GraphicBitmap, rotateBitmap } from './graphic.js';
import { createEan13Bitmap } from '../barcode/ean13.js'

// ──────────────────────────────────────────────────────────────────────────
// Código de barras
// ──────────────────────────────────────────────────────────────────────────

const BARCODE_LABELS: Record<Symbology, string> = {
	code128: 'Code 128',
	ean13: 'EAN-13',
};

function validateBarcodeContent(el: BarcodeElement): void {
	const { symbology, content } = el;

	switch (symbology) {
		case 'ean13':
			if (!/^\d{12,13}$/.test(content)) {
				throw new ZplValidationError(
					`El código ${BARCODE_LABELS.ean13} debe tener 12 o 13 dígitos numéricos (recibido: "${content}")`,
					el.id,
				);
			}
			break;

		case 'code128':
			if (content.trim().length === 0) {
				throw new ZplValidationError(`El código ${BARCODE_LABELS.code128} no puede estar vacío`, el.id);
			}
			break;
	}
}

export function buildBarcodeCommand(el: BarcodeElement, dpi: number, font: Font): string {
	validateBarcodeContent(el);

	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);

	let bitmap: GraphicBitmap;
	let barcodeCommand: string;
	let rotatedBitmap: GraphicBitmap;

	switch (el.symbology) {
		case 'code128':
			bitmap = createCode128Bitmap(el, dpi, font);
			rotatedBitmap = rotateBitmap(bitmap, el.rotation);

			barcodeCommand = buildGraphicCommand(rotatedBitmap, `^FO${xDots},${yDots}`);
			break;

		case 'ean13':
			bitmap = createEan13Bitmap(el, dpi, font);
			rotatedBitmap = rotateBitmap(bitmap, el.rotation);

			barcodeCommand = buildGraphicCommand(rotatedBitmap, `^FO${xDots},${yDots}`);
			break;
	}
	
	return barcodeCommand;
}
