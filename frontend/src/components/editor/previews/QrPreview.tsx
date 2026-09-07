import { QRCodeSVG } from 'qrcode.react';
import type { QrElement } from 'shared';
import { mmToPx } from '../../../utils/scale';
import { getQrSizeDots } from 'shared/zpl';

export function QrPreview({ element, dpi }: { element: QrElement; dpi: number }) {
	const errorCorrection = element.errorCorrection ?? 'M';

	const sizeDots = getQrSizeDots(element);
	const sizeMm = sizeDots / (dpi / 25.4);

	return (
		<QRCodeSVG
			value={element.content || ' '}
			size={mmToPx(sizeMm)}
			level={errorCorrection}
		/>
	);
}
