import type { Font } from 'opentype.js';
import type { TextElement } from '../../types.js';
import { fontSizeMmToOpenType, renderText } from '../fonts/rasterizeText.js';
import { buildGraphicCommand, clipBitmapToLabel, type GraphicBitmap, rotateBitmap } from './graphic.js';
import { mmToDots } from '../units.js';

export function createTextBitmap(el: TextElement, dpi: number, font: Font): GraphicBitmap {
	const fontSize = fontSizeMmToOpenType(font, el.fontSize, dpi);

	const wrapWidthDots = el.wrapWidth != null ? mmToDots(el.wrapWidth, dpi) : undefined;

	const lineSpacingDots = mmToDots(el.lineSpacing ?? 0, dpi);

	const align = el.textAlign != null ? el.textAlign : 'Left';

	const result = renderText(font, el.content, fontSize, wrapWidthDots, {
		align,
		fit: 'none',
		wrapWidth: wrapWidthDots,
		lineSpacingDots,
		bold: el.bold,
	});

	return result.bitmap;
}

export function buildTextCommand(
	el: TextElement,
	dpi: number,
	font: Font,
	labelWidthDots: number,
	labelHeightDots: number,
): string | null {
	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);

	const bitmap = createTextBitmap(el, dpi, font);
	const rotatedBitmap = rotateBitmap(bitmap, el.rotation);

	const clipped = clipBitmapToLabel(rotatedBitmap, xDots, yDots, labelWidthDots, labelHeightDots);
	if (!clipped) return null;

	return buildGraphicCommand(clipped.bitmap, `^FO${clipped.xDots},${clipped.yDots}`);
}
