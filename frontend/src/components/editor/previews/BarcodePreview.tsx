import type { BarcodeElement, Symbology } from 'shared';
import { BarcodeBitmapPreview } from './BarcodeBitmapPreview';
import { createEan13Bitmap, createCode128Bitmap } from 'shared/zpl';


export function BarcodePreview({ element }: { element: BarcodeElement }) {
	switch (element.symbology) {
		case 'code128':
			return (
				<BarcodeBitmapPreview
					element={element}
					createBitmap={createCode128Bitmap}
				/>
			);

		case 'ean13':
			return (
				<BarcodeBitmapPreview
					element={element}
					createBitmap={createEan13Bitmap}
				/>
			);
	}
}

export function InvalidBarcodePreview({ symbology }: { symbology: Symbology }) {
	return (
		<div className='flex items-center justify-center border border-dashed border-red-400 px-2 py-1 text-[10px] text-red-500'>
			Contenido inválido para {symbology}
		</div>
	);
}
