import Barcode from 'react-barcode';
import type { BarcodeElement, Symbology } from 'shared';
import { mmToPx } from '../../../utils/scale';
import { calculateCode128Sizing } from 'shared/zpl';
import { useEditorStore } from '../../../store/useEditorStore';

const SYMBOLOGY_TO_FORMAT: Record<Symbology, string> = {
	code128: 'CODE128',
	ean13: 'EAN13',
	code39: 'CODE39',
	upc: 'UPC',
};

// text Test -> 123456789012

export function BarcodePreview({ element }: { element: BarcodeElement }) {
	const profile = useEditorStore((s) => s.profile);

	const dpi = profile?.dpi ?? 203;

	const sizing = element.symbology === 'code128' ? calculateCode128Sizing(element, dpi) : null;

	const moduleWidthPx = sizing ? mmToPx(sizing.moduleWidthDots / (dpi / 25.4)) : 1.5;

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
