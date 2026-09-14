import type { Font } from 'opentype.js';
import { setPixel, type GraphicBitmap } from '../renderers/graphic.js';
import { mmToDots } from '../units.js';
import type { TextAlignCss } from '../../types.js';


export interface RenderTextOptions {
	align?: TextAlignCss;
	fit?: 'none' | 'compress';
	wrapWidth?: number;
	lineSpacingDots?: number;
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

interface RenderLine {
	text: string;
	paragraphIndex: number;
	isLastLineOfParagraph: boolean;
}

export function renderText(
	font: Font,
	text: string,
	fontSize: number,
	widthDots?: number,
	options: RenderTextOptions = {},
): TextBitmap {
	const scale = fontSize / font.unitsPerEm;
	const { align, fit, wrapWidth } = options;

	const lineHeightDots = Math.ceil((font.ascender - font.descender) * scale);

	const lineSpacingDots = options.lineSpacingDots ?? 0;
	const lineAdvanceDots = lineHeightDots + lineSpacingDots;

	const baseline = Math.ceil(font.ascender * scale);

	const explicitLines = text.split(/\r?\n/);

	const lines: RenderLine[] = [];

	for (let paragraphIndex = 0; paragraphIndex < explicitLines.length; paragraphIndex++) {
		const explicitLine = explicitLines[paragraphIndex];

		if (wrapWidth != null) {
			const wrappedLines = wrapLine(font, explicitLine, fontSize, wrapWidth);

			for (let i = 0; i < wrappedLines.length; i++) {
				lines.push({
					text: wrappedLines[i],
					paragraphIndex,
					isLastLineOfParagraph: i === wrappedLines.length - 1,
				});
			}
		} else {
			lines.push({
				text: explicitLine,
				paragraphIndex,
				isLastLineOfParagraph: true,
			});
		}
	}

	const lineWidthsDots = lines.map((line) => Math.ceil(getTextWidth(font, line.text, scale)));

	const naturalWidthDots = Math.max(0, ...lineWidthsDots);

	const naturalHeightDots =
		lines.length === 0
			? 0
			: lines.length * lineHeightDots +
				(lines.length - 1) * lineSpacingDots;

	const availableWidthDots = widthDots ?? naturalWidthDots;

	const overflows = widthDots != null && lineWidthsDots.some((lineWidth) => lineWidth > widthDots);

	const isCompressing = fit === 'compress';

	if (isCompressing && widthDots == null) {
		throw new Error('fit="compress" requires widthDots');
	}

	const bitmapWidthDots = isCompressing ? widthDots! : availableWidthDots;

	const bitmap: GraphicBitmap = {
		widthDots: bitmapWidthDots,
		heightDots: naturalHeightDots,
		bytesPerRow: Math.ceil(bitmapWidthDots / 8),
		data: new Uint8Array(Math.ceil(bitmapWidthDots / 8) * naturalHeightDots),
	};

	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const renderLine = lines[lineIndex];
		const line = renderLine.text;
		const lineNaturalWidth = lineWidthsDots[lineIndex];

		const shouldCompress = fit === 'compress' && lineNaturalWidth > widthDots!;

		const horizontalScale = shouldCompress ? widthDots! / lineNaturalWidth : 1;

		const shouldJustify =
			align === 'Justify' && !renderLine.isLastLineOfParagraph && lineNaturalWidth < availableWidthDots;

		let extraSpace = 0;

		if (shouldJustify) {
			const spaceCount = [...line].filter((char) => char === ' ').length;

			if (spaceCount > 0) {
				extraSpace = (availableWidthDots - lineNaturalWidth) / spaceCount;
			}
		}

		let offsetX = 0;

		if (!shouldCompress && !shouldJustify) {
			if (lineNaturalWidth < availableWidthDots) {
				switch (align) {
					case 'Left':
						offsetX = 0;
						break;

					case 'Center':
						offsetX = Math.floor((availableWidthDots - lineNaturalWidth) / 2);
						break;

					case 'Right':
						offsetX = availableWidthDots - lineNaturalWidth;
						break;
				}
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

			if (shouldJustify && line[i] === ' ') {
				cursorX += extraSpace;
			}
		}

		let transformedContours = contours;

		if (shouldCompress) {
			transformedContours = transformContours(contours, horizontalScale, 1);
		}

		if (offsetX !== 0) {
			transformedContours = transformContours(transformedContours, 1, 1, offsetX, lineIndex * lineAdvanceDots);
		} else if (lineIndex !== 0) {
			transformedContours = transformContours(transformedContours, 1, 1, 0, lineIndex * lineAdvanceDots);
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

	const trimmedText = text.trim();

	if (trimmedText.length === 0) {
		return [''];
	}

	const scale = fontSize / font.unitsPerEm;

	const words = trimmedText.split(' ');

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

	return lines.length > 0 ? lines : [''];
}


export function fontSizeMmToOpenType(font: Font, fontSizeMm: number, dpi: number): number {
	const heightDots = mmToDots(fontSizeMm, dpi);

	return (heightDots * font.unitsPerEm) / (font.ascender - font.descender);
}

export function openTypeFontSizeToMm(font: Font, fontSize: number, dpi: number): number {
	const lineHeightDots = (fontSize * (font.ascender - font.descender)) / font.unitsPerEm;

	return (lineHeightDots * 25.4) / dpi;
}
