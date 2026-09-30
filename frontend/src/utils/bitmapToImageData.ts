import type { GraphicBitmap } from 'shared/zpl';

export function bitmapToImageData(
	ctx: CanvasRenderingContext2D,
	bitmap: GraphicBitmap,
	transparentBackground = false,
): ImageData {
	const imageData = ctx.createImageData(bitmap.widthDots, bitmap.heightDots);

	const pixels = imageData.data;

	for (let y = 0; y < bitmap.heightDots; y++) {
		const sourceRowOffset = y * bitmap.bytesPerRow;
		const targetRowOffset = y * bitmap.widthDots * 4;

		for (let byteX = 0; byteX < bitmap.bytesPerRow; byteX++) {
			const byte = bitmap.data[sourceRowOffset + byteX];

			for (let bit = 0; bit < 8; bit++) {
				const x = byteX * 8 + bit;

				if (x >= bitmap.widthDots) {
					break;
				}

				const isBlack = (byte & (0x80 >> bit)) !== 0;
				const value = isBlack ? 0 : 255;
				const pixelIndex = targetRowOffset + x * 4;

				pixels[pixelIndex] = value;
				pixels[pixelIndex + 1] = value;
				pixels[pixelIndex + 2] = value;
				pixels[pixelIndex + 3] = isBlack || !transparentBackground ? 255 : 0;
			}
		}
	}

	return imageData;
}
