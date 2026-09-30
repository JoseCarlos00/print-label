/// <reference path="./qrcode-core.d.ts" />

import QRCode from 'qrcode/lib/core/qrcode.js';

import type { Font } from 'opentype.js';
import type { QrElement, QrErrorCorrection, TextElement } from '../../types.js';
import { mmToDots, ZplValidationError } from '../units.js';
import { buildGraphicCommand, clipBitmapToLabel, drawBitmap, rotateBitmap, type GraphicBitmap } from './graphic.js';
import { createTextBitmap } from '../renderers/text.js';

// ──────────────────────────────────────────────────────────────────────────
// QR
// ──────────────────────────────────────────────────────────────────────────

/** Selects redundancy by Unicode character count to balance damage tolerance and QR density. */
function resolveQrErrorCorrection(content: string): QrErrorCorrection {
	const characterCount = Array.from(content).length;

	if (characterCount <= 70) return 'H';
	if (characterCount <= 150) return 'Q';
	return 'M';
}

export function getQrModuleCount(content: string): number {
	return QRCode.create(content, {
		errorCorrectionLevel: resolveQrErrorCorrection(content),
	}).modules.size;
}

function createQrLabelBitmap(qrBitmap: GraphicBitmap, textBitmap: GraphicBitmap, dpi: number): GraphicBitmap {
	const gapDots = mmToDots(1, dpi);

	const widthDots = Math.max(qrBitmap.widthDots, textBitmap.widthDots);

	const heightDots = qrBitmap.heightDots + gapDots + textBitmap.heightDots;

	const bytesPerRow = Math.ceil(widthDots / 8);

	const bitmap: GraphicBitmap = {
		widthDots,
		heightDots,
		bytesPerRow,
		data: new Uint8Array(bytesPerRow * heightDots),
	};

	const qrX = 0;

	const textX = Math.floor((widthDots - textBitmap.widthDots) / 2);

	drawBitmap(bitmap, qrBitmap, qrX, 0);

	drawBitmap(bitmap, textBitmap, textX, qrBitmap.heightDots + gapDots);

	return bitmap;
}

function getQrMatrix(content: string, errorCorrection: QrErrorCorrection): boolean[][] {
	const qr = QRCode.create(content, {
		errorCorrectionLevel: errorCorrection,
	});

	const size = qr.modules.size;
	const data = qr.modules.data;

	const matrix: boolean[][] = [];

	for (let y = 0; y < size; y++) {
		const row: boolean[] = [];

		for (let x = 0; x < size; x++) {
			row.push(data[y * size + x] === 1);
		}

		matrix.push(row);
	}

	return matrix;
}

function createQrGraphicBitmap(matrix: boolean[][], requestedSizeDots: number): GraphicBitmap {
	const moduleCount = matrix.length;

	/*
	 * Queremos que el QR sea lo más cercano posible
	 * al tamaño solicitado, pero sin deformar los módulos.
	 *
	 * Cada módulo debe tener el mismo número de dots.
	 */
	const moduleSizeDots = Math.max(1, Math.floor(requestedSizeDots / moduleCount));

	const widthDots = moduleCount * moduleSizeDots;
	const heightDots = widthDots;

	const bytesPerRow = Math.ceil(widthDots / 8);
	const data = new Uint8Array(bytesPerRow * heightDots);

	for (let y = 0; y < moduleCount; y++) {
		const row = matrix[y]!;

		for (let x = 0; x < moduleCount; x++) {
			if (!row[x]!) {
				continue;
			}

			const startX = x * moduleSizeDots;
			const startY = y * moduleSizeDots;

			for (let dy = 0; dy < moduleSizeDots; dy++) {
				const rowIndex = startY + dy;

				for (let dx = 0; dx < moduleSizeDots; dx++) {
					const pixelX = startX + dx;

					const byteIndex = rowIndex * bytesPerRow + Math.floor(pixelX / 8);

					const bitIndex = 7 - (pixelX % 8);

					data[byteIndex]! |= 1 << bitIndex;
				}
			}
		}
	}

	return {
		widthDots,
		heightDots,
		bytesPerRow,
		data,
	};
}

export function createQrBitmap(el: QrElement, dpi: number, font: Font): GraphicBitmap {
	if (!el.content.trim()) {
		throw new ZplValidationError('El código QR no puede estar vacío', el.id);
	}

	const matrix = getQrMatrix(el.content, resolveQrErrorCorrection(el.content));

	const requestedSizeDots = mmToDots(el.size, dpi);

	const qrBitmap = createQrGraphicBitmap(matrix, requestedSizeDots);

	if (!el.label.visible) {
		return qrBitmap;
	}

	const labelText = el.label.customText ?? el.content;

	const textElement: TextElement = {
		id: `${el.id}-label`,
		type: 'text',
		x: 0,
		y: 0,
		rotation: 0,
		content: labelText,
		fontSize: el.label.fontSize,
		bold: false,
		textAlign: 'Left',
		lineSpacing: 0,
		...(el.label.wrapWidth != null ? { wrapWidth: el.label.wrapWidth } : {}),
	};

	const textBitmap = createTextBitmap(textElement, dpi, font);

	return createQrLabelBitmap(qrBitmap, textBitmap, dpi);
}

export function buildQrCommand(
	el: QrElement,
	dpi: number,
	font: Font,
	labelWidthDots: number,
	labelHeightDots: number,
): string | null {
	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);

	const bitmap = createQrBitmap(el, dpi, font);
	const rotatedBitmap = rotateBitmap(bitmap, el.rotation);

	const clipped = clipBitmapToLabel(rotatedBitmap, xDots, yDots, labelWidthDots, labelHeightDots);

	if (!clipped) return null;

	return buildGraphicCommand(clipped.bitmap, `^FO${clipped.xDots},${clipped.yDots}`);
}
