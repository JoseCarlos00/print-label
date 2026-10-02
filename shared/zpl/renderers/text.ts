import type { Font } from 'opentype.js';
import type { TextElement } from '../../types.js';
import { fontSizeMmToOpenType, renderText, type RenderTextOptions } from '../fonts/rasterizeText.js';
import { buildGraphicCommand, clipBitmapToLabel, type GraphicBitmap, rotateBitmap } from './graphic.js';
import { mmToDots, ZplValidationError } from '../units.js';

const TEXT_BLOCK_PADDING_MM = 0.5;

export interface CreateTextBitmapOptions {
	trimVerticalWhitespace?: boolean;
}

export function createTextBitmap(
	el: TextElement,
	dpi: number,
	font: Font,
	options: CreateTextBitmapOptions = {},
): GraphicBitmap {
	if (!el.content.trim()) {
		throw new ZplValidationError('El texto no puede estar vacío', el.id);
	}

	const fontSize = fontSizeMmToOpenType(font, el.fontSize, dpi);
	const wrapWidthDots = el.wrapWidth != null ? mmToDots(el.wrapWidth, dpi) : undefined;
	const lineSpacingDots = mmToDots(el.lineSpacing ?? 0, dpi);
	const align = el.textAlign != null ? el.textAlign : 'Left';

	const renderOptions: RenderTextOptions = {
		align,
		fit: 'none',
		lineSpacingDots,
		bold: el.bold,
	};

	if (wrapWidthDots != null) {
		renderOptions.wrapWidth = wrapWidthDots;
	}

	const result = renderText(font, el.content, fontSize, wrapWidthDots, renderOptions);

	if (!options.trimVerticalWhitespace) {
		return result.bitmap;
	}

	const trimmedBitmap = trimVerticalWhitespace(result.bitmap);
	return addVerticalPadding(trimmedBitmap, mmToDots(TEXT_BLOCK_PADDING_MM, dpi));
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

	const bitmap = createTextBitmap(el, dpi, font, { trimVerticalWhitespace: true });
	const rotatedBitmap = rotateBitmap(bitmap, el.rotation);

	const clipped = clipBitmapToLabel(rotatedBitmap, xDots, yDots, labelWidthDots, labelHeightDots);

	if (!clipped) return null;

	return buildGraphicCommand(clipped.bitmap, `^FO${clipped.xDots},${clipped.yDots}`);
}

function trimVerticalWhitespace(bitmap: GraphicBitmap): GraphicBitmap {
	const rowHasPixels = (y: number) => {
		for (let x = 0; x < bitmap.widthDots; x++) {
			const byteIndex = y * bitmap.bytesPerRow + Math.floor(x / 8);
			const bitIndex = 7 - (x % 8);

			if ((bitmap.data[byteIndex]! & (1 << bitIndex)) !== 0) {
				return true;
			}
		}

		return false;
	};

	let top = 0;

	while (top < bitmap.heightDots && !rowHasPixels(top)) {
		top++;
	}

	if (top === bitmap.heightDots) {
		return bitmap;
	}

	let bottom = bitmap.heightDots - 1;

	while (bottom > top && !rowHasPixels(bottom)) {
		bottom--;
	}

	if (top === 0 && bottom === bitmap.heightDots - 1) {
		return bitmap;
	}

	return {
		...bitmap,
		heightDots: bottom - top + 1,
		data: bitmap.data.slice(top * bitmap.bytesPerRow, (bottom + 1) * bitmap.bytesPerRow),
	};
}

function addVerticalPadding(bitmap: GraphicBitmap, paddingDots: number): GraphicBitmap {
	if (paddingDots <= 0) {
		return bitmap;
	}

	const heightDots = bitmap.heightDots + paddingDots * 2;
	const data = new Uint8Array(bitmap.bytesPerRow * heightDots);
	data.set(bitmap.data, bitmap.bytesPerRow * paddingDots);

	return {
		...bitmap,
		heightDots,
		data,
	};
}
