import type { LabelElement } from 'shared';
import { getQrModuleCount } from 'shared/zpl';
import { mmToDots, pxToMm } from '@/utils/scale';

export interface ElementBounds {
	left: number;
	top: number;
	right: number;
	bottom: number;
	centerX: number;
	centerY: number;
	width: number;
	height: number;
}

interface NaturalSize {
	width: number;
	height: number;
}

export function getElementBounds(element: LabelElement, naturalSize: NaturalSize): ElementBounds {
	const naturalWidthMm = pxToMm(naturalSize.width);
	const naturalHeightMm = pxToMm(naturalSize.height);

	const isSideways = element.rotation === 90 || element.rotation === 270;

	const width = isSideways ? naturalHeightMm : naturalWidthMm;

	const height = isSideways ? naturalWidthMm : naturalHeightMm;

	const left = element.x;
	const top = element.y;
	const right = left + width;
	const bottom = top + height;

	return {
		left,
		top,
		right,
		bottom,
		centerX: left + width / 2,
		centerY: top + height / 2,
		width,
		height,
	};
}

export function getResizeBounds(element: LabelElement, naturalSize: NaturalSize): ElementBounds {
	if (element.type !== 'qr') {
		return getElementBounds(element, naturalSize);
	}

	const size = element.size;

	const left = element.x;
	const top = element.y;
	const right = left + size;
	const bottom = top + size;

	return {
		left,
		top,
		right,
		bottom,
		centerX: left + size / 2,
		centerY: top + size / 2,
		width: size,
		height: size,
	};
}

export function getQrSelectionCorners(element: LabelElement, naturalSize: NaturalSize, dpi: number): SelectionCorners {
	if (element.type !== 'qr') {
		return getSelectionCorners(getResizeBounds(element, naturalSize));
	}

	const naturalWidthMm = pxToMm(naturalSize.width);
	const naturalHeightMm = pxToMm(naturalSize.height);

	const qrSizeMm = getQrBitmapSizeMm(element, dpi);

	/*
	 * El QR empieza en (0, 0) dentro del bitmap compuesto.
	 *
	 * Por tanto, su centro antes de rotar es:
	 *
	 *   (qrSize / 2, qrSize / 2)
	 *
	 * mientras que el centro del bitmap completo es:
	 *
	 *   (naturalWidth / 2, naturalHeight / 2)
	 */
	const qrCenterX = qrSizeMm / 2;
	const qrCenterY = qrSizeMm / 2;

	const bitmapCenterX = naturalWidthMm / 2;
	const bitmapCenterY = naturalHeightMm / 2;

	const relativeX = qrCenterX - bitmapCenterX;
	const relativeY = qrCenterY - bitmapCenterY;

	let rotatedX = relativeX;
	let rotatedY = relativeY;

	switch (element.rotation) {
		case 90:
			rotatedX = -relativeY;
			rotatedY = relativeX;
			break;

		case 180:
			rotatedX = -relativeX;
			rotatedY = -relativeY;
			break;

		case 270:
			rotatedX = relativeY;
			rotatedY = -relativeX;
			break;
	}

	const rotatedNaturalWidth = element.rotation === 90 || element.rotation === 270 ? naturalHeightMm : naturalWidthMm;

	const rotatedNaturalHeight = element.rotation === 90 || element.rotation === 270 ? naturalWidthMm : naturalHeightMm;

	const centerX = element.x + rotatedNaturalWidth / 2 + rotatedX;

	const centerY = element.y + rotatedNaturalHeight / 2 + rotatedY;

	const halfSize = qrSizeMm / 2;

	return {
		topLeft: {
			x: centerX - halfSize,
			y: centerY - halfSize,
		},
		topRight: {
			x: centerX + halfSize,
			y: centerY - halfSize,
		},
		bottomLeft: {
			x: centerX - halfSize,
			y: centerY + halfSize,
		},
		bottomRight: {
			x: centerX + halfSize,
			y: centerY + halfSize,
		},
	};
}

function getQrBitmapSizeMm(element: Extract<LabelElement, { type: 'qr' }>, dpi: number): number {
	try {
		const moduleCount = getQrModuleCount(element.content, element.errorCorrection);

		const requestedSizeDots = mmToDots(element.size, dpi);

		const moduleSizeDots = Math.max(1, Math.floor(requestedSizeDots / moduleCount));

		const actualSizeDots = moduleCount * moduleSizeDots;

		return (actualSizeDots / dpi) * 25.4;
	} catch {
		// Si el contenido todavía es inválido,
		// usamos el tamaño lógico como fallback.
		return element.size;
	}
}

export interface AlignmentPoints {
	left: number;
	centerX: number;
	right: number;
	top: number;
	centerY: number;
	bottom: number;
}

export function getAlignmentPoints(bounds: ElementBounds): AlignmentPoints {
	return {
		left: bounds.left,
		centerX: bounds.centerX,
		right: bounds.right,
		top: bounds.top,
		centerY: bounds.centerY,
		bottom: bounds.bottom,
	};
}

export interface SelectionCorners {
	topLeft: {
		x: number;
		y: number;
	};
	topRight: {
		x: number;
		y: number;
	};
	bottomLeft: {
		x: number;
		y: number;
	};
	bottomRight: {
		x: number;
		y: number;
	};
}

export function getSelectionCorners(bounds: ElementBounds): SelectionCorners {
	return {
		topLeft: {
			x: bounds.left,
			y: bounds.top,
		},
		topRight: {
			x: bounds.right,
			y: bounds.top,
		},
		bottomLeft: {
			x: bounds.left,
			y: bounds.bottom,
		},
		bottomRight: {
			x: bounds.right,
			y: bounds.bottom,
		},
	};
}
