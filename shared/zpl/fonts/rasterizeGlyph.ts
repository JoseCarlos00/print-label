import type { BoundingBox, Glyph } from 'opentype.js';
import type { GraphicBitmap } from '../renderers/graphic.js';

interface Point {
	x: number;
	y: number;
}

/**
 * Recibir un glifo de OpenType y convertirlo en píxeles dentro de un GraphicBitmap.
 */
export function renderGlyph(glyph: Glyph, fontSize: number, unitsPerEm: number): GraphicBitmap {
	const scale = fontSize / unitsPerEm;

	const bbox = glyph.getBoundingBox();

	const widthDots = Math.ceil((bbox.x2 - bbox.x1) * scale);

	const heightDots = Math.ceil((bbox.y2 - bbox.y1) * scale);

	const bytesPerRow = Math.ceil(widthDots / 8);

	const bitmap: GraphicBitmap = {
		widthDots,
		heightDots,
		bytesPerRow,
		data: new Uint8Array(bytesPerRow * heightDots),
	};

	const path = glyph.getPath(0, 0, fontSize);

	const contours = pathToContours(path);

	if (contours.length === 0) {
		return bitmap;
	}

	const transformed = transformContours(contours, bbox, scale);

	fillContours(bitmap, transformed);

	return bitmap;
}

function quadraticBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
	const mt = 1 - t;

	return {
		x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,

		y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
	};
}

function setPixel(bitmap: GraphicBitmap, x: number, y: number): void {
	if (x < 0 || x >= bitmap.widthDots || y < 0 || y >= bitmap.heightDots) {
		return;
	}

	const byteIndex = y * bitmap.bytesPerRow + Math.floor(x / 8);

	const bitIndex = 7 - (x % 8);

	bitmap.data[byteIndex] |= 1 << bitIndex;
}


function pathToContours(path: opentype.Path): Point[][] {
	const contours: Point[][] = [];

	let currentContour: Point[] | null = null;
	let current: Point = {
		x: 0,
		y: 0,
	};

	for (const command of path.commands) {
		switch (command.type) {
			case 'M':
				currentContour = [];

				contours.push(currentContour);

				current = {
					x: command.x,
					y: command.y,
				};

				currentContour.push(current);
				break;

			case 'L':
				if (!currentContour) continue;

				current = {
					x: command.x,
					y: command.y,
				};

				currentContour.push(current);
				break;

			case 'Q':
				if (!currentContour) continue;

				for (let i = 1; i <= 20; i++) {
					const t = i / 20;

					currentContour.push(
						quadraticBezier(
							current,
							{
								x: command.x1,
								y: command.y1,
							},
							{
								x: command.x,
								y: command.y,
							},
							t,
						),
					);
				}

				current = {
					x: command.x,
					y: command.y,
				};

				break;
		}
	}

	return contours.filter((contour) => contour.length >= 3);
}

function fillContours(bitmap: GraphicBitmap, contours: Point[][]): void {
	for (let y = 0; y < bitmap.heightDots; y++) {
		const intersections: number[] = [];

		for (const points of contours) {
			for (let i = 0; i < points.length; i++) {
				const a = points[i];
				const b = points[(i + 1) % points.length];

				if (a.y === b.y) {
					continue;
				}

				const minY = Math.min(a.y, b.y);
				const maxY = Math.max(a.y, b.y);

				if (y < minY || y >= maxY) {
					continue;
				}

				const t = (y - a.y) / (b.y - a.y);

				const x = a.x + t * (b.x - a.x);

				intersections.push(x);
			}
		}

		intersections.sort((a, b) => a - b);

		for (let i = 0; i + 1 < intersections.length; i += 2) {
			const startX = Math.ceil(intersections[i]);

			const endX = Math.floor(intersections[i + 1]);

			for (let x = startX; x <= endX; x++) {
				setPixel(bitmap, x, y);
			}
		}
	}
}

function transformContours(contours: Point[][], bbox: BoundingBox, scale: number): Point[][] {
	return contours.map((contour) =>
		contour.map((point) => ({
			x: (point.x - bbox.x1) * scale,

			y: (point.y - bbox.y1) * scale,
		})),
	);
}

