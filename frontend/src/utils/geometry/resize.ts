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
  maxWidth?: number;
  maxHeight?: number;
}

export interface ResizeResult {
	left: number;
	top: number;
	width: number;
	height: number;
}

const DEFAULT_MIN_SIZE_MM = 1;
const DEFAULT_MAX_SIZE_MM = 500;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function calculateResize({
	bounds,
	handle,
	cursorX,
	cursorY,
	keepAspectRatio,
	minWidth = DEFAULT_MIN_SIZE_MM,
	minHeight = DEFAULT_MIN_SIZE_MM,
	maxWidth = DEFAULT_MAX_SIZE_MM,
	maxHeight = DEFAULT_MAX_SIZE_MM,
}: ResizeOptions): ResizeResult {
	const fixedPoint = getFixedPoint(bounds, handle);

	let width: number;
	let height: number;

	switch (handle) {
		case 'topLeft':
			width = clamp(fixedPoint.x - cursorX, minWidth, maxWidth);
			height = clamp(fixedPoint.y - cursorY, minHeight, maxHeight);
			break;

		case 'topRight':
			width = clamp(cursorX - fixedPoint.x, minWidth, maxWidth);
			height = clamp(fixedPoint.y - cursorY, minHeight, maxHeight);
			break;

		case 'bottomLeft':
			width = clamp(fixedPoint.x - cursorX, minWidth, maxWidth);
			height = clamp(cursorY - fixedPoint.y, minHeight, maxHeight);
			break;

		case 'bottomRight':
			width = clamp(cursorX - fixedPoint.x, minWidth, maxWidth);
			height = clamp(cursorY - fixedPoint.y, minHeight, maxHeight);
			break;
	}

	if (keepAspectRatio) {
		const scaleX = width / bounds.width;
		const scaleY = height / bounds.height;

		const minScale = Math.max(minWidth / bounds.width, minHeight / bounds.height);

		const maxScale = Math.min(maxWidth / bounds.width, maxHeight / bounds.height);

		const scale = Math.min(Math.max(scaleX, scaleY, minScale), maxScale);

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
