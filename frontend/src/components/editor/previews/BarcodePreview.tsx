import Barcode from 'react-barcode';
import type { BarcodeElement, Symbology } from 'shared';
import { mmToPx } from '../../../utils/scale';

const SYMBOLOGY_TO_FORMAT: Record<Symbology, string> = {
	code128: 'CODE128',
	ean13: 'EAN13',
	code39: 'CODE39',
	upc: 'UPC',
};

export function BarcodePreview({ element }: { element: BarcodeElement }) {
	return (
		<Barcode
			value={element.content || ' '}
			format={SYMBOLOGY_TO_FORMAT[element.symbology] as never}
			height={mmToPx(element.height)}
			displayValue={element.showText}
			margin={0}
			width={1.5}
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
