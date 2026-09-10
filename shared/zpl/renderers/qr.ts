import QRCode from 'qrcode/lib/core/qrcode.js';

import type { QrElement, QrErrorCorrection, TextElement } from '../../types.js';
import { mmToDots, type ZplTarget } from '../units.js';
import { buildTextCommand } from './text.js'

// ──────────────────────────────────────────────────────────────────────────
// QR
// ──────────────────────────────────────────────────────────────────────────
const QR_ERROR_CORRECTION_DEFAULT: QrErrorCorrection = 'M';
const LABEL_MARGIN_MM = 1;

function buildQrLabelCommand(el: QrElement, dpi: number, qrWidthMm: number, qrHeightMm: number): string | null {
	const label = el.label;
	if (!label?.visible) return null;

	const content = label.customText?.trim() || el.content;
	if (!content) return null;

	// NOTA: el label se calcula asumiendo rotation: 0 — igual que el resto
	// del posicionamiento del QR, la interacción con rotación distinta de 0°
	// no está validada (ver TODO ya existente sobre orientación del QR en
	// buildQrCommand). Si rotás un QR con label, el label puede no quedar
	// donde visualmente se espera.
	const labelY =
		label.position === 'top' ? el.y - LABEL_MARGIN_MM - label.fontSize : el.y + qrHeightMm + LABEL_MARGIN_MM;

	// Reusamos buildTextCommand construyendo un TextElement sintético en vez
	// de reimplementar el manejo de ^FB/^A0 acá — wrapWidth = ancho del QR
	// centra el texto exactamente debajo/encima de él.
	const syntheticLabel: TextElement = {
		id: `${el.id}__label`,
		x: el.x,
		y: Math.max(0, labelY),
		rotation: 0,
		type: 'text',
		content,
		fontSize: label.fontSize,
		bold: false,
		wrapWidth: qrWidthMm,
		textAlign: 'C',
	};

	return buildTextCommand(syntheticLabel, dpi);
}

export function getQrModuleCount(content: string, errorCorrection: QrErrorCorrection = 'M'): number {
	return QRCode.create(content, { errorCorrectionLevel: errorCorrection }).modules.size;
}

interface QrBitmap {
	widthDots: number;
	heightDots: number;
	bytesPerRow: number;
	data: Uint8Array;
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

function createQrBitmap(matrix: boolean[][], requestedSizeDots: number): QrBitmap {
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

function bytesToHex(data: Uint8Array): string {
	let result = '';

	for (const byte of data) {
		result += byte.toString(16).padStart(2, '0').toUpperCase();
	}

	return result;
}

function buildGraphicCommand(bitmap: QrBitmap, position: string): string {
	const totalBytes = bitmap.data.length;
	const hexData = bytesToHex(bitmap.data);

	return [`${position}`, `^GFA,${totalBytes},${totalBytes},${bitmap.bytesPerRow},${hexData}`].join('\n');
}

export function buildQrCommand(el: QrElement, dpi: number, target: ZplTarget = 'print'): string {
	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);

	// const orientation = ROTATION_MAP[el.rotation];

	const errorCorrection = el.errorCorrection ?? QR_ERROR_CORRECTION_DEFAULT;

	const matrix = getQrMatrix(el.content, errorCorrection);

	const requestedSizeDots = mmToDots(el.size, dpi);

	const bitmap = createQrBitmap(matrix, requestedSizeDots);

	const qrWidthMm = bitmap.widthDots / (dpi / 25.4);
	const qrHeightMm = bitmap.heightDots / (dpi / 25.4);
	const labelCommand = buildQrLabelCommand(el, dpi, qrWidthMm, qrHeightMm);

	/*
	 * Preview:
	 * Labelary se comporta mejor con ^FO.
	 *
	 * * Print:
	 * Conservamos ^FT porque físicamente
	 * corrige el desplazamiento de ^FO.
	 */
	const qrCommand =
		target === 'preview'
			? buildGraphicCommand(bitmap, `^FO${xDots},${yDots}`)
			: buildGraphicCommand(bitmap, `^FT${xDots},${yDots + bitmap.heightDots}`);

	return labelCommand ? [qrCommand, labelCommand].join('\n') : qrCommand;
}
