import type { BarcodeElement, Symbology } from '../../types.js';
import { escapeZplField, mmToDots, ROTATION_MAP, ZplValidationError } from '../units.js'

// ──────────────────────────────────────────────────────────────────────────
// Código de barras
// ──────────────────────────────────────────────────────────────────────────

const BARCODE_LABELS: Record<Symbology, string> = {
	code128: 'Code 128',
	ean13: 'EAN-13',
	code39: 'Code 39',
	upc: 'UPC-A',
};

function validateBarcodeContent(el: BarcodeElement): void {
	const { symbology, content } = el;

	switch (symbology) {
		case 'ean13':
			if (!/^\d{12,13}$/.test(content)) {
				throw new ZplValidationError(
					`El código ${BARCODE_LABELS.ean13} debe tener 12 o 13 dígitos numéricos (recibido: "${content}")`,
					el.id,
				);
			}
			break;

		case 'upc':
			if (!/^\d{11,12}$/.test(content)) {
				throw new ZplValidationError(
					`El código ${BARCODE_LABELS.upc} debe tener 11 o 12 dígitos numéricos (recibido: "${content}")`,
					el.id,
				);
			}
			break;

		case 'code39':
			// Code 39 estándar: A-Z, 0-9, espacio, y - . $ / + %
			if (!/^[A-Z0-9\-. $/+%]+$/.test(content)) {
				throw new ZplValidationError(
					`El código ${BARCODE_LABELS.code39} solo admite mayúsculas, dígitos y los símbolos - . $ / + % (espacio incluido). Recibido: "${content}"`,
					el.id,
				);
			}
			break;

		case 'code128':
			if (content.trim().length === 0) {
				throw new ZplValidationError(`El código ${BARCODE_LABELS.code128} no puede estar vacío`, el.id);
			}
			break;
	}
}

export function buildBarcodeCommand(el: BarcodeElement, dpi: number): string {
	validateBarcodeContent(el);

	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);
	const heightDots = mmToDots(el.height, dpi);
	const orientation = ROTATION_MAP[el.rotation];
	const printText = el.showText ? 'Y' : 'N';
	const content = escapeZplField(el.content);

	// ^BY: módulo angosto = 2 dots, ratio ancho/angosto = 3:1 (default fijo,
	// pendiente de exponer en el modelo de datos si hace falta más adelante).
	const moduleWidth = '^BY2,3';

	let barcodeCommand: string;
	switch (el.symbology) {
		case 'code128':
			// ^BC: orientación, altura, línea interpretación, imprimir arriba, check digit, modo
			barcodeCommand = `^BC${orientation},${heightDots},${printText},N,N,N`;
			break;
		case 'ean13':
			// ^BE: orientación, altura, línea interpretación, imprimir arriba
			barcodeCommand = `^BE${orientation},${heightDots},${printText},N`;
			break;
		case 'code39':
			// ^B3: orientación, check digit, altura, línea interpretación, imprimir arriba
			barcodeCommand = `^B3${orientation},N,${heightDots},${printText},N`;
			break;
		case 'upc':
			// ^BU: orientación, altura, línea interpretación, imprimir arriba, check digit
			barcodeCommand = `^BU${orientation},${heightDots},${printText},N,Y`;
			break;
	}

	return [`^FO${xDots},${yDots}`, moduleWidth, barcodeCommand, `^FH^FD${content}^FS`].join('\n');
}
