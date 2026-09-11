import type { BarcodeElement } from 'shared';
import { createEan13Bitmap } from 'shared/zpl';
import { BarcodeBitmapPreview } from './BarcodeBitmapPreview';

export function Ean13Preview({ element }: { element: BarcodeElement }) {
	return (
		<BarcodeBitmapPreview
			element={element}
			createBitmap={createEan13Bitmap}
		/>
	);
}
