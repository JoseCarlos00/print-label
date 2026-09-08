import type { QrErrorCorrection } from '../../types.js';
import { mmToDots } from '../units.js';
import { getQrModuleCount } from './moduleCount.js';

export interface QrSizing {
	moduleCount: number;
	magnification: number;
	sizeDots: number;
	sizeMm: number;
}

export function calculateQrSizing(
	content: string,
	requestedSizeMm: number,
	dpi: number,
	errorCorrection: QrErrorCorrection = 'M',
): QrSizing {
	const moduleCount = getQrModuleCount(content || ' ', errorCorrection);

	const targetDots = mmToDots(requestedSizeMm, dpi);

	let bestMagnification = 1;
	let bestSizeDots = moduleCount;
	let bestDifference = Infinity;

	for (let magnification = 1; magnification <= 10; magnification++) {
		const sizeDots = moduleCount * magnification;
		const difference = Math.abs(sizeDots - targetDots);

		if (difference < bestDifference) {
			bestDifference = difference;
			bestMagnification = magnification;
			bestSizeDots = sizeDots;
		}
	}

	return {
		moduleCount,
		magnification: bestMagnification,
		sizeDots: bestSizeDots,
		sizeMm: bestSizeDots / (dpi / 25.4),
	};
}
