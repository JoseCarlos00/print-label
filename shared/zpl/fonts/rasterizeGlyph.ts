import type { Glyph } from 'opentype.js';
import type { GraphicBitmap } from '../renderers/graphic.js';

interface Point {
	x: number;
	y: number;
}

/**
 * Recibir un glifo de OpenType y convertirlo en píxeles dentro de un GraphicBitmap.
 */
export function renderGlyph(glyph: Glyph, widthDots: number, heightDots: number): GraphicBitmap {
	const bitmap: GraphicBitmap = {
		widthDots,
		heightDots,
		bytesPerRow: Math.ceil(widthDots / 8),
		data: new Uint8Array(Math.ceil(widthDots / 8) * heightDots),
	};

	const path = glyph.getPath(0, 0, 100);

	const points = pathToPoints(path);

	if (points.length === 0) {
		return bitmap;
	}

	const normalized = normalizePoints(points, widthDots, heightDots);

	fillPolygon(bitmap, normalized);

	return bitmap;
}

function quadraticBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
	const mt = 1 - t;

	return {
		x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,

		y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
	};
}

function pathToPoints(path: opentype.Path): Point[] {
	const points: Point[] = [];

	let current: Point = {
		x: 0,
		y: 0,
	};

	for (const command of path.commands) {
		switch (command.type) {
			case 'M':
				current = {
					x: command.x,
					y: command.y,
				};

				points.push(current);
				break;

			case 'L':
				current = {
					x: command.x,
					y: command.y,
				};

				points.push(current);
				break;

			case 'Q':
				for (let i = 1; i <= 20; i++) {
					const t = i / 20;

					points.push(
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

	return points;
}

function normalizePoints(points: Point[], width: number, height: number): Point[] {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	for (const point of points) {
		minX = Math.min(minX, point.x);
		minY = Math.min(minY, point.y);
		maxX = Math.max(maxX, point.x);
		maxY = Math.max(maxY, point.y);
	}

	const sourceWidth = maxX - minX;
	const sourceHeight = maxY - minY;

	const scale = Math.min((width - 2) / sourceWidth, (height - 2) / sourceHeight);

	return points.map((point) => ({
		x: (point.x - minX) * scale + 1,

		y: (point.y - minY) * scale + 1,
	}));
}

function setPixel(bitmap: GraphicBitmap, x: number, y: number): void {
	if (x < 0 || x >= bitmap.widthDots || y < 0 || y >= bitmap.heightDots) {
		return;
	}

	const byteIndex = y * bitmap.bytesPerRow + Math.floor(x / 8);

	const bitIndex = 7 - (x % 8);

	bitmap.data[byteIndex] |= 1 << bitIndex;
}

function fillPolygon(bitmap: GraphicBitmap, points: Point[]): void {
	for (let y = 0; y < bitmap.heightDots; y++) {
		const intersections: number[] = [];

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
