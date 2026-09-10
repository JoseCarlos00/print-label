import Code128Generator from 'code-128-encoder';
import type { BarcodeElement, TextElement } from '../../types.js';
import { mmToDots } from '../units.js';
import type { GraphicBitmap } from '../renderers/graphic.js';
import { buildTextCommand } from '../renderers/text.js';

export interface Code128Encoded {
	bars: string;
	codes: number[];
	moduleCount: number;
}

export function encodeCode128(content: string): Code128Encoded {
	const encoder = new Code128Generator();

	const bars = encoder.encode(content, {
		output: 'bars',
	});

	const codes = encoder.encode(content, {
		output: 'codes',
	});

	return {
		bars,
		codes,
		moduleCount: bars.length,
	};
}

export function createCode128Bitmap(
	el: Pick<BarcodeElement, 'content' | 'width' | 'height'>,
	dpi: number,
): GraphicBitmap {
	const encoded = encodeCode128(el.content);

	const widthDots = mmToDots(el.width ?? 2, dpi);
	const heightDots = mmToDots(el.height, dpi);

	const bytesPerRow = Math.ceil(widthDots / 8);
	const data = new Uint8Array(bytesPerRow * heightDots);

	for (let moduleIndex = 0; moduleIndex < encoded.moduleCount; moduleIndex++) {
		if (encoded.bars[moduleIndex] !== '1') {
			continue;
		}

		const startX = Math.floor((moduleIndex * widthDots) / encoded.moduleCount);

		const endX = Math.floor(((moduleIndex + 1) * widthDots) / encoded.moduleCount);

		for (let x = startX; x < endX; x++) {
			const byteIndex = Math.floor(x / 8);
			const bitIndex = 7 - (x % 8);

			for (let y = 0; y < heightDots; y++) {
				const index = y * bytesPerRow + byteIndex;

				data[index] |= 1 << bitIndex;
			}
		}
	}

	return {
		widthDots,
		heightDots,
		bytesPerRow,
		data,
	};
}

export function buildCode128TextCommand(el: BarcodeElement, dpi: number): string | null {
	if (!el.showText) {
		return null;
	}

	const widthMm = el.width ?? 2;

	const syntheticText: TextElement = {
		id: `${el.id}__text`,
		x: el.x,
		y: el.y + el.height + 1,
		rotation: el.rotation,
		type: 'text',
		content: el.content,
		fontSize: 3,
		bold: false,
		wrapWidth: widthMm,
		textAlign: 'C',
	};

	return buildTextCommand(syntheticText, dpi);
}

export function calculateCode128Sizing() {}
