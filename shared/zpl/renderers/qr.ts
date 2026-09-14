import QRCode from 'qrcode/lib/core/qrcode.js';

import type { QrElement, QrErrorCorrection, QrLabel } from '../../types.js';
import { mmToDots } from '../units.js';
import { buildGraphicCommand, drawBitmap, rotateBitmap, type GraphicBitmap } from './graphic.js';
import type { Font } from 'opentype.js'
import { fontSizeMmToOpenType, renderText } from '../fonts/rasterizeText.js';

// ──────────────────────────────────────────────────────────────────────────
// QR
// ──────────────────────────────────────────────────────────────────────────
const QR_ERROR_CORRECTION_DEFAULT: QrErrorCorrection = 'M';

export function getQrModuleCount(content: string, errorCorrection: QrErrorCorrection = 'M'): number {
	return QRCode.create(content, { errorCorrectionLevel: errorCorrection }).modules.size;
}

function createQrLabelBitmap(
	qrBitmap: GraphicBitmap,
	label: QrLabel,
	labelText: string,
	dpi: number,
	font: Font,
): GraphicBitmap {
	const labelWidthDots = label.wrapWidth != null ? mmToDots(label.wrapWidth, dpi) : qrBitmap.widthDots;

	const textFontSize = fontSizeMmToOpenType(font, label.fontSize, dpi);

	const textBitmap = renderText(
		font,
		labelText,
		textFontSize,
		labelWidthDots,
		{
			align: 'Center',
			fit: label.wrapWidth != null
				? 'compress'
				: 'none',
			wrapWidth:
				label.wrapWidth != null
					? labelWidthDots
					: undefined,
		},
	);


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

	const qrX = Math.floor((widthDots - qrBitmap.widthDots) / 2);

	const textX = Math.floor((widthDots - textBitmap.widthDots) / 2);

	drawBitmap(bitmap, qrBitmap, qrX, 0);

	drawBitmap(bitmap, textBitmap.bitmap, textX, qrBitmap.heightDots + gapDots);

	return bitmap;
}

function getQrMatrix(content: string, errorCorrection: QrErrorCorrection): boolean[][] {
	const qr = QRCode.create(content || ' ', {
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
		for (let x = 0; x < moduleCount; x++) {
			if (!matrix[y][x]) {
				continue;
			}

			const startX = x * moduleSizeDots;
			const startY = y * moduleSizeDots;

			for (let dy = 0; dy < moduleSizeDots; dy++) {
				const row = startY + dy;

				for (let dx = 0; dx < moduleSizeDots; dx++) {
					const pixelX = startX + dx;

					const byteIndex = row * bytesPerRow + Math.floor(pixelX / 8);

					const bitIndex = 7 - (pixelX % 8);

					data[byteIndex] |= 1 << bitIndex;
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
	const errorCorrection = el.errorCorrection ?? QR_ERROR_CORRECTION_DEFAULT;

	const matrix = getQrMatrix(el.content, errorCorrection);

	const requestedSizeDots = mmToDots(el.size, dpi);

	const qrBitmap = createQrGraphicBitmap(matrix, requestedSizeDots);

	if (!el.label?.visible) {
		return qrBitmap;
	}

	const labelText = el.label.customText ?? el.content;

	return createQrLabelBitmap(qrBitmap, el.label, labelText, dpi, font);
}

export function buildQrCommand(el: QrElement, dpi: number, font: Font): string {

	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);

	const bitmap = createQrBitmap(el, dpi, font);

	const rotatedBitmap = rotateBitmap(bitmap, el.rotation);

	return buildGraphicCommand(rotatedBitmap, `^FO${xDots},${yDots}`);
}
