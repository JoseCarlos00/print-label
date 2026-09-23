import type { LabelElement } from 'shared';
import { pxToMm } from '@/utils/scale';

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

	const offsetX = isSideways ? (naturalHeightMm - naturalWidthMm) / 2 : 0;

	const offsetY = isSideways ? (naturalWidthMm - naturalHeightMm) / 2 : 0;

	const left = element.x + offsetX;
	const top = element.y + offsetY;

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
