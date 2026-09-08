import QRCode from 'qrcode/lib/core/qrcode.js';

import type { QrElement, QrErrorCorrection } from '../../types.js';
import { escapeZplField, mmToDots, ROTATION_MAP, ZplTarget } from '../units.js';

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

export function buildQrCommand(el: QrElement, dpi: number, target: ZplTarget = 'print'): string {
	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);

	const orientation = ROTATION_MAP[el.rotation];
	const errorCorrection = el.errorCorrection ?? QR_ERROR_CORRECTION_DEFAULT;

	const sizeDots = getQrSizeDots(el);
	const content = escapeZplField(el.content);

	/* IMPORTANTE — NO cambiar ^FT por ^FO aquí sin volver a probar contra
		impresora física. Validado empíricamente: con ^FO el QR se imprimía
		~195 dots más abajo de lo que mostraba Labelary preview (offset
		constante no documentado, probablemente del firmware). Con ^FT el
		resultado impreso coincide con el preview. Por eso, a diferencia de
		text/barcode (que usan ^FO), el QR usa ^FT con x,y directo.

		El parámetro de orientación de ^BQ (rotación) sigue el mismo mapeo
		que el resto de los elementos, pero no fue validado físicamente aún —
		solo la posición x,y lo fue. Confirmar en hardware si usan rotación != 0.
	*/

	if (target === 'preview') {
		// SOLO para preview vía Labelary. Confirmado empíricamente: Labelary
		// no reproduce el offset de ^FT documentado abajo — con ^FO y el y,x
		// tal cual (sin sumar sizeDots) el QR se ve alineado igual que en la
		// impresora física con ^FT. Es una particularidad del simulador,
		// NO cambiar el ZPL real (target 'print') basándose en esto.
		return [`^FO${xDots},${yDots}`, `^BQ${orientation},2,${el.size}`, `^FH^FD${errorCorrection}A,${content}^FS`].join(
			'\n',
		);
	}

	// ^FT usa como referencia la parte inferior del QR,
	// mientras que el editor usa la esquina superior izquierda.
	const qrY = yDots + sizeDots;

	return [`^FT${xDots},${qrY}`, `^BQ${orientation},2,${el.size}`, `^FH^FD${errorCorrection}A,${content}^FS`].join('\n');
}
