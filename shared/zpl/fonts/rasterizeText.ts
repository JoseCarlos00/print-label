import type { Font } from 'opentype.js';
import type { GraphicBitmap } from '../renderers/graphic.js';
import { mmToDots } from '../units.js';
import type { TextAlignCss } from '../../types.js';


export interface RenderTextOptions {
	align?: TextAlignCss;
	fit?: 'none' | 'compress';
	wrapWidth?: number;
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
	const { align, fit, wrapWidth } = options;

	const lineHeightDots = Math.ceil((font.ascender - font.descender) * scale);

	const baseline = Math.ceil(font.ascender * scale);

	/*
	 * 1. Separar las líneas explícitas.
	 *
	 * split() conserva las líneas vacías:
	 *
	 * "Hola\n\nMundo"
	 * ->
	 * ["Hola", "", "Mundo"]
	 */
	const explicitLines = text.split(/\r?\n/);

	/*
	 * 2. Aplicar wrapping a cada línea.
	 */
	const lines: string[] = [];

	for (const line of explicitLines) {
		if (wrapWidth != null) {
			lines.push(...wrapLine(font, line, fontSize, wrapWidth));
		} else {
			lines.push(line);
		}
	}

	/*
	 * 3. Calcular el ancho natural de cada línea.
	 */
	const lineWidthsDots = lines.map((line) => Math.ceil(getTextWidth(font, line, scale)));

	const naturalWidthDots = Math.max(0, ...lineWidthsDots);

	const naturalHeightDots = lines.length * lineHeightDots;

	/*
	 * 4. Determinar si alguna línea excede el ancho disponible.
	 */
	const overflows = lineWidthsDots.some((lineWidth) => lineWidth > widthDots);

	/*
	 * 5. El bitmap final:
	 *
	 * - Con compress: siempre usamos widthDots.
	 * - Sin compress: permitimos que el bitmap crezca
	 *   para contener el texto natural.
	 */
	const isCompressing = fit === 'compress';

	const bitmapWidthDots = isCompressing ? widthDots : Math.max(widthDots, naturalWidthDots);

	const bitmap: GraphicBitmap = {
		widthDots: bitmapWidthDots,
		heightDots: naturalHeightDots,
		bytesPerRow: Math.ceil(bitmapWidthDots / 8),
		data: new Uint8Array(Math.ceil(bitmapWidthDots / 8) * naturalHeightDots),
	};

	/*
	 * 6. Renderizar cada línea.
	 */
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const line = lines[lineIndex];
		const lineNaturalWidth = lineWidthsDots[lineIndex];

		const shouldCompress = fit === 'compress' && lineNaturalWidth > widthDots;

		const horizontalScale = shouldCompress ? widthDots / lineNaturalWidth : 1;

		/*
		 * Alinear solamente cuando la línea cabe
		 * sin compresión.
		 */
		let offsetX = 0;

		if (!shouldCompress && lineNaturalWidth < widthDots) {
			switch (align) {
				case 'Left':
					offsetX = 0;
					break;

				case 'Center':
					offsetX = Math.floor((widthDots - lineNaturalWidth) / 2);
					break;

				case 'Right':
					offsetX = widthDots - lineNaturalWidth;
					break;
			}
		}

		const contours: Point[][] = [];

		let cursorX = 0;

		for (let i = 0; i < line.length; i++) {
			const glyph = font.charToGlyph(line[i]);

			if (i > 0) {
				const previousGlyph = font.charToGlyph(line[i - 1]);

				const kerning = font.getKerningValue(previousGlyph, glyph);

				cursorX += kerning * scale;
			}

			const path = glyph.getPath(cursorX, baseline, fontSize);

			contours.push(...pathToContours(path));

			cursorX += glyph.advanceWidth! * scale;
		}

		/*
		 * Primero aplicamos la compresión horizontal
		 * sobre toda la línea.
		 */
		let transformedContours = contours;

		if (shouldCompress) {
			transformedContours = transformContours(contours, horizontalScale, 1);
		}

		/*
		 * Después desplazamos la línea a su posición
		 * horizontal.
		 */
		if (offsetX !== 0) {
			transformedContours = transformContours(transformedContours, 1, 1, offsetX, lineIndex * lineHeightDots);
		} else if (lineIndex !== 0) {
			transformedContours = transformContours(transformedContours, 1, 1, 0, lineIndex * lineHeightDots);
		}

		fillContours(bitmap, transformedContours);
	}

	return {
		bitmap,
		naturalWidthDots,
		naturalHeightDots,
		widthDots: bitmapWidthDots,
		heightDots: naturalHeightDots,
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

function transformContours(contours: Point[][], scaleX: number, scaleY: number, offsetX = 0, offsetY = 0): Point[][] {
	return contours.map((contour) =>
		contour.map((point) => ({
			x: point.x * scaleX + offsetX,
			y: point.y * scaleY + offsetY,
		})),
	);
}

function wrapLine(font: Font, text: string, fontSize: number, maxWidthDots: number): string[] {
	if (text.length === 0) {
		return [''];
	}

	const scale = fontSize / font.unitsPerEm;
	const words = text.trim().split(/\s+/);

	if (words.length === 0) {
		return [''];
	}

	const lines: string[] = [];
	let currentLine = '';

	for (const word of words) {
		const candidate = currentLine ? `${currentLine} ${word}` : word;

		const candidateWidth = Math.ceil(getTextWidth(font, candidate, scale));

		if (currentLine && candidateWidth > maxWidthDots) {
			lines.push(currentLine);
			currentLine = word;
		} else {
			currentLine = candidate;
		}
	}

	if (currentLine) {
		lines.push(currentLine);
	}

	return lines;
}


export function fontSizeMmToOpenType(font: Font, fontSizeMm: number, dpi: number): number {
	const heightDots = mmToDots(fontSizeMm, dpi);

	return (heightDots * font.unitsPerEm) / (font.ascender - font.descender);
}

export function openTypeFontSizeToMm(font: Font, fontSize: number, dpi: number): number {
	const lineHeightDots = (fontSize * (font.ascender - font.descender)) / font.unitsPerEm;

	return (lineHeightDots * 25.4) / dpi;
}
