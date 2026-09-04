import type {
	BarcodeElement,
	LabelElement,
	PrinterProfile,
	QrElement,
	QrErrorCorrection,
	Rotation,
	Symbology,
	TextElement,
} from './types.js';

/**
 * Error de validación de contenido contra las reglas de un symbology de
 * código de barras específico (ej. EAN-13 exige 12-13 dígitos numéricos).
 * El controller que llame a generateZpl debe capturar este error y
 * devolver 400 al cliente — es un error de datos del usuario, no un
 * error de conexión con la impresora.
 */
export class ZplValidationError extends Error {
	constructor(
		message: string,
		public elementId?: string,
	) {
		super(message);
		this.name = 'ZplValidationError';
	}
}

/** Convierte mm a dots según el DPI del perfil. ZPL trabaja en dots (spec §8). */
function mmToDots(mm: number, dpi: number): number {
	return Math.round(mm * (dpi / 25.4));
}

const ROTATION_MAP: Record<Rotation, string> = {
	0: 'N',
	90: 'R',
	180: 'I',
	270: 'B',
};

/**
 * Ratio ancho/alto de carácter para simular negrita en ^A0 (ZPL no tiene
 * negrita real). Probado y confirmado: 1.4.
 */
const BOLD_WIDTH_RATIO = 1.4;

/**
 * Escapa el contenido de un campo ^FD para uso con ^FH activo.
 * ZPL interpreta '^' y '~' como prefijos de comando/control en CUALQUIER
 * parte del stream, incluso dentro de ^FD — sin este escape, un contenido
 * de usuario como "Precio ~10" o "Ref^123" rompería el ZPL generado.
 * Con ^FH antes de ^FD, una secuencia "_XX" (dos hex) se interpreta como
 * ese byte literal, así que también hay que escapar el propio '_'.
 */
function escapeZplField(content: string): string {
	return content.replace(/[\^~_]/g, (char) => {
		const hex = char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
		return `_${hex}`;
	});
}

// ──────────────────────────────────────────────────────────────────────────
// Texto
// ──────────────────────────────────────────────────────────────────────────

function buildTextCommand(el: TextElement, dpi: number): string {
	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);
	const heightDots = mmToDots(el.fontSize, dpi);
	const widthDots = el.bold ? Math.round(heightDots * BOLD_WIDTH_RATIO) : heightDots;
	const orientation = ROTATION_MAP[el.rotation];
	const content = escapeZplField(el.content);

	return [
		`^FO${xDots},${yDots}`,
		`^A0${orientation},${heightDots},${widthDots}`,
		`^FH^FD${content}^FS`,
	].join('\n');
}

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

function buildBarcodeCommand(el: BarcodeElement, dpi: number): string {
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

// ──────────────────────────────────────────────────────────────────────────
// QR
// ──────────────────────────────────────────────────────────────────────────

const QR_ERROR_CORRECTION_DEFAULT: QrErrorCorrection = 'M';

function buildQrCommand(el: QrElement, dpi: number): string {
	const xDots = mmToDots(el.x, dpi);
	const yDots = mmToDots(el.y, dpi);
	const orientation = ROTATION_MAP[el.rotation];
	const errorCorrection = el.errorCorrection ?? QR_ERROR_CORRECTION_DEFAULT;
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

	return [
		`^FT${xDots},${yDots}`,
		`^BQ${orientation},2,${el.size}`,

		// Modo de entrada de datos fijo en "A" (automático): la impresora
		// detecta el mejor submodo de codificación QR por contenido (email texto, números, etc.) sin que tengamos que declararlo nosotros.
		`^FH^FD${errorCorrection}A,${content}^FS`,
	].join('\n');
}

// ──────────────────────────────────────────────────────────────────────────
// Generador principal
// ──────────────────────────────────────────────────────────────────────────

/**
 * Convierte el diseño de una etiqueta (LabelElement[]) al ZPL completo
 * (^XA...^XZ) listo para enviar por socket TCP a la impresora (spec §8).
 *
 * Lanza ZplValidationError si algún elemento no es válido para su tipo
 * (ej. contenido de barcode que no cumple el formato del symbology).
 * El caller debe capturar ese error específico y devolver 400.
 */
export function generateZpl(elements: LabelElement[], profile: PrinterProfile): string {
	const widthDots = mmToDots(profile.widthMm, profile.dpi);
	const heightDots = mmToDots(profile.heightMm, profile.dpi);

	const commands = elements.map((el) => {
		switch (el.type) {
			case 'text':
				return buildTextCommand(el, profile.dpi);
			case 'barcode':
				return buildBarcodeCommand(el, profile.dpi);
			case 'qr':
				return buildQrCommand(el, profile.dpi);
		}
	});

	return [
		'^XA',
		'^CI28', // UTF-8: necesario para acentos y ñ en textos/QRs en español
		`^PW${widthDots}`,
		`^LL${heightDots}`,
		'^LH0,0',
		...commands,
		'^XZ',
	].join('\n');
}
