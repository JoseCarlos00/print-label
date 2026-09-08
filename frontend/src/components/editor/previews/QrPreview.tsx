import { QRCodeSVG } from 'qrcode.react';
import type { QrElement } from 'shared';
import { mmToPx } from '../../../utils/scale';

export function QrPreview({ element }: { element: QrElement }) {
	const errorCorrection = element.errorCorrection ?? 'M';

	return (
		<QRCodeSVG
			value={element.content || ' '}
			size={mmToPx(element.size)}
			level={errorCorrection}
		/>
	);
}
