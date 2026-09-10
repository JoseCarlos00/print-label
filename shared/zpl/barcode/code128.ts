import type { BarcodeElement } from '../../types.js';

export interface Code128Sizing {
	moduleCount: number;
	moduleWidthDots: number;
	widthDots: number;
	widthMm: number;
}

export function getCode128ModuleCount(content: string): number {
	/*
	 * Primera versión:
	 * asumimos Code Set C cuando todo el contenido es numérico
	 * y tiene cantidad par de dígitos.
	 *
	 * Esto coincide con nuestro primer caso de prueba.
	 */
	const isNumeric = /^\d+$/.test(content);
	const usesCodeC = isNumeric && content.length % 2 === 0;

	const dataSymbols = usesCodeC ? content.length / 2 : content.length;

	/*
	 * Start + data + checksum = cada uno 11 módulos
	 * Stop = 13 módulos
	 */
	return (1 + dataSymbols + 1) * 11 + 13;
}

export function calculateCode128Sizing(el: Pick<BarcodeElement, 'content' | 'width'>, dpi: number): Code128Sizing {
	const moduleCount = getCode128ModuleCount(el.content || ' ');

	const targetWidthDots = el.width ?? 2 * (dpi / 25.4);

	let bestModuleWidthDots = 1;
	let bestWidthDots = moduleCount;
	let bestDifference = Infinity;

	/*
	 * ^BY trabaja con valores enteros de dots.
	 *
	 * Probamos valores razonables.
	 */
	for (let moduleWidthDots = 1; moduleWidthDots <= 10; moduleWidthDots++) {
		const widthDots = moduleCount * moduleWidthDots;
		const difference = Math.abs(widthDots - targetWidthDots);

		if (difference < bestDifference) {
			bestDifference = difference;
			bestModuleWidthDots = moduleWidthDots;
			bestWidthDots = widthDots;
		}
	}

	return {
		moduleCount,
		moduleWidthDots: bestModuleWidthDots,
		widthDots: bestWidthDots,
		widthMm: bestWidthDots / (dpi / 25.4),
	};
}
