import type { ElementBounds } from './elementBounds';

export type ResizeHandle = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export interface ResizeOptions {
	bounds: ElementBounds;
	handle: ResizeHandle;
	cursorX: number;
	cursorY: number;
	keepAspectRatio: boolean;
	minWidth?: number;
	minHeight?: number;
}

export interface ResizeResult {
	left: number;
	top: number;
	width: number;
	height: number;
}

const DEFAULT_MIN_SIZE_MM = 1;

export function calculateResize({
	bounds,
	handle,
	cursorX,
	cursorY,
	keepAspectRatio,
	minWidth = DEFAULT_MIN_SIZE_MM,
	minHeight = DEFAULT_MIN_SIZE_MM,
}: ResizeOptions): ResizeResult {
	const fixedPoint = getFixedPoint(bounds, handle);

	let width: number;
	let height: number;

	switch (handle) {
		case 'topLeft':
			width = Math.max(fixedPoint.x - cursorX, minWidth);
			height = Math.max(fixedPoint.y - cursorY, minHeight);
			break;

		case 'topRight':
			width = Math.max(cursorX - fixedPoint.x, minWidth);
			height = Math.max(fixedPoint.y - cursorY, minHeight);
			break;

		case 'bottomLeft':
			width = Math.max(fixedPoint.x - cursorX, minWidth);
			height = Math.max(cursorY - fixedPoint.y, minHeight);
			break;

		case 'bottomRight':
			width = Math.max(cursorX - fixedPoint.x, minWidth);
			height = Math.max(cursorY - fixedPoint.y, minHeight);
			break;
	}

	if (keepAspectRatio) {
		const scaleX = width / bounds.width;
		const scaleY = height / bounds.height;

		const minScale = Math.max(minWidth / bounds.width, minHeight / bounds.height);

		const scale = Math.max(scaleX, scaleY, minScale);

		width = bounds.width * scale;
		height = bounds.height * scale;
	}

	return getBoundsFromFixedPoint(fixedPoint, handle, width, height);
}

export function getResizeScale(bounds: ElementBounds, result: ResizeResult): number {
	const scaleX = result.width / bounds.width;
	const scaleY = result.height / bounds.height;

	return (scaleX + scaleY) / 2;
}

function getFixedPoint(bounds: ElementBounds, handle: ResizeHandle): { x: number; y: number } {
	switch (handle) {
		case 'topLeft':
			return {
				x: bounds.right,
				y: bounds.bottom,
			};

		case 'topRight':
			return {
				x: bounds.left,
				y: bounds.bottom,
			};

		case 'bottomLeft':
			return {
				x: bounds.right,
				y: bounds.top,
			};

		case 'bottomRight':
			return {
				x: bounds.left,
				y: bounds.top,
			};
	}
}

function getBoundsFromFixedPoint(
	fixedPoint: { x: number; y: number },
	handle: ResizeHandle,
	width: number,
	height: number,
): ResizeResult {
	switch (handle) {
		case 'topLeft':
			return {
				left: fixedPoint.x - width,
				top: fixedPoint.y - height,
				width,
				height,
			};

		case 'topRight':
			return {
				left: fixedPoint.x,
				top: fixedPoint.y - height,
				width,
				height,
			};

		case 'bottomLeft':
			return {
				left: fixedPoint.x - width,
				top: fixedPoint.y,
				width,
				height,
			};

		case 'bottomRight':
			return {
				left: fixedPoint.x,
				top: fixedPoint.y,
				width,
				height,
			};
	}
}
