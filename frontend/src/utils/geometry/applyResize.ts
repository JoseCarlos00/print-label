import type { BarcodeElement, LabelElement, QrElement, TextElement } from 'shared';

import type { ElementBounds } from './elementBounds';
import { getResizeScale, type ResizeResult } from './resize';
import { EDITOR_LIMITS } from '@/config/editorLimits'

export function applyResizeToElement(element: LabelElement, bounds: ElementBounds, result: ResizeResult): LabelElement {
	switch (element.type) {
		case 'text':
			return resizeText(element, bounds, result);

		case 'barcode':
			return resizeBarcode(element, result);

		case 'qr':
			return resizeQr(element, bounds, result);
	}
}

function resizeText(element: TextElement, bounds: ElementBounds, result: ResizeResult): TextElement {
	const scale = getResizeScale(bounds, result);
  const fontSize = Math.min(
		Math.max(element.fontSize * scale, EDITOR_LIMITS.fontSizeMm.min),
		EDITOR_LIMITS.fontSizeMm.max,
	);

	return {
		...element,
		x: result.left,
		y: result.top,
		fontSize,
		wrapWidth: element.wrapWidth != null ? element.wrapWidth * scale : undefined,
		lineSpacing: element.lineSpacing != null ? element.lineSpacing * scale : undefined,
	};
}

function resizeBarcode(element: BarcodeElement, result: ResizeResult): BarcodeElement {
	const isSideways = element.rotation === 90 || element.rotation === 270;

	return {
		...element,
		x: result.left,
		y: result.top,
		width: isSideways ? result.height : result.width,
		height: isSideways ? result.width : result.height,
	};
}

function resizeQr(element: QrElement, bounds: ElementBounds, result: ResizeResult): QrElement {
	const scale = getResizeScale(bounds, result);

	return {
		...element,
		x: result.left,
		y: result.top,
		size: element.size * scale,
	};
}
