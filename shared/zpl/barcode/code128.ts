import Code128Generator from 'code-128-encoder';
import type {OutputMode} from 'code-128-encoder';
import type { BarcodeElement } from '../../types.js';
import { barsToBitmap, drawBitmap, type GraphicBitmap } from '../renderers/graphic.js';
import { fontSizeMmToOpenType, renderText } from '../fonts/rasterizeText.js';
import type { Font } from 'opentype.js';
import { escapeZplField, mmToDots, resolveBarcodeTextSize } from '../units.js';

export interface Code128Encoded {
	bars: string;
	codes: number[];
	moduleCount: number;
}

export function encodeCode128(content: string): Code128Encoded {
	const encoder = new Code128Generator();

	const bars = encoder.encode(content, {
		output: 'bars' as OutputMode.BARS,
	});

	const codes = encoder.encode(content, {
		output: 'codes' as OutputMode.CODES,
	});

	return {
		bars,
		codes,
		moduleCount: bars.length,
	};
}

export function createCode128Bitmap(
	el: Pick<BarcodeElement, 'content' | 'width' | 'height' | 'showText'>,
	dpi: number,
	font: Font,
): GraphicBitmap {
	const content = escapeZplField(el.content);
	const encoded = encodeCode128(content);

	const widthDots = mmToDots(el.width, dpi);
	const heightDots = mmToDots(el.height, dpi);

	const textSizeMm = resolveBarcodeTextSize(el);

	const textHeightDots = mmToDots(textSizeMm, dpi);

	const barHeightDots = el.showText ? heightDots - textHeightDots : heightDots;

	if (barHeightDots <= 0) {
		throw new Error('Code 128 height is too small for barcode and text');
	}

	const bitmap: GraphicBitmap = {
		widthDots,
		heightDots,
		bytesPerRow: Math.ceil(widthDots / 8),
		data: new Uint8Array(Math.ceil(widthDots / 8) * heightDots),
	};

	// 1. Barras
	const barsBitmap = barsToBitmap(encoded.bars, widthDots, barHeightDots);

	drawBitmap(bitmap, barsBitmap, 0, 0);

	// 2. Texto
	if (el.showText) {
		const fontSize = fontSizeMmToOpenType(font, textSizeMm, dpi);
		const textBitmap = renderText(font, content, fontSize, widthDots, { align: 'Center', fit: 'compress' });
		
		drawBitmap(bitmap, textBitmap.bitmap, 0, barHeightDots);
	}

	return bitmap;
}
