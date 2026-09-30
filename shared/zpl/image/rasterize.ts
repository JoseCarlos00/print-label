import type { GraphicBitmap } from '../renderers/graphic.js';

/** Lado máximo (px) de una imagen importada. La etiqueta más grande son ~812 px a 203 dpi. */
export const MAX_IMAGE_DIMENSION = 1000;

/** Píxeles RGBA de 8 bits, sin premultiplicar. Agnóstico al entorno (navegador o Node). */
export interface RgbaImage {
	width: number;
	height: number;
	data: Uint8Array | Uint8ClampedArray;
}

/** Compone sobre blanco (la transparencia no debe salir negra) y pasa a escala de grises. */
function toGrayOnWhite(source: RgbaImage): Float32Array {
	const { width, height, data } = source;
	const gray = new Float32Array(width * height);

	for (let i = 0; i < gray.length; i++) {
		const offset = i * 4;
		const alpha = data[offset + 3]! / 255;
		const luminance = 0.299 * data[offset]! + 0.587 * data[offset + 1]! + 0.114 * data[offset + 2]!;

		gray[i] = luminance * alpha + 255 * (1 - alpha);
	}

	return gray;
}

/** Reducción por promedio de área. Se hace ANTES del dithering para evitar moiré. */
function resizeGray(
	gray: Float32Array,
	sourceWidth: number,
	sourceHeight: number,
	targetWidth: number,
	targetHeight: number,
): Float32Array {
	if (sourceWidth === targetWidth && sourceHeight === targetHeight) {
		return gray;
	}

	const xStart = new Int32Array(targetWidth);
	const xEnd = new Int32Array(targetWidth);

	for (let tx = 0; tx < targetWidth; tx++) {
		const start = Math.floor((tx * sourceWidth) / targetWidth);
		xStart[tx] = start;
		xEnd[tx] = Math.min(sourceWidth, Math.max(start + 1, Math.ceil(((tx + 1) * sourceWidth) / targetWidth)));
	}

	const output = new Float32Array(targetWidth * targetHeight);

	for (let ty = 0; ty < targetHeight; ty++) {
		const y0 = Math.floor((ty * sourceHeight) / targetHeight);
		const y1 = Math.min(sourceHeight, Math.max(y0 + 1, Math.ceil(((ty + 1) * sourceHeight) / targetHeight)));

		for (let tx = 0; tx < targetWidth; tx++) {
			const x0 = xStart[tx]!;
			const x1 = xEnd[tx]!;

			let sum = 0;

			for (let y = y0; y < y1; y++) {
				const rowOffset = y * sourceWidth;

				for (let x = x0; x < x1; x++) {
					sum += gray[rowOffset + x]!;
				}
			}

			output[ty * targetWidth + tx] = sum / ((x1 - x0) * (y1 - y0));
		}
	}

	return output;
}

/** Floyd-Steinberg in-place: deja cada valor en 0 (negro) o 255 (blanco). */
function ditherFloydSteinberg(buffer: Float32Array, width: number, height: number): void {
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = y * width + x;
			const oldValue = buffer[index]!;
			const newValue = oldValue < 128 ? 0 : 255;
			const error = oldValue - newValue;

			buffer[index] = newValue;

			const hasRight = x + 1 < width;
			const hasBottom = y + 1 < height;

			if (hasRight) {
				buffer[index + 1] = buffer[index + 1]! + (error * 7) / 16;
			}

			if (hasBottom) {
				if (x > 0) {
					buffer[index + width - 1] = buffer[index + width - 1]! + (error * 3) / 16;
				}

				buffer[index + width] = buffer[index + width]! + (error * 5) / 16;

				if (hasRight) {
					buffer[index + width + 1] = buffer[index + width + 1]! + error / 16;
				}
			}
		}
	}
}

export function rasterizeImage(source: RgbaImage, widthDots: number, heightDots: number): GraphicBitmap {
	const gray = toGrayOnWhite(source);
	const buffer = resizeGray(gray, source.width, source.height, widthDots, heightDots);

	ditherFloydSteinberg(buffer, widthDots, heightDots);

	const bytesPerRow = Math.ceil(widthDots / 8);
	const data = new Uint8Array(bytesPerRow * heightDots);

	for (let y = 0; y < heightDots; y++) {
		for (let x = 0; x < widthDots; x++) {
			if (buffer[y * widthDots + x] !== 0) continue;

			const byteIndex = y * bytesPerRow + Math.floor(x / 8);
			data[byteIndex]! |= 1 << (7 - (x % 8));
		}
	}

	return { widthDots, heightDots, bytesPerRow, data };
}
