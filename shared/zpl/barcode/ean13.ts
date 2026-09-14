import { Ean13 } from '@ashaffah/barcodes';
import type { BarcodeElement } from '../../types.js';
import { drawBitmap, setPixel, type GraphicBitmap } from '../renderers/graphic.js';
import { mmToDots, resolveBarcodeTextSize } from '../units.js';
import { fontSizeMmToOpenType, renderText } from '../fonts/rasterizeText.js'
import { Font } from 'opentype.js'

export interface Ean13Encoded {
	content: string;
	bars: string;
}

export function encodeEan13(content: string): Ean13Encoded {
	const fullContent =
    content.length === 12
      ? content + calculateEan13CheckDigit(content)
      : content;

	const result = Ean13.encode(content);

	if (result.data.kind !== 'linear') {
		throw new Error('EAN-13 encoder did not return a linear barcode');
	}

	return {
    content: fullContent,
    bars: result.data.bars
      .map((bar) => (bar ? '1' : '0'))
      .join(''),
  };
}

export function createEan13Bitmap(
	el: Pick<BarcodeElement, 'content' | 'width' | 'height' | 'showText'>,
	dpi: number,
	font: Font,
): GraphicBitmap {
	const encoded = encodeEan13(el.content);

	const widthDots = mmToDots(el.width, dpi);
	const heightDots = mmToDots(el.height, dpi);

	const textSizeMm = resolveBarcodeTextSize(el);
	const textHeightDots = mmToDots(textSizeMm, dpi);

	const barHeightDots = heightDots - textHeightDots;

	if (barHeightDots <= 0) {
		throw new Error('EAN-13 height is too small for barcode and text');
	}

	const bytesPerRow = Math.ceil(widthDots / 8);

	const bitmap: GraphicBitmap = {
		widthDots,
		heightDots,
		bytesPerRow,
		data: new Uint8Array(bytesPerRow * heightDots),
	};

	const moduleCount = 95;

	// Espacio reservado para el primer dígito, fuera de las barras.
	const firstDigitAreaDots = mmToDots(3.5, dpi);

	// Espacio blanco al final del símbolo.
	const rightQuietZoneDots = mmToDots(2, dpi);

	// Área disponible exclusivamente para las 95 barras/módulos.
	const barcodeStartX = firstDigitAreaDots;

	const barcodeWidthDots = widthDots - firstDigitAreaDots - rightQuietZoneDots;

	if (barcodeWidthDots <= 0) {
		throw new Error('EAN-13 width is too small');
	}

	// 1. Dibujar barras
	for (let moduleIndex = 0; moduleIndex < moduleCount; moduleIndex++) {
		if (encoded.bars[moduleIndex] !== '1') {
			continue;
		}

		const startX = barcodeStartX + Math.floor((moduleIndex * barcodeWidthDots) / moduleCount);

		const endX = barcodeStartX + Math.floor(((moduleIndex + 1) * barcodeWidthDots) / moduleCount);

		const isGuard = moduleIndex <= 2 || (moduleIndex >= 45 && moduleIndex <= 49) || moduleIndex >= 92;

		const currentBarHeight = isGuard ? heightDots : barHeightDots;

		for (let x = startX; x < endX; x++) {
			for (let y = 0; y < currentBarHeight; y++) {
				setPixel(bitmap, x, y);
			}
		}
	}

	function moduleX(module: number): number {
		return barcodeStartX + Math.floor((module * barcodeWidthDots) / moduleCount);
	}

	// 2. Preparar texto

	if (el.showText) {
		// 2. Preparar texto

		const fontSize = fontSizeMmToOpenType(font, textSizeMm, dpi);

		const textY = barHeightDots;

		const firstDigit = encoded.content[0];
		const leftDigits = encoded.content.slice(1, 7);
		const rightDigits = encoded.content.slice(7, 13);

		const firstDigitAreaStart = 0;
		const firstDigitAreaEnd = moduleX(0);

		const leftAreaStart = moduleX(3);
		const leftAreaEnd = moduleX(45);

		const rightAreaStart = moduleX(50);
		const rightAreaEnd = moduleX(92);

		/**
		 * Primer dígito
		 * Lo colocamos hacia la derecha de su área,
		 * justo antes de la primera guarda.
		 */
		const firstDigitGapDots = mmToDots(1, dpi);

		const firstDigitBitmap = renderText(font, firstDigit, fontSize, firstDigitAreaEnd - firstDigitGapDots, {
			align: 'Right',
		});

		drawBitmap(bitmap, firstDigitBitmap.bitmap, firstDigitAreaStart, textY);

		/**
		 * Cada dígito ocupa un "slot".
		 * Al centrar cada dígito dentro de su slot,
		 * conseguimos un efecto equivalente a space-around.
		 */

		function drawSpacedDigits(text: string, areaStart: number, areaEnd: number): void {
			const areaWidth = areaEnd - areaStart;
			const slotWidth = areaWidth / text.length;

			for (let i = 0; i < text.length; i++) {
				const slotStart = Math.floor(areaStart + i * slotWidth);

				const slotEnd = Math.floor(areaStart + (i + 1) * slotWidth);

				const currentSlotWidth = slotEnd - slotStart;

				const digitBitmap = renderText(font, text[i], fontSize, currentSlotWidth, { align: 'Center' });

				drawBitmap(bitmap, digitBitmap.bitmap, slotStart, textY);
			}
		}

		drawSpacedDigits(leftDigits, leftAreaStart, leftAreaEnd);

		drawSpacedDigits(rightDigits, rightAreaStart, rightAreaEnd);
	}

	return bitmap;
}

function calculateEan13CheckDigit(content: string): string {
	let sum = 0;

	for (let i = 0; i < 12; i++) {
		const digit = Number(content[i]);

		sum += i % 2 === 0 ? digit : digit * 3;
	}

	const remainder = sum % 10;
	
	return String(remainder === 0 ? 0 : 10 - remainder);
}
