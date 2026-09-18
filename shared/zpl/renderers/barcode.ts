import type { BarcodeElement } from '../../types.js';
import type { Font } from 'opentype.js';
import { mmToDots } from '../units.js';
import { createCode128Bitmap } from '../barcode/code128.js';
import { buildGraphicCommand, clipBitmapToLabel, type GraphicBitmap, rotateBitmap } from './graphic.js';
import { createEan13Bitmap } from '../barcode/ean13.js';

// ──────────────────────────────────────────────────────────────────────────
// Código de barras
// ──────────────────────────────────────────────────────────────────────────

export function buildBarcodeCommand(
	el: BarcodeElement,
	dpi: number,
	font: Font,
	labelWidthDots: number,
	labelHeightDots: number,
): string | null {
	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);

	let bitmap: GraphicBitmap;

	switch (el.symbology) {
		case 'code128':
			bitmap = createCode128Bitmap(el, dpi, font);
			break;

		case 'ean13':
			bitmap = createEan13Bitmap(el, dpi, font);
			break;
	}

	const rotatedBitmap = rotateBitmap(bitmap, el.rotation);

	const clipped = clipBitmapToLabel(rotatedBitmap, xDots, yDots, labelWidthDots, labelHeightDots);

	if (!clipped) return null;

	return buildGraphicCommand(clipped.bitmap, `^FO${clipped.xDots},${clipped.yDots}`);
}
