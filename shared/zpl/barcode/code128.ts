import Code128Generator from 'code-128-encoder';
import type { BarcodeElement } from '../../types.js';
import { mmToDots } from '../units.js';

export interface Code128Encoded {
	bars: string;
	codes: number[];
	moduleCount: number;
}

export interface Code128Graphic {
	widthDots: number;
	heightDots: number;
	data: number[];
}

/**
 * Codifica el contenido utilizando el algoritmo real de Code 128.
 *
 * `bars` contiene un bit por módulo:
 *   1 = barra negra
 *   0 = espacio blanco
 */
export function encodeCode128(content: string): Code128Encoded {
	const encoder = new Code128Generator();

	const bars = encoder.encode(content, {
		output: 'bars',
	});

	const codes = encoder.encode(content, {
		output: 'codes',
	});

	return {
		bars,
		codes,
		moduleCount: bars.length,
	};
}

/**
 * Convierte los módulos del Code 128 a un bitmap de 1 bit,
 * redimensionándolo horizontalmente al ancho solicitado.
 */
export function buildCode128Graphic(
	el: Pick<BarcodeElement, 'content' | 'width' | 'height'>,
	dpi: number,
): Code128Graphic {
	const encoded = encodeCode128(el.content);

	const widthDots = mmToDots(el.width ?? 2, dpi);
	const heightDots = mmToDots(el.height, dpi);

	const data = new Array(widthDots * heightDots).fill(0);

	/*
	 * Cada módulo debe ocupar una cantidad entera de dots.
	 *
	 * En lugar de redondear individualmente cada módulo,
	 * utilizamos límites acumulativos:
	 *
	 *   módulo 0 → [0, 2)
	 *   módulo 1 → [2, 4)
	 *   módulo 2 → [4, 6)
	 *
	 * Si el ancho no es divisible exactamente entre los módulos,
	 * la distribución queda repartida a lo largo del código.
	 */
	for (let moduleIndex = 0; moduleIndex < encoded.bars.length; moduleIndex++) {
		if (encoded.bars[moduleIndex] !== '1') {
			continue;
		}

		const startX = Math.floor((moduleIndex * widthDots) / encoded.moduleCount);

		const endX = Math.floor(((moduleIndex + 1) * widthDots) / encoded.moduleCount);

		for (let y = 0; y < heightDots; y++) {
			const rowOffset = y * widthDots;

			for (let x = startX; x < endX; x++) {
				data[rowOffset + x] = 1;
			}
		}
	}

	return {
		widthDots,
		heightDots,
		data,
	};
}

function createCode128Bitmap(bars: string, widthDots: number, heightDots: number): GraphicBitmap {
	const bytesPerRow = Math.ceil(widthDots / 8);
	const data = new Uint8Array(bytesPerRow * heightDots);

	for (let moduleIndex = 0; moduleIndex < bars.length; moduleIndex++) {
		if (bars[moduleIndex] !== '1') {
			continue;
		}

		const startX = Math.floor((moduleIndex * widthDots) / bars.length);

		const endX = Math.floor(((moduleIndex + 1) * widthDots) / bars.length);

		for (let x = startX; x < endX; x++) {
			const byteIndex = Math.floor(x / 8);
			const bitIndex = 7 - (x % 8);

			for (let y = 0; y < heightDots; y++) {
				data[y * bytesPerRow + byteIndex] |= 1 << bitIndex;
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


export function calculateCode128Sizing () {}
