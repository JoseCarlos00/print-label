import { Ean13 } from '@ashaffah/barcodes';
import type { BarcodeElement } from '../../types'
import { barsToBitmap, type GraphicBitmap } from '../renderers/graphic'
import { mmToDots } from '../units'

export function encodeEan13(content: string): string {
	const result = Ean13.encode(content);

	if (result.data.kind !== 'linear') {
		throw new Error('EAN-13 encoder did not return a linear barcode');
	}

	return result.data.bars
		.map((bar) => (bar ? '1' : '0'))
		.join('');
}

export function createEan13Bitmap(el: Pick<BarcodeElement, 'content' | 'width' | 'height'>, dpi: number,): GraphicBitmap {
  const bars = encodeEan13(el.content);

  return barsToBitmap(
    bars,
    mmToDots(el.width, dpi),
    mmToDots(el.height, dpi),
  );
}
