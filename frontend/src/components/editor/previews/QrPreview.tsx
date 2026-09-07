import { QRCodeSVG } from 'qrcode.react';
import type { QrElement } from 'shared';
import { mmToPx } from '../../../utils/scale';
import { getQrModuleCount } from '../../../utils/qrSize';

export function QrPreview({ element, dpi }: { element: QrElement; dpi: number }) {
	const errorCorrection = element.errorCorrection ?? 'M';
	const moduleCount = getQrModuleCount(element.content || ' ', errorCorrection);

	// Mismo criterio que usa la impresora: módulos × magnificación = dots
	// reales, convertidos a mm según el DPI del perfil activo — no una
	// escala arbitraria.
	const sizeDots = moduleCount * element.size;
	const sizeMm = sizeDots / (dpi / 25.4);

	return (
		<QRCodeSVG
			value={element.content || ' '}
			size={mmToPx(sizeMm)}
			level={errorCorrection}
		/>
	);
}
