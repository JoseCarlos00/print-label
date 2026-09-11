import Barcode from 'react-barcode';
import type { BarcodeElement, Symbology } from 'shared';
import { mmToPx } from '../../../utils/scale';
import { Code128Preview } from './Code128Preview';
import { BarcodeBitmapPreview } from './BarcodeBitmapPreview';
import { createEan13Bitmap } from 'shared/zpl';

const SYMBOLOGY_TO_FORMAT: Record<Symbology, string> = {
	code128: 'CODE128',
	ean13: 'EAN13',
	code39: 'CODE39',
	upc: 'UPC',
};

export function BarcodePreview({ element }: { element: BarcodeElement }) {
	const moduleWidthPx = element.symbology === 'code128' ? 1.5 : element.width;

	switch (element.symbology) {
		case 'code128':
			return <Code128Preview element={element} />;

		case 'ean13':
			return (
				<BarcodeBitmapPreview
					element={element}
					createBitmap={createEan13Bitmap}
				/>
			);
	}

	return (
		<Barcode
			value={element.content || ' '}
			format={SYMBOLOGY_TO_FORMAT[element.symbology] as never}
			height={mmToPx(element.height)}
			displayValue={element.showText}
			margin={0}
			width={moduleWidthPx}
		/>
	);
}

export function InvalidBarcodePreview({ symbology }: { symbology: Symbology }) {
	return (
		<div className='flex items-center justify-center border border-dashed border-red-400 px-2 py-1 text-[10px] text-red-500'>
			Contenido inválido para {symbology}
		</div>
	);
}
