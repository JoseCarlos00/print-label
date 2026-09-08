import QRCode from 'qrcode/lib/core/qrcode.js';

import type { QrElement, QrErrorCorrection } from '../../types.js';
import { mmToDots, ROTATION_MAP, type ZplTarget } from '../units.js';

// ──────────────────────────────────────────────────────────────────────────
// QR
// ──────────────────────────────────────────────────────────────────────────

export function getQrModuleCount(content: string, errorCorrection: QrErrorCorrection = 'M'): number {
	return QRCode.create(content, { errorCorrectionLevel: errorCorrection }).modules.size;
}

export function getQrSizeDots(element: QrElement): number {
	const errorCorrection = element.errorCorrection ?? 'M';

	const moduleCount = getQrModuleCount(element.content || ' ', errorCorrection);

	return moduleCount * element.size;
}

const QR_ERROR_CORRECTION_DEFAULT: QrErrorCorrection = 'M';


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

function buildGraphicCommand(bitmap: QrBitmap, xDots: number, yDots: number): string {
	const totalBytes = bitmap.data.length;
	const hexData = bytesToHex(bitmap.data);

	return [`^FO${xDots},${yDots}`, `^GFA,${totalBytes},${totalBytes},${bitmap.bytesPerRow},${hexData}`].join('\n');
}

export function buildQrCommand(el: QrElement, dpi: number, target: ZplTarget = 'print'): string {
	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);

	const orientation = ROTATION_MAP[el.rotation];

	const errorCorrection = el.errorCorrection ?? QR_ERROR_CORRECTION_DEFAULT;

	const matrix = getQrMatrix(el.content, errorCorrection);

	const requestedSizeDots = mmToDots(el.size, dpi);

	const bitmap = createQrBitmap(matrix, requestedSizeDots);

	/*
	 * Preview:
	 * Labelary se comporta mejor con ^FO.
	 */
	if (target === 'preview') {
		return buildGraphicCommand(bitmap, xDots, yDots);
	}

	/*
	 * Print:
	 * Conservamos ^FT porque ya comprobaste físicamente
	 * que corrige el desplazamiento que tenías con ^FO.
	 *
	 * Por ahora usamos la misma posición vertical que
	 * estabas utilizando con ^BQ.
	 */
	const qrY = yDots + bitmap.heightDots;

	return [
		`^FT${xDots},${qrY}`,
		`^GFA,${bitmap.data.length},${bitmap.data.length},${bitmap.bytesPerRow},${bytesToHex(bitmap.data)}`,
	].join('\n');
}
