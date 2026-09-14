import type { Font } from 'opentype.js';
import type { GraphicBitmap } from '../renderers/graphic.js';
import { mmToDots } from '../units.js';
import type { TextAlignCss } from '../../types.js';


export interface RenderTextOptions {
	align?: TextAlignCss;
	fit?: 'none' | 'compress';
}

export interface TextBitmap {
	bitmap: GraphicBitmap;
	naturalWidthDots: number;
	naturalHeightDots: number;
	widthDots: number;
	heightDots: number;
	overflows: boolean;
}

interface Point {
	x: number;
	y: number;
}

export function renderText(
	font: Font,
	text: string,
	fontSize: number,
	widthDots: number,
	options: RenderTextOptions = {},
): TextBitmap {
	const scale = fontSize / font.unitsPerEm;
	const { align, fit } = options;

	const lineHeightDots = Math.ceil((font.ascender - font.descender) * scale);

	const baseline = Math.ceil(font.ascender * scale);

	let naturalWidth = 0;

	for (const char of text) {
		const glyph = font.charToGlyph(char);

		naturalWidth += glyph.advanceWidth! * scale;
	}

	const naturalWidthDots = Math.ceil(getTextWidth(font, text, scale));

	const naturalHeightDots = lineHeightDots;


	const isCompressing =
		fit === 'compress' &&
		naturalWidthDots > widthDots;

	const horizontalScale = isCompressing
		? widthDots / naturalWidthDots
		: 1;

	const bitmapWidthDots =
		fit === 'compress'
			? widthDots
			: Math.max(widthDots, naturalWidthDots);


	const bitmap: GraphicBitmap = {
		widthDots: bitmapWidthDots,
		heightDots: lineHeightDots,
		bytesPerRow: Math.ceil(bitmapWidthDots / 8),
		data: new Uint8Array(Math.ceil(bitmapWidthDots / 8) * lineHeightDots),
	};

	let offsetX = 0;

	if (naturalWidthDots < widthDots) {
		switch (align) {
			case 'Left':
				offsetX = 0;
				break;

			case 'Center':
				offsetX = Math.floor((widthDots - naturalWidthDots) / 2);
				break;

			case 'Right':
				offsetX = widthDots - naturalWidthDots;
				break;
		}
	}

	let cursorX = offsetX;
	const contours: Point[][] = [];

	for (let i = 0; i < text.length; i++) {
		const glyph = font.charToGlyph(text[i]);

		if (i > 0) {
			const previousGlyph = font.charToGlyph(text[i - 1]);
			const kerning = font.getKerningValue(previousGlyph, glyph);
			cursorX += kerning * scale;
		}

		const path = glyph.getPath(cursorX, baseline, fontSize);
		contours.push(...pathToContours(path));

		cursorX += glyph.advanceWidth! * scale;
	}

	const transformedContours = isCompressing
		? transformContours(contours, horizontalScale, 1)
		: contours;

	fillContours(bitmap, transformedContours);

	const overflows = naturalWidthDots > widthDots;

	return {
		bitmap,
		naturalWidthDots,
		naturalHeightDots,
		widthDots,
		heightDots: lineHeightDots,
		overflows,
	};
}

function quadraticBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
	const mt = 1 - t;

	return {
		x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,

		y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
	};
}

export function setPixel(bitmap: GraphicBitmap, x: number, y: number): void {
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

function getTextWidth(font: Font, text: string, scale: number): number {
	let width = 0;

	for (let i = 0; i < text.length; i++) {
		const glyph = font.charToGlyph(text[i]);

		if (i > 0) {
			const previousGlyph = font.charToGlyph(text[i - 1]);

			const kerning = font.getKerningValue(previousGlyph, glyph);

			width += kerning * scale;
		}

		width += glyph.advanceWidth! * scale;
	}

	return width;
}

function transformContours(contours: Point[][], scaleX: number, scaleY: number): Point[][] {
	return contours.map((contour) =>
		contour.map((point) => ({
			x: point.x * scaleX,
			y: point.y * scaleY,
		})),
	);
}


export function fontSizeMmToOpenType(font: Font, fontSizeMm: number, dpi: number): number {
	const heightDots = mmToDots(fontSizeMm, dpi);

	return (heightDots * font.unitsPerEm) / (font.ascender - font.descender);
}

export function openTypeFontSizeToMm(font: Font, fontSize: number, dpi: number): number {
	const lineHeightDots = (fontSize * (font.ascender - font.descender)) / font.unitsPerEm;

	return (lineHeightDots * 25.4) / dpi;
}
