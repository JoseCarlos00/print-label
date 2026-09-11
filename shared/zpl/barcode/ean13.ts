import { Ean13 } from '@ashaffah/barcodes';
import type { BarcodeElement } from '../../types';
import type { GraphicBitmap } from '../renderers/graphic';
import { mmToDots } from '../units';

export function encodeEan13(content: string): string {
	const result = Ean13.encode(content);

	if (result.data.kind !== 'linear') {
		throw new Error('EAN-13 encoder did not return a linear barcode');
	}

	return result.data.bars
		.map((bar) => (bar ? '1' : '0'))
		.join('');
}

export function createEan13Bitmap(el: Pick<BarcodeElement, 'content' | 'width' | 'height'>, dpi: number): GraphicBitmap {
	const bars = encodeEan13(el.content);

	const widthDots = mmToDots(el.width, dpi);
	const heightDots = mmToDots(el.height, dpi);

	const bytesPerRow = Math.ceil(widthDots / 8);
	const data = new Uint8Array(bytesPerRow * heightDots);

	const moduleCount = 95;

	// Las barras normales terminan antes que las guardas.
	const normalHeight = Math.floor(heightDots * 0.88);

	function setPixel(x: number, y: number): void {
		const byteIndex = y * bytesPerRow + Math.floor(x / 8);

		const bitIndex = 7 - (x % 8);

		data[byteIndex] |= 1 << bitIndex;
	}

	for (let moduleIndex = 0; moduleIndex < moduleCount; moduleIndex++) {
		if (bars[moduleIndex] !== '1') continue;

		const startX = Math.floor((moduleIndex * widthDots) / moduleCount);

		const endX = Math.floor(((moduleIndex + 1) * widthDots) / moduleCount);

		const isGuard = moduleIndex <= 2 || (moduleIndex >= 45 && moduleIndex <= 49) || moduleIndex >= 92;

		const barHeight = isGuard ? heightDots : normalHeight;

		for (let x = startX; x < endX; x++) {
			for (let y = 0; y < barHeight; y++) {
				setPixel(x, y);
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
