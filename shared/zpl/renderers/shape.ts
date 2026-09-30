import type { ShapeElement } from '../../types.js';
import { mmToDots, ZplValidationError } from '../units.js';
import { buildGraphicCommand, clipBitmapToLabel, rotateBitmap, setPixel, type GraphicBitmap } from './graphic.js';

const MAX_SHAPE_PIXELS = 6_000_000;

function isInsideRoundedRectangle(x: number, y: number, width: number, height: number, radius: number): boolean {
	if (x < 0 || y < 0 || x >= width || y >= height) return false;
	if (radius <= 0) return true;

	const centerX = Math.min(Math.max(x, radius), width - radius);
	const centerY = Math.min(Math.max(y, radius), height - radius);
	const dx = x - centerX;
	const dy = y - centerY;

	return dx * dx + dy * dy <= radius * radius;
}

export function createShapeBitmap(
	element: Pick<ShapeElement, 'id' | 'shape' | 'width' | 'height' | 'strokeWidth' | 'filled' | 'radius'>,
	dpi: number,
): GraphicBitmap {
	if (
		!Number.isFinite(element.width) ||
		!Number.isFinite(element.height) ||
		!Number.isFinite(element.strokeWidth) ||
		!Number.isFinite(element.radius ?? 0) ||
		element.width <= 0 ||
		element.height <= 0 ||
		element.strokeWidth < 0 ||
		(element.radius ?? 0) < 0
	) {
		throw new ZplValidationError('Las dimensiones de la forma no son válidas', element.id);
	}

	const widthDots = Math.max(1, mmToDots(element.width, dpi));
	const heightDots = Math.max(1, mmToDots(element.height, dpi));

	if (widthDots * heightDots > MAX_SHAPE_PIXELS) {
		throw new ZplValidationError('La forma es demasiado grande para imprimirse', element.id);
	}

	const bytesPerRow = Math.ceil(widthDots / 8);
	const bitmap: GraphicBitmap = {
		widthDots,
		heightDots,
		bytesPerRow,
		data: new Uint8Array(bytesPerRow * heightDots),
	};

	const strokeDots = Math.max(1, mmToDots(element.strokeWidth, dpi));
	const radiusDots = Math.min(
		Math.max(0, mmToDots(element.radius ?? 0, dpi)),
		widthDots / 2,
		heightDots / 2,
	);

	for (let y = 0; y < heightDots; y++) {
		for (let x = 0; x < widthDots; x++) {
			const centerX = x + 0.5;
			const centerY = y + 0.5;
			let isBlack = false;

			switch (element.shape) {
				case 'line':
					isBlack = Math.abs(centerY - heightDots / 2) < strokeDots / 2;
					break;

				case 'rectangle': {
					const inOuter = isInsideRoundedRectangle(centerX, centerY, widthDots, heightDots, radiusDots);
					if (element.filled) {
						isBlack = inOuter;
					} else if (inOuter) {
						const innerWidth = widthDots - strokeDots * 2;
						const innerHeight = heightDots - strokeDots * 2;
						const inInner =
							innerWidth > 0 &&
							innerHeight > 0 &&
							isInsideRoundedRectangle(
								centerX - strokeDots,
								centerY - strokeDots,
								innerWidth,
								innerHeight,
								Math.max(0, radiusDots - strokeDots),
							);
						isBlack = !inInner;
					}
					break;
				}

				case 'ellipse': {
					const radiusX = widthDots / 2;
					const radiusY = heightDots / 2;
					const dx = (centerX - radiusX) / radiusX;
					const dy = (centerY - radiusY) / radiusY;
					const outer = dx * dx + dy * dy;

					if (element.filled) {
						isBlack = outer <= 1;
					} else if (outer <= 1) {
						const innerRadiusX = radiusX - strokeDots;
						const innerRadiusY = radiusY - strokeDots;
						const inner =
							innerRadiusX > 0 && innerRadiusY > 0
								? ((centerX - radiusX) / innerRadiusX) ** 2 +
									((centerY - radiusY) / innerRadiusY) ** 2
								: Number.POSITIVE_INFINITY;
						isBlack = inner >= 1;
					}
					break;
				}
			}

			if (isBlack) setPixel(bitmap, x, y);
		}
	}

	return bitmap;
}

export function buildShapeCommand(
	element: ShapeElement,
	dpi: number,
	labelWidthDots: number,
	labelHeightDots: number,
): string | null {
	const xDots = mmToDots(element.x, dpi);
	const yDots = mmToDots(element.y, dpi);
	const bitmap = createShapeBitmap(element, dpi);
	const rotatedBitmap = rotateBitmap(bitmap, element.rotation);
	const clipped = clipBitmapToLabel(rotatedBitmap, xDots, yDots, labelWidthDots, labelHeightDots);

	if (!clipped) return null;

	return buildGraphicCommand(clipped.bitmap, `^FO${clipped.xDots},${clipped.yDots}`);
}
