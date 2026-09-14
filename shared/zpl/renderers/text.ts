import type { Font } from 'opentype.js';
import type { TextAlignZebra, TextElement } from '../../types.js';
import { fontSizeMmToOpenType, renderText } from '../fonts/rasterizeText.js';
import { buildGraphicCommand, type GraphicBitmap, rotateBitmap } from './graphic.js';
import { mmToDots } from '../units.js';

const TEXT_ALIGN_MAP: Record<TextAlignZebra, 'Left' | 'Center' | 'Right' | 'Justify'> = {
	L: 'Left',
	C: 'Center',
	R: 'Right',
	J: 'Justify',
};

export function createTextBitmap(el: TextElement, dpi: number, font: Font): GraphicBitmap {
	const fontSize = fontSizeMmToOpenType(font, el.fontSize, dpi);

	const wrapWidthDots = el.wrapWidth != null ? mmToDots(el.wrapWidth, dpi) : undefined;

	const lineSpacingDots = mmToDots(el.lineSpacing ?? 0, dpi);

	const align = el.textAlign != null ? TEXT_ALIGN_MAP[el.textAlign] : 'Left';

	const result = renderText(font, el.content, fontSize, wrapWidthDots, {
		align,
		fit: 'none',
		wrapWidth: wrapWidthDots,
		lineSpacingDots,
	});

	return result.bitmap;
}

export function buildTextCommand(el: TextElement, dpi: number, font: Font): string {
	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);

	const bitmap = createTextBitmap(el, dpi, font);

	const rotatedBitmap = rotateBitmap(bitmap, el.rotation);

	return buildGraphicCommand(rotatedBitmap, `^FO${xDots},${yDots}`);
}
