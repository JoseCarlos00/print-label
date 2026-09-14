import type { QrElement } from 'shared';
import { BarcodeBitmapPreview } from './BarcodeBitmapPreview';
import { createQrBitmap } from 'shared/zpl'

export function QrPreview({ element }: { element: QrElement }) {
	return (
		<BarcodeBitmapPreview
			element={element}
			createBitmap={createQrBitmap}
		/>
	);
}
