import Code128Generator from 'code-128-encoder';
import type { BarcodeElement } from '../../types.js';
import { escapeZplField, mmToDots, ROTATION_MAP } from '../units.js';
import { barsToBitmap, type GraphicBitmap } from '../renderers/graphic.js';

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

export function createCode128Bitmap(el: Pick<BarcodeElement, 'content' | 'width' | 'height'>, dpi: number): GraphicBitmap {
  const encoded = encodeCode128(el.content);

  return barsToBitmap(
    encoded.bars,
    mmToDots(el.width, dpi),
    mmToDots(el.height, dpi),
  );
}

export function buildCode128TextCommand(el: BarcodeElement, dpi: number): string | null {
	if (!el.showText) return null;

	const gap0 = 1;
	const gap90 = 4;
	const gap180 = 4;
	const gap270 = 1;

	let textX = el.x;
	let textY = el.y;

	const widthDots = mmToDots(el.width, dpi);

	switch (el.rotation) {
		case 0:
			textY = el.y + el.height + gap0;
			break;

		case 90:
			textX = el.x - gap90;
			textY = el.y;
			break;

		case 180:
			textY = el.y - gap180;
			break;

		case 270:
			textX = el.x + el.height + gap270;
			textY = el.y;
			break;
	}

	const xDots = mmToDots(textX, dpi);
	const yDots = mmToDots(textY, dpi);
	const heightDots = mmToDots(3, dpi);
	const orientation = ROTATION_MAP[el.rotation];
	const content = escapeZplField(el.content);

	return [
		`^FO${xDots},${yDots}`,
		`^FB${widthDots},1,0,C,0`,
		`^A0${orientation},${heightDots},${heightDots}`,
		`^FH^FD${content}^FS`,
	].join('\n');
}
