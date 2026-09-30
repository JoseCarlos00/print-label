import type { ImageElement } from '../../types.js';
import { mmToDots, ZplValidationError } from '../units.js';
import { rasterizeImage, type RgbaImage } from '../image/rasterize.js';
import { buildGraphicCommand, clipBitmapToLabel, rotateBitmap, type GraphicBitmap } from './graphic.js';

const MAX_TARGET_PIXELS = 6_000_000;

export function createImageGraphicBitmap(
	el: Pick<ImageElement, 'id' | 'width' | 'height'>,
	dpi: number,
	source: RgbaImage,
): GraphicBitmap {
	if (!Number.isFinite(el.width) || !Number.isFinite(el.height) || el.width <= 0 || el.height <= 0) {
		throw new ZplValidationError('Las dimensiones de la imagen no son válidas', el.id);
	}

	if (source.width <= 0 || source.height <= 0 || source.data.length !== source.width * source.height * 4) {
		throw new ZplValidationError('La imagen decodificada no es válida', el.id);
	}

	const widthDots = Math.max(1, mmToDots(el.width, dpi));
	const heightDots = Math.max(1, mmToDots(el.height, dpi));

	if (widthDots * heightDots > MAX_TARGET_PIXELS) {
		throw new ZplValidationError('La imagen es demasiado grande para imprimirse', el.id);
	}

	return rasterizeImage(source, widthDots, heightDots);
}

export function buildImageCommand(
	el: ImageElement,
	dpi: number,
	source: RgbaImage,
	labelWidthDots: number,
	labelHeightDots: number,
): string | null {
	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);

	const bitmap = createImageGraphicBitmap(el, dpi, source);
	const rotatedBitmap = rotateBitmap(bitmap, el.rotation);

	const clipped = clipBitmapToLabel(rotatedBitmap, xDots, yDots, labelWidthDots, labelHeightDots);

	if (!clipped) return null;

	return buildGraphicCommand(clipped.bitmap, `^FO${clipped.xDots},${clipped.yDots}`);
}
